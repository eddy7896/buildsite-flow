# Production Frontend Dockerfile - Multi-stage build for React + Vite
# Stage 1: Build stage - installs all deps and builds the app
FROM node:20-alpine AS builder

ARG VITE_API_URL
ARG VITE_DATABASE_URL=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DATABASE_URL=${VITE_DATABASE_URL}

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies needed for build)
# Don't set NODE_ENV=production here - we need devDependencies for vite
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
        npm ci --include=dev || npm install; \
    else \
        npm install; \
    fi

# Copy build configuration files
COPY vite.config.ts tailwind.config.ts postcss.config.js components.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY index.html ./

# Copy source code
# Use .dockerignore to exclude node_modules, but copy everything else
COPY src ./src
COPY public ./public

# Add a build timestamp to bust cache if source changes
ARG BUILD_DATE=unknown
ENV BUILD_DATE=${BUILD_DATE}

# Build the application for production (VITE_API_URL is available as env var)
RUN npm run build

# Stage 2: Production stage - minimal nginx image
FROM nginx:alpine

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user and set permissions (nginx user/group may already exist)
RUN (addgroup -g 1001 -S nginx || true) && \
    (adduser -S nginx -u 1001 -G nginx || id nginx > /dev/null 2>&1 || adduser -S nginx -u 1001 || true) && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user for security
USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
