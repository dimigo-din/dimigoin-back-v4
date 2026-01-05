FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM base AS development
WORKDIR /usr/src/app
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM base AS build
WORKDIR /usr/src/app
COPY --chown=node:node package.json pnpm-lock.yaml ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN pnpm run build \
    && pnpm install --frozen-lockfile --prod

###################
# PRODUCTION
###################
FROM base AS production

RUN apk add --no-cache curl ca-certificates chromium \
    && update-ca-certificates \
    && npm install -g pm2 \
    && wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub \
    && echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories \
    && apk add doppler

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

COPY --chown=node:node entrypoint.sh package.json pnpm-lock.yaml ./

RUN chmod 700 ./entrypoint.sh

ENV NODE_ENV production

USER node

ENTRYPOINT ["./entrypoint.sh"]
