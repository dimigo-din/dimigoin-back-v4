#!/bin/sh

npm run migration:prod
pm2-runtime start dist/src/main.js --name dimigoin-back -i 12