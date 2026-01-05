#!/bin/sh

doppler run -c $deploy_type -t $doppler_token -- pnpm run migration:prod
doppler run -c $deploy_type -t $doppler_token -- pm2 start dist/src/main.js --name dimigoin-back -i ${PM2_INSTANCES:-1}
pm2 logs dimigoin-back