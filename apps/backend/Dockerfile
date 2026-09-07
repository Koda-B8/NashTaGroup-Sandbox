FROM node:24-bookworm-slim

WORKDIR /app/apps/backend

COPY apps/backend/package.json apps/backend/package-lock.json ./

# Install the standalone backend lockfile, then rebuild native dependencies.
RUN npm ci --workspaces=false --omit=dev --ignore-scripts \
    && npm rebuild argon2 \
    && npm cache clean --force

COPY --chown=node:node apps/backend ./

ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.mjs"]
