FROM node:18.15.0

WORKDIR /home/app

COPY package.json yarn.lock ./

RUN yarn

COPY . .
COPY .env ./.env

RUN yarn patch-package && yarn prisma generate && yarn build

EXPOSE 3000

CMD [ "node", "dist/main.js" ]

#  AS builder

# WORKDIR /home/app

# ARG MAX_OLD_SPACE_SIZE=4096
# ENV NODE_OPTIONS=--max_old_space_size=$MAX_OLD_SPACE_SIZE

# COPY package*.json yarn.lock ./

# RUN yarn install --frozen-lockfile

# COPY patches/ ./patches/
# COPY prisma/ ./prisma/
# COPY src/ ./src/
# COPY tsconfig*.json nest-cli.json .env ./
# RUN yarn patch-package && yarn prisma generate && yarn build

# FROM node:18.15.0-alpine

# WORKDIR /home/app

# COPY --from=builder /home/app/dist/ ./dist/
# COPY --from=builder /home/app/node_modules/ ./node_modules/
# COPY --from=builder /home/app/src/ ./src/
# COPY tsconfig*.json package*.json yarn.lock .env ./

# EXPOSE 3000

# CMD ["yarn start:prod"]
# # CMD yarn start:prod
