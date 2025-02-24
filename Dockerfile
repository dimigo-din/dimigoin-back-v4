FROM node:18-alpine AS base

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

COPY --chown=node:node .env ./
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

RUN apk add --update docker

CMD [ "node", "dist/main.js" ]