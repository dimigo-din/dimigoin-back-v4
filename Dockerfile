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

# Ensure pm2 is available at runtime

WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node . .

RUN yarn global add pm2
RUN chmod 700 ./entrypoint.sh
RUN apk add chromium

ENV NODE_ENV prod

# Start the server using the production build
ENTRYPOINT ["./entrypoint.sh"]
