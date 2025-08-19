FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY ./src ./src
COPY .env.example .env.example

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

EXPOSE 8080
CMD ["node", "src/index.js"]
