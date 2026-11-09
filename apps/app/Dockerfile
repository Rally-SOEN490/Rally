# Copyright (c) 2026 Rally. All rights reserved.
# AI contribution: 50% or more AI-generated

# Development image for the Expo dev server, started by docker-compose.yml in the repo root.
# `docker compose up --watch` copies saved files into the container, so code changes don't need a rebuild.
FROM node:22-bookworm-slim

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node apps/app/package.json apps/app/package-lock.json ./
RUN npm ci

COPY --chown=node:node apps/app/app.json apps/app/tsconfig.json ./
COPY --chown=node:node apps/app/assets ./assets
COPY --chown=node:node apps/app/src ./src
COPY --chown=node:node apps/shared /shared

EXPOSE 8081
CMD ["npx", "expo", "start", "--dev-client"]
