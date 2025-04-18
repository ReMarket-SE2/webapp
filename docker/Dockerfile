# Use Node.js LTS version as the base image
FROM node:20-alpine AS base

# Install dependencies for building native modules if needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Enable pnpm in the builder stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder /app/lib/db/migrate.ts ./lib/db/migrate.ts
COPY --from=builder /app/lib/db/index.ts ./lib/db/index.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.migrate.json ./tsconfig.migrate.json

# Enable pnpm and install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod
RUN pnpm add -D ts-node

# Create a script to run migrations and start the server
RUN echo -e '#!/bin/sh\n\
    if [ "$RUN_MIGRATIONS" = "true" ]; then\n\
    echo "Running database migrations..."\n\
    pnpm db:migrate || echo "Migration failed, but continuing..."\n\
    fi\n\
    echo "Starting server..."\n\
    exec node server.js\n\
    ' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV RUN_MIGRATIONS=true

# Start the Next.js application with migrations
CMD ["/app/docker-entrypoint.sh"]
