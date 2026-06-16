# Farmaze Client Dashboard — Multi-stage build
# Stage 1: Build the Vite/React app
FROM node:18-alpine AS builder

WORKDIR /app

# Install bun for faster builds (matches local dev)
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN bun install --frozen-lockfile 2>/dev/null || npm ci

# Copy source code
COPY . .

# Build args for environment variables (injected at build time)
ARG VITE_API_URL
ARG VITE_ANALYTICS_API_URL
ARG VITE_AGENT_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Expose ARGs as ENVs so Vite can read them during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ANALYTICS_API_URL=$VITE_ANALYTICS_API_URL
ENV VITE_AGENT_API_URL=$VITE_AGENT_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Build the app
RUN bun run build 2>/dev/null || npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
