# ============================================
# PAGTRACKER V4.0 - DOCKERFILE PRODUÇÃO
# ============================================
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY yarn.lock* ./

# Instalar dependências de produção
RUN npm install --production

# Stage 2: Builder  
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências da stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Definir variáveis de build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build da aplicação
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Instalar dependências do sistema
RUN apk add --no-cache \
    ca-certificates \
    curl \
    dumb-init

# Copiar arquivos necessários para produção
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar build da aplicação
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar certificados EfiPay
COPY --from=builder --chown=nextjs:nodejs /app/certificates ./certificates

# Configurar permissões
USER nextjs

# Expor portas
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Variables de ambiente padrão
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Comando de inicialização
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]