FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS system-deps
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache curl ca-certificates \
    && update-ca-certificates \
    && pnpm install -g pm2 \
    && wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub \
    && echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories \
    && apk add doppler

FROM base AS deps
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM deps AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --offline --ignore-scripts

FROM deps AS build
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

COPY . .
RUN pnpm run build

FROM system-deps AS production

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node entrypoint.sh package.json tsconfig.json ./

RUN chmod 700 ./entrypoint.sh

USER node

ENTRYPOINT ["./entrypoint.sh"]