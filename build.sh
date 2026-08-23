#!/bin/bash
set -e
cd server && npm install
cd ../client && npm install
cd ..
npm run build
