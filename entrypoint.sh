#!/bin/sh

doppler run -c $(cat deploy_type) -t $(cat doppler_token) -- npm run migration:prod
doppler run -c $(cat deploy_type) -t $(cat doppler_token) -- pm2 start dist/src/main.js --name dimigoin-back -i ${PM2_INSTANCES:-12}
pm2 logs dimigoin-back