# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build args become env vars for Vite at build time
ARG VITE_SOLANA_NETWORK=devnet
ARG VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
ARG VITE_PROGRAM_ID
ARG VITE_API_URL=http://localhost:8080
ARG VITE_FEATURE_POLLS=true
ARG VITE_FEATURE_CONTENT_GATES=true
ARG VITE_FEATURE_REFERRALS=true
ARG VITE_FEATURE_ANALYTICS=true
ARG VITE_FEATURE_WIDGET=true

RUN npm run build

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:alpine

# SPA routing: all paths → index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /assets {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    gzip on;\n\
    gzip_types text/css application/javascript application/json image/svg+xml;\n\
    gzip_min_length 256;\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
