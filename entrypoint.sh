#!/bin/sh

npm run migration:prod
pm2 start dist/src/main.js --name dimigoin-back -i 12
pm2 logs dimigoin-back