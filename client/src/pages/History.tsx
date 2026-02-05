import { LayoutShell } from "@/components/layout-shell";
import { useChangelogs, useDeleteChangelog } from "@/hooks/use-changelogs";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Calendar, FileText, Code2, Loader2, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function History() {
  const { data: changelogs, isLoading } = useChangelogs();
  const deleteMutation = useDeleteChangelog();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Changelog content copied to clipboard.",
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (authLoading || isLoading) {
    return (
      <LayoutShell>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  if (!user) {
    return (
      <LayoutShell>
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display">Authentication Required</h2>
            <p className="text-muted-foreground max-w-md">
              Please sign in to view your changelog history and saved drafts.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8">
            <a href="/api/login">Sign In Now</a>
          </Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-2">Manage your past generated changelogs.</p>
        </div>

        {!changelogs || changelogs.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No history yet</h3>
            <p className="text-muted-foreground mt-1 mb-6">Generate your first changelog to see it here.</p>
            <Button asChild>
              <Link href="/">Create Changelog</Link>
            </Button>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {changelogs.map((log) => (
              <motion.div key={log.id} variants={item}>
                <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-background/80 hover:text-primary"
                      onClick={() => handleCopy(log.outputContent || "")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-xs font-mono">
                          {log.settings?.format || 'markdown'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(log.createdAt || Date.now()), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {log.title}
                      </h3>
                    </div>

                    <div className="h-24 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50 group-hover:to-card/20 transition-all pointer-events-none" />
                      <p className="text-sm text-muted-foreground line-clamp-3 font-mono opacity-80">
                        {log.outputContent}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Badge variant="outline" className="border-white/10 text-xs bg-transparent">
                        {log.sourceType}
                      </Badge>
                      {log.settings?.template && (
                        <Badge variant="outline" className="border-white/10 text-xs bg-transparent capitalize">
                          {log.settings.template}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </LayoutShell>
  );
}
