# Stage 1: Build the NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source and config
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Generate Prisma Client and compile NestJS
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Entrypoint runs prisma migrations and starts the server
CMD ["node", "dist/src/main.js"]
