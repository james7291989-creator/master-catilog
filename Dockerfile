# ⚡ APEX FORTRESS DOCKERFILE ⚡
# Multi-stage build: minimal production image, non-root, no dev deps.

# --- Stage 1: Build ---
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (layer caching).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source + build.
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine AS runtime

# Non-root user for the web server.
RUN addgroup -S app && adduser -S app -G app

# Copy the built static assets.
COPY --from=build /app/dist /usr/share/nginx/html

# Hardened nginx config: no server tokens, strict security headers.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Drop privileges.
USER app

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]