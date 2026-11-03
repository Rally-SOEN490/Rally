# Copyright (c) 2026 Rally. All rights reserved.
# AI contribution: 50% or more AI-generated

# Development image for the API, started by docker-compose.yml in the repo root.
# `docker compose up --watch` copies saved files from src/ into the container, so code changes don't need a rebuild.
FROM node:22-bookworm-slim

# Prisma's migration engine needs OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app
USER node

# Installing runs `prisma generate`, which needs the schema.
COPY --chown=node:node package.json package-lock.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
RUN npm ci

COPY --chown=node:node src ./src

EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy && npm run dev"]
