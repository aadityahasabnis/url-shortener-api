FROM node:24-bookworm-slim

WORKDIR /app

ENV DATABASE_URL=postgresql://admin:admin@db:5432/shortener?schema=public

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-lc", "npm run prisma:deploy && npm start"]