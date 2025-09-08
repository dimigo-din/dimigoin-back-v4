FROM node:22-alpine AS base


# INSTALL DEPENDENCIES FOR DEVELOPMENT (FOR NEST)
FROM base AS deps
WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile;

USER node

# INSTALL DEPENDENCIES & BUILD FOR PRODUCTION
FROM base AS build
WORKDIR /usr/src/app

COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

RUN yarn build

ENV NODE_ENV production
RUN yarn --frozen-lockfile --production;
RUN rm -rf ./.next/cache

USER node

# PRODUCTION IMAGE
FROM base AS production
WORKDIR /usr/src/app

COPY --chown=node:node .env.prod ./
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /usr/src/app/ ./

ENV NODE_ENV="prod"
ENV TZ="Asia/Seoul"

RUN apk add tzdata
RUN yarn global add pm2

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENTRYPOINT ["pm2-runtime", "start", "dist/main.js", "--name", "dimigoin-back", "-i", "12"]