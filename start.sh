#!/bin/sh
export PATH="$HOME/local/node-v20.11.1-darwin-x64/bin:$PATH"
NODE_ENV=production exec node server/index.js
