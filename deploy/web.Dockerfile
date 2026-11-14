# Image « web » : construit le frontend React, puis le sert avec Caddy.
# Caddy est aussi le reverse proxy vers Django et gère le HTTPS (Let's Encrypt) automatiquement.
# Contexte de build : la racine du dépôt (voir docker-compose.yml).

# --- Étape 1 : build du frontend ---------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Étape 2 : serveur web ---------------------------------------------------
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/app
