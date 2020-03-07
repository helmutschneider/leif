#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

export API_URL="/api"

rm -rf client/public/*.js client/public/index.html
npm run build
./mvnw clean compile assembly:single appengine:deploy
