# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Copy migrations files (Drizzle needs the SQL files to migrate in production)
COPY src/infrastructure/database/migrations ./dist/infrastructure/database/migrations

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "node dist/infrastructure/database/migrate.js && node dist/index.js"]
