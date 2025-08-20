FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY ./src ./src
COPY .env.example .env.example

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

# Change ownership to the appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8080
CMD ["node", "src/index.js"]
