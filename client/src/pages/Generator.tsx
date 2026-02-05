import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Copy, Github, PenLine, Wand2, Save, FileText, Code2, Sparkles, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useGenerateChangelog, useSaveChangelog } from "@/hooks/use-changelogs";
import { generateChangelogSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LayoutShell } from "@/components/layout-shell";
import { Badge } from "@/components/ui/badge";

// Form schema derived from shared schema
const formSchema = generateChangelogSchema;
type FormData = z.infer<typeof formSchema>;

export default function Generator() {
  const [activeTab, setActiveTab] = useState<"manual" | "github">("manual");
  const [generatedResult, setGeneratedResult] = useState<{ title: string; changelog: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const generateMutation = useGenerateChangelog();
  const saveMutation = useSaveChangelog();
  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: "manual",
      format: "markdown",
      template: "feature",
      instructions: "",
    }
  });

  const onSubmit = (data: FormData) => {
    generateMutation.mutate(data, {
      onSuccess: (result) => {
        setGeneratedResult(result);
        toast({
          title: "Changelog Generated!",
          description: "Review the result below.",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.changelog);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Changelog copied to clipboard.",
    });
  };

  const handleSave = () => {
    if (!generatedResult) return;
    saveMutation.mutate({
      title: generatedResult.title,
      inputContent: watch("content") || "GitHub Import",
      outputContent: generatedResult.changelog,
      sourceType: watch("sourceType"),
      settings: {
        format: watch("format"),
        template: watch("template"),
        repo: watch("githubConfig.repo"),
      }
    });
  };

  const format = watch("format");

  return (
    <LayoutShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-foreground">
              New <span className="text-gradient">Changelog</span>
            </h1>
            <p className="text-muted-foreground">Turn messy commits and notes into polished release notes.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs 
              defaultValue="manual" 
              value={activeTab} 
              onValueChange={(v) => {
                setActiveTab(v as any);
                setValue("sourceType", v as any);
              }}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50 p-1 rounded-xl h-12">
                <TabsTrigger 
                  value="manual"
                  className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium"
                >
                  <PenLine className="w-4 h-4 mr-2" />
                  Manual Input
                </TabsTrigger>
                <TabsTrigger 
                  value="github"
                  className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Import
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-6">
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground/80">Raw Notes / Commits</Label>
                    <Textarea 
                      {...register("content")}
                      placeholder="- Fixed login bug&#10;- Added new dashboard&#10;- Improved performance on mobile"
                      className="min-h-[240px] bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 resize-none font-mono text-sm leading-relaxed rounded-xl shadow-inner"
                    />
                    {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="github" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Owner / Org</Label>
                      <Input 
                        {...register("githubConfig.owner")} 
                        placeholder="vercel" 
                        className="bg-background/50 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Repo Name</Label>
                      <Input 
                        {...register("githubConfig.repo")} 
                        placeholder="next.js" 
                        className="bg-background/50 border-white/10 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Personal Access Token <span className="text-xs text-muted-foreground">(Optional for public)</span></Label>
                    <Input 
                      type="password"
                      {...register("githubConfig.token")} 
                      placeholder="ghp_..." 
                      className="bg-background/50 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Tag</Label>
                      <Input 
                        {...register("githubConfig.fromTag")} 
                        placeholder="v1.0.0" 
                        className="bg-background/50 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Tag</Label>
                      <Input 
                        {...register("githubConfig.toTag")} 
                        placeholder="v1.1.0" 
                        className="bg-background/50 border-white/10 rounded-xl"
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select onValueChange={(v) => setValue("format", v as any)} defaultValue="markdown">
                  <SelectTrigger className="bg-background/50 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template Style</Label>
                <Select onValueChange={(v) => setValue("template", v as any)} defaultValue="feature">
                  <SelectTrigger className="bg-background/50 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature Release</SelectItem>
                    <SelectItem value="bugfix">Bug Fixes</SelectItem>
                    <SelectItem value="update">General Update</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Instructions <span className="text-xs text-muted-foreground">(Optional)</span></Label>
              <Input 
                {...register("instructions")} 
                placeholder="e.g. Keep it funny, focus on performance..." 
                className="bg-background/50 border-white/10 rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              disabled={generateMutation.isPending}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Crafting Magic...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Changelog
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between h-[42px]">
            <h2 className="text-xl font-display font-bold">Preview</h2>
            {generatedResult && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-lg border-white/10 hover:bg-white/5">
                  {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending || !user}
                  className="rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          <Card className="min-h-[600px] border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl">
            {generatedResult ? (
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                      {watch("template")}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-mono">{watch("format")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Generated just now</span>
                </div>
                
                <div className="p-6 flex-1 overflow-auto custom-scrollbar">
                  {format === 'markdown' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:text-accent prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-white/5">
                      <ReactMarkdown>{generatedResult.changelog}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="font-mono text-sm text-muted-foreground whitespace-pre-wrap">
                      {generatedResult.changelog}
                    </pre>
                  )}
                </div>
              </CardContent>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Ready to Generate</h3>
                <p className="max-w-xs mx-auto">Enter your notes or connect a repo to generate a beautiful changelog instantly.</p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </LayoutShell>
  );
}
