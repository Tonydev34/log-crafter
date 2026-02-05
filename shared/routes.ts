import { z } from 'zod';
import { insertChangelogSchema, changelogs, generateChangelogSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  changelogs: {
    list: {
      method: 'GET' as const,
      path: '/api/changelogs',
      responses: {
        200: z.array(z.custom<typeof changelogs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/changelogs/:id',
      responses: {
        200: z.custom<typeof changelogs.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/changelogs/generate',
      input: generateChangelogSchema,
      responses: {
        200: z.object({
          changelog: z.string(),
          title: z.string(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    create: { // Save a generated changelog
      method: 'POST' as const,
      path: '/api/changelogs',
      input: insertChangelogSchema,
      responses: {
        201: z.custom<typeof changelogs.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/changelogs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // GitHub helper endpoint to list tags/commits (optional, for better UX)
  github: {
    tags: {
      method: 'POST' as const,
      path: '/api/github/tags',
      input: z.object({
        owner: z.string(),
        repo: z.string(),
        token: z.string().optional(),
      }),
      responses: {
        200: z.array(z.string()), // List of tag names
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
