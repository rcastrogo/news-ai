
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
FROM base AS production-deps
ENV NODE_ENV=production
RUN npm ci --omit=dev
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
EXPOSE 4000
USER node
CMD ["npm", "start"]
