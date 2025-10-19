#!/bin/sh

set -euo pipefail

# Ensure Doppler CLI is available (required to inject secrets)
if ! command -v doppler >/dev/null 2>&1; then
  echo "[entrypoint] Error: Doppler CLI not found in PATH" >&2
  exit 1
fi


npm run migration:prod
doppler run -c $(cat deploy_type) -e $(cat doppler_token) -- pm2 start dist/src/main.js --name dimigoin-back -i ${PM2_INSTANCES:-12}
pm2 logs dimigoin-back