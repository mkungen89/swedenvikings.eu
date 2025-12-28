# ===========================================
# Sweden Vikings CMS - Production Dockerfile
# ===========================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build both client and server
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --workspace=server --omit=dev && npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma

# Generate Prisma client for production
RUN cd server && npx prisma generate

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs && \
    chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
