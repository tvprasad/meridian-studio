# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bake environment into the bundle at build time (Vite inlines import.meta.env.*)
ARG VITE_API_BASE_URL=https://api.vplsolutions.com
ARG VITE_MCP_BASE_URL=https://mcp.vplsolutions.com
ARG VITE_AUTH_ENABLED=false
ARG VITE_AZURE_CLIENT_ID=
ARG VITE_AZURE_TENANT_ID=common
ARG VITE_AZURE_REDIRECT_URI=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MCP_BASE_URL=$VITE_MCP_BASE_URL
ENV VITE_AUTH_ENABLED=$VITE_AUTH_ENABLED
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_REDIRECT_URI=$VITE_AZURE_REDIRECT_URI

RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
