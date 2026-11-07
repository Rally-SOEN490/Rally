# Copyright (c) 2026 Rally. All rights reserved.
# AI contribution: 50% or more AI-generated

# Development image for the Expo dev server, started by docker-compose.yml in the repo root.
# `docker compose up --watch` copies saved files into the container, so code changes don't need a rebuild.
FROM node:22-bookworm-slim

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node app.json tsconfig.json ./
COPY --chown=node:node assets ./assets
COPY --chown=node:node src ./src

EXPOSE 8081
CMD ["npx", "expo", "start", "--dev-client"]
