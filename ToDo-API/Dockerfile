############################################
# Production Dockerfile for Todo-API (Node)
############################################

FROM node:20-alpine AS deps
WORKDIR /app

# Install only what we need to install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy source after deps for better caching
COPY . .

# Prisma client generation is required at runtime.
RUN npx prisma generate

# Move prune here! Shrink the folder BEFORE we copy it to the final image
RUN npm prune --omit=dev


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create the user
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# THE FIX: Copy the files and set ownership at the exact same time (Takes milliseconds)
COPY --from=deps --chown=nodeuser:nodejs /app /app


# ---> ADD THIS EXACT LINE <---
RUN mkdir -p /app/logs && chown nodeuser:nodejs /app/logs

# Now we drop privileges
USER nodeuser

EXPOSE 3000

CMD npx prisma db push && node index.js