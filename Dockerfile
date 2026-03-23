# ── Estágio 1: Build ────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Declara os argumentos de build (vindos do docker-compose)
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_API_USER
ARG REACT_APP_API_PASS
ARG REACT_APP_API_KEY

# Transforma os ARGs em variáveis de ambiente para o React
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_API_USER=$REACT_APP_API_USER
ENV REACT_APP_API_PASS=$REACT_APP_API_PASS
ENV REACT_APP_API_KEY=$REACT_APP_API_KEY

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

# O React incorpora as ENV acima no bundle durante o build
RUN npm run build

# ── Estágio 2: Produção ──────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]