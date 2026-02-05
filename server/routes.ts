import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- API Routes ---

  // Generate Changelog (AI)
  app.post(api.changelogs.generate.path, async (req, res) => {
    try {
      // Allow unauthenticated generation for "try it out" (guest mode)?
      // For now, let's allow it but warn or limit if costly. 
      // User requirements: "No login required for free tier" (MVP). 
      // So we don't enforce isAuthenticated here.

      const input = api.changelogs.generate.input.parse(req.body);

      let contentToProcess = input.content || "";

      // If GitHub source, fetch commits
      if (input.sourceType === "github" && input.githubConfig) {
        const { owner, repo, token, fromTag, toTag } = input.githubConfig;
        if (!owner || !repo) {
          return res.status(400).json({ message: "Owner and Repo required for GitHub source" });
        }
        
        // Fetch commits (simplified logic: get recent commits or compare tags)
        // If tags provided: compare. If not: just list commits?
        // Let's assume list commits for now if no tags, or compare if tags exist.
        
        let apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
        if (fromTag && toTag) {
          apiUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${fromTag}...${toTag}`;
        }

        const headers: Record<string, string> = {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Replit-Changelog-Generator"
        };
        if (token) {
          headers["Authorization"] = `token ${token}`;
        }

        const ghRes = await fetch(apiUrl, { headers });
        if (!ghRes.ok) {
          const err = await ghRes.text();
          return res.status(400).json({ message: `GitHub API Error: ${err}` });
        }

        const data = await ghRes.json();
        
        let commits = [];
        if (fromTag && toTag) {
          commits = data.commits || [];
        } else {
          commits = Array.isArray(data) ? data : [];
        }

        // Format commits for AI
        contentToProcess = commits.map((c: any) => {
          return `- ${c.commit.message} (Author: ${c.commit.author.name})`;
        }).join("\n");
      }

      if (!contentToProcess) {
         return res.status(400).json({ message: "No content to process. Please provide manual input or valid GitHub details." });
      }

      // AI Generation
      const prompt = `
        You are an expert Changelog Generator.
        Action: Convert the following raw technical notes/commits into a polished, professional changelog.
        
        Settings:
        - Format: ${input.format}
        - Template Style: ${input.template}
        - Instructions: ${input.instructions || "Clean up technical jargon, group by Features/Fixes/Improvements, remove duplicates."}

        Raw Input:
        ${contentToProcess}

        Return ONLY the generated content. No preamble.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1", // Use best model for reasoning/formatting
        messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
        max_completion_tokens: 2048,
      });

      const generatedText = response.choices[0]?.message?.content || "Failed to generate.";

      // Return result
      res.json({
        changelog: generatedText,
        title: `Changelog - ${new Date().toLocaleDateString()}`
      });

    } catch (err) {
      console.error("Generate error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // List Changelogs (Protected)
  app.get(api.changelogs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const logs = await storage.listChangelogs(userId);
    res.json(logs);
  });

  // Create/Save Changelog (Protected)
  app.post(api.changelogs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.changelogs.create.input.parse(req.body);
      // Enforce userId from session
      const userId = req.user.claims.sub;
      const log = await storage.createChangelog({ ...input, userId });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error" });
      }
      res.status(500).json({ message: "Failed to save" });
    }
  });

  // Delete Changelog (Protected)
  app.delete(api.changelogs.delete.path, isAuthenticated, async (req: any, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getChangelog(id);
    if (!existing || existing.userId !== req.user.claims.sub) {
      return res.status(404).json({ message: "Not found" });
    }
    await storage.deleteChangelog(id);
    res.status(204).send();
  });

  // Get Changelog (Protected)
  app.get(api.changelogs.get.path, isAuthenticated, async (req: any, res) => {
    const id = Number(req.params.id);
    const log = await storage.getChangelog(id);
    if (!log || log.userId !== req.user.claims.sub) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(log);
  });

  // GitHub Tags Proxy
  app.post(api.github.tags.path, async (req, res) => {
    const { owner, repo, token } = req.body;
    if (!owner || !repo) return res.status(400).json({ message: "Missing owner/repo" });

    try {
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Replit-Changelog-Generator"
      };
      if (token) headers["Authorization"] = `token ${token}`;

      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`, { headers });
      if (!ghRes.ok) throw new Error("Failed to fetch tags");
      
      const data = await ghRes.json();
      const tags = Array.isArray(data) ? data.map((t: any) => t.name) : [];
      res.json(tags);
    } catch (err) {
      res.status(400).json({ message: "Failed to fetch tags from GitHub" });
    }
  });

  return httpServer;
}
