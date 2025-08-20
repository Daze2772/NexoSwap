FROM node:18-slim AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY ./src ./src

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src ./src
COPY package*.json ./

# Change ownership to the appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8080
CMD ["node", "src/index.js"]
