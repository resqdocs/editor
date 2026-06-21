# ResQDocs Protokoll-Editor - statischer Build hinter nginx, Auslieferung ueber HTTP.
# TLS/Domain/Zertifikate uebernimmt ein externer Reverse Proxy (siehe deploy/README.md).
# Multi-Stage: Node baut das statische Bundle, nginx serviert es.
#
# WICHTIG: Build-Kontext ist das REPO-WURZELVERZEICHNIS (nicht der App-Ordner),
# weil der Editor das lokale Paket packages/shared (@resqdocs/protocol-core) und
# die kanonischen Seeds aus protocols/ braucht - beide liegen ausserhalb des
# App-Ordners. Bauen z. B. ueber compose (context: ../../) oder vom Repo-Root:
#   docker build -f apps/protocol-editor/Dockerfile -t resqdocs-editor:latest .

FROM node:22-alpine AS build
WORKDIR /repo
# Geteilte Logik + kanonische Seeds (read-only Abhaengigkeiten des Editors).
COPY packages/shared/ ./packages/shared/
COPY protocols/ ./protocols/
# Editor: gezielt nur Manifest + Quellen kopieren. Der Build-Kontext ist die
# Repo-Wurzel, daher greift KEINE App-lokale .dockerignore - deshalb hier explizit
# kein node_modules/dist mitkopieren (npm ci installiert frisch).
COPY apps/protocol-editor/package.json apps/protocol-editor/package-lock.json ./apps/protocol-editor/
COPY apps/protocol-editor/tsconfig.json apps/protocol-editor/tsconfig.app.json apps/protocol-editor/tsconfig.node.json ./apps/protocol-editor/
COPY apps/protocol-editor/vite.config.ts apps/protocol-editor/index.html ./apps/protocol-editor/
COPY apps/protocol-editor/src/ ./apps/protocol-editor/src/
WORKDIR /repo/apps/protocol-editor
# Loest die file:-Abhaengigkeit @resqdocs/protocol-core -> ../../packages/shared auf.
RUN npm ci
RUN npm run build

FROM nginx:1.27-alpine AS runtime
# Server-Config: einzige Quelle der Wahrheit ist deploy/nginx.conf (gleiche
# Datei wie im Compose-Weg). Aus dem Build-Kontext (Repo-Wurzel) kopiert.
COPY apps/protocol-editor/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/protocol-editor/dist /usr/share/nginx/html
# Unprivilegiert: nginx-alpine kann auf 8081 ohne root lauschen.
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8081/ >/dev/null || exit 1
