#!/bin/sh
doppler run -c $deploy_type -t $doppler_token -- bun run migration:prod
exec doppler run -c $deploy_type -t $doppler_token -- bun run dist/cluster.js