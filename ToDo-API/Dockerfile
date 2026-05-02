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
# This runs during build so the runtime image doesn't need dev dependencies.
RUN npx prisma generate


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create the user
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copy code
COPY --from=deps --chown=nodeuser:nodejs /app /app

# Reduce image size
RUN npm prune --omit=dev

# THE FIX: Create the logs directory and ONLY change ownership of that specific folder
RUN mkdir -p ./logs && chown nodeuser:nodejs ./logs

# Now we drop privileges
USER nodeuser

EXPOSE 3000

CMD ["node", "index.js"]