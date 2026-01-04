FROM node:22-alpine AS base

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM base AS development

# Create app directory
WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./

# Install app dependencies using the `yarn --frozen-lockfile` command instead of `npm install`
RUN yarn --frozen-lockfile

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM base AS build

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN yarn build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

USER node

###################
# PRODUCTION
###################

FROM base AS production

ARG DEPLOY_TYPE
ARG DOPPLER_TOKEN

WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node . .

RUN apk add --no-cache curl ca-certificates \
 && update-ca-certificates
RUN apk add chromium
RUN yarn global add pm2
RUN chmod 700 ./entrypoint.sh
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
  echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
  apk add doppler

ENTRYPOINT ["./entrypoint.sh"]
