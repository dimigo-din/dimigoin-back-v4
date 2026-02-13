FROM oven/bun:alpine AS base

FROM base AS system-deps
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache curl ca-certificates \
    && update-ca-certificates \
    && wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub \
    && echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories \
    && apk add doppler

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./

FROM deps AS prod-deps
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM deps AS build
WORKDIR /app
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM system-deps AS production
ENV NODE_ENV=prod
WORKDIR /app
COPY --chown=bun:bun --from=build /app/dist ./dist
COPY --chown=bun:bun --from=build /app/src ./src
COPY --chown=bun:bun --from=build /app/drizzle ./drizzle
COPY --chown=bun:bun --from=prod-deps /app/node_modules ./node_modules
COPY --chown=bun:bun entrypoint.sh package.json tsconfig.json drizzle.config.ts ./
RUN chmod 700 ./entrypoint.sh
USER bun
ENTRYPOINT ["./entrypoint.sh"]