# LogCraft - Changelog Generator

## Overview

LogCraft is a web-based Changelog Generator designed for indie SaaS founders, startups, and small dev teams. It helps users generate clean, professional changelogs and release notes in under 30 seconds — no Git knowledge required.

The app supports two input modes: **manual entry** (type in features, bug fixes, improvements) and **GitHub integration** (fetch commits from a repo). It uses AI (OpenAI) to transform raw input into polished changelogs in multiple output formats (Markdown, HTML, plain text) using SaaS-friendly templates.

Key pages:
- **Generator** (`/`) — The main tool where users input changes and generate changelogs
- **History** (`/history`) — View and manage previously saved changelogs (requires auth)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, dark-mode-centric design
- **Animations**: Framer Motion for page transitions and UI animations
- **Markdown Rendering**: react-markdown for previewing generated changelogs
- **Fonts**: Inter (sans), Space Grotesk (display), JetBrains Mono (mono) — loaded via CSS variables `--font-sans`, `--font-display`, `--font-mono`
- **Build Tool**: Vite with React plugin, path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **AI Integration**: OpenAI SDK (configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` env vars) for generating changelog content from user input
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, session-based auth stored in PostgreSQL via `connect-pg-simple`
- **Session Secret**: Requires `SESSION_SECRET` environment variable

### Shared Code (`shared/`)
- **Schema**: Drizzle ORM table definitions in `shared/schema.ts` — serves as single source of truth for both DB and API validation
- **Routes Contract**: `shared/routes.ts` defines API route paths, methods, input/output Zod schemas — used by both client and server
- **Validation**: Zod schemas for all API inputs, with `drizzle-zod` for auto-generating insert schemas from table definitions

### Database
- **Database**: PostgreSQL (required, via `DATABASE_URL` env var)
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Schema Push**: `npm run db:push` to sync schema to database
- **Key Tables**:
  - `users` — User accounts (Replit Auth managed)
  - `sessions` — Express sessions for auth persistence
  - `changelogs` — Saved changelog entries with input, output, source type, and settings (JSONB)
  - `conversations` / `messages` — Chat models (from Replit integration blueprints, not core to the app)

### Build & Deployment
- **Dev**: `npm run dev` — runs Express + Vite dev server with HMR
- **Build**: `npm run build` — Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` — serves built assets via Express static middleware
- **Deployment Config**: Vercel config present (`vercel.json`) as alternative deployment target

### Replit Integrations (Pre-built Modules)
Located in `server/replit_integrations/` and `client/replit_integrations/`:
- **Auth** — Replit OIDC authentication (mandatory, don't remove `users` and `sessions` tables)
- **Chat** — Conversation/message CRUD with OpenAI streaming
- **Audio** — Voice recording, playback, and streaming utilities
- **Image** — Image generation via `gpt-image-1`
- **Batch** — Rate-limited batch processing utilities

These are pre-wired integration modules. The core app primarily uses Auth and the OpenAI client for changelog generation.

## External Dependencies

- **PostgreSQL** — Primary database, connection via `DATABASE_URL` environment variable
- **OpenAI API** — Used for AI-powered changelog generation; configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **GitHub API** — Optional integration for fetching commit messages from repositories (user provides their own token)
- **Replit Auth (OIDC)** — Authentication provider via `ISSUER_URL` (defaults to `https://replit.com/oidc`); requires `REPL_ID` and `SESSION_SECRET` env vars
- **Google Fonts** — Inter, Space Grotesk, JetBrains Mono loaded via CSS imports