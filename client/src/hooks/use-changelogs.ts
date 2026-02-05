import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type GenerateChangelogRequest, errorSchemas } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useChangelogs() {
  const { toast } = useToast();

  return useQuery({
    queryKey: [api.changelogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.changelogs.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized in UI
      if (!res.ok) throw new Error("Failed to fetch changelogs");
      return api.changelogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useChangelog(id: number) {
  return useQuery({
    queryKey: [api.changelogs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.changelogs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch changelog");
      return api.changelogs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useGenerateChangelog() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: GenerateChangelogRequest) => {
      const validated = api.changelogs.generate.input.parse(data);
      const res = await fetch(api.changelogs.generate.path, {
        method: api.changelogs.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = errorSchemas.validation.parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 401) {
          throw new Error("Please log in to generate changelogs.");
        }
        throw new Error("Failed to generate changelog");
      }
      
      return api.changelogs.generate.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSaveChangelog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.changelogs.create.input>) => {
      const validated = api.changelogs.create.input.parse(data);
      const res = await fetch(api.changelogs.create.path, {
        method: api.changelogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to save changelog");
      return api.changelogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.changelogs.list.path] });
      toast({
        title: "Saved!",
        description: "Your changelog has been saved to history.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteChangelog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.changelogs.delete.path, { id });
      const res = await fetch(url, { 
        method: api.changelogs.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete changelog");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.changelogs.list.path] });
      toast({
        title: "Deleted",
        description: "Changelog removed from history.",
      });
    },
  });
}
