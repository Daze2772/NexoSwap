FROM node:18-slim AS builder
WORKDIR /app

ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app

RUN npm install -g serve
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT env var; serve must bind to it.
ENV PORT=8080
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
