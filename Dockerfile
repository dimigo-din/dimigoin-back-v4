FROM node:22-alpine AS base

###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM base AS development
WORKDIR /usr/src/app
COPY --chown=node:node package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY --chown=node:node . .
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM base AS build
WORKDIR /usr/src/app
COPY --chown=node:node package.json yarn.lock ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN yarn build \
    && yarn install --frozen-lockfile --production=true \
    && yarn cache clean

###################
# PRODUCTION
###################
FROM base AS production

RUN apk add --no-cache curl ca-certificates chromium \
    && update-ca-certificates \
    && yarn global add pm2 \
    && wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub \
    && echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories \
    && apk add doppler

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

COPY --chown=node:node entrypoint.sh ./

RUN chmod 700 ./entrypoint.sh

ENV NODE_ENV production

USER node

ENTRYPOINT ["./entrypoint.sh"]