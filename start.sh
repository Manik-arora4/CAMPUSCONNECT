#!/bin/bash
set -e
cd server
node node_modules/.bin/prisma generate
node node_modules/.bin/prisma db push
node src/index.js
