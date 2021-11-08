#!/bin/bash
set -e
set -x
npm install
# if [ "$RUN_MIGRATIONS" ]; then
  echo "RUNNING MIGRATIONS";
  npm run typeorm:migration:run
# fi
npm run build
echo "START SERVER";
npm run start:prod