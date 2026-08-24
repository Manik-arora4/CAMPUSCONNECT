#!/bin/bash
set -e
cd server
npx prisma generate
npx prisma db push
node src/index.js
