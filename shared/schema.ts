import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth and Chat models from the blueprints
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === CHANGELOGS TABLE ===
export const changelogs = pgTable("changelogs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id), // Optional: can be null for guest? No, MVP requires login for history.
  title: text("title").notNull().default("Untitled Changelog"),
  inputContent: text("input_content"), // The raw input (manual or commit list)
  outputContent: text("output_content"), // The generated markdown/html
  sourceType: text("source_type").notNull().default("manual"), // 'manual' | 'github'
  settings: jsonb("settings").$type<{
    format: "markdown" | "html" | "text";
    template: "feature" | "bugfix" | "update" | "mobile";
    repo?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChangelogSchema = createInsertSchema(changelogs).omit({ 
  id: true, 
  createdAt: true 
});

export type Changelog = typeof changelogs.$inferSelect;
export type InsertChangelog = z.infer<typeof insertChangelogSchema>;

// Request types
export const generateChangelogSchema = z.object({
  sourceType: z.enum(["manual", "github"]),
  content: z.string().optional(), // For manual
  githubConfig: z.object({
    repo: z.string().optional(),
    owner: z.string().optional(),
    token: z.string().optional(),
    fromTag: z.string().optional(),
    toTag: z.string().optional(),
  }).optional(),
  format: z.enum(["markdown", "html", "text"]),
  template: z.enum(["feature", "bugfix", "update", "mobile", "standard"]),
  instructions: z.string().optional(), // Custom AI instructions
});

export type GenerateChangelogRequest = z.infer<typeof generateChangelogSchema>;
