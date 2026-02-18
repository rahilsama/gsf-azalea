FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src




RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/server.js"]

