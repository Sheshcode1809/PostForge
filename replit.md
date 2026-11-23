# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- `artifacts/linkedin-generator` — LinkedIn Post Generator web app (React + Vite). Mounted at `/`.
- `artifacts/api-server` — Express API. Endpoint `POST /api/posts/generate` calls OpenAI (gpt-5.4) via Replit AI Integrations to produce a LinkedIn post and hashtags from a topic, tone, length, audience, and toggles.
- `lib/integrations-openai-ai-server` — OpenAI client (auto-configured via Replit AI Integrations env vars).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
