# ═══════════════════════════════════════════════
# HomeAsisstan — Production Dockerfile
# Multi-stage build: shared → database → server → web → final
# ═══════════════════════════════════════════════

# ── Base ──────────────────────────────────────

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# ── Dependencies ──────────────────────────────

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

# ── Build shared ──────────────────────────────

FROM deps AS build-shared
COPY packages/shared packages/shared
RUN pnpm --filter @homeassistan/shared build

# ── Build database ────────────────────────────

FROM build-shared AS build-database
COPY packages/database packages/database
RUN pnpm --filter @homeassistan/database build

# ── Build server ──────────────────────────────

FROM build-database AS build-server
COPY packages/server packages/server
RUN pnpm --filter @homeassistan/server build

# ── Build web ─────────────────────────────────

FROM build-database AS build-web
COPY packages/web packages/web
RUN pnpm --filter @homeassistan/web build

# ── Production image ──────────────────────────

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=build-server /app/packages/server/dist packages/server/dist
COPY --from=build-server /app/packages/server/package.json packages/server/
COPY --from=build-database /app/packages/database/dist packages/database/dist
COPY --from=build-database /app/packages/database/package.json packages/database/
COPY --from=build-database /app/packages/database/drizzle packages/database/drizzle
COPY --from=build-shared /app/packages/shared/dist packages/shared/dist
COPY --from=build-shared /app/packages/shared/package.json packages/shared/
COPY --from=build-web /app/packages/web/dist packages/web/dist

# Root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
