FROM node:18.15.0-alpine AS builder

WORKDIR /home/app

ARG MAX_OLD_SPACE_SIZE=4096
ENV NODE_OPTIONS=--max_old_space_size=$MAX_OLD_SPACE_SIZE

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY patches/ ./patches/
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY tsconfig*.json nest-cli.json ./

RUN yarn patch-package && yarn prisma generate && yarn build

FROM node:18.15.0-alpine

WORKDIR /home/app

COPY --from=builder /home/app/dist/ ./dist/
COPY --from=builder /home/app/node_modules/ ./node_modules/
COPY tsconfig*.json package.json yarn.lock ./

EXPOSE 3000

CMD yarn start:prod
