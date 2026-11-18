
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
FROM base AS dependencies
RUN npm ci
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
