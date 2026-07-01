FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm run build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["pnpm", "start"]