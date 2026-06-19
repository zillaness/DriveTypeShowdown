#!/bin/sh
node -e "const fs=require('fs');const h=fs.readFileSync('drive_showdown_v5.1.235.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);if(m)fs.writeFileSync('/tmp/g.js',m[1]);else{console.error('NO SCRIPT');process.exit(1);}"
node --check /tmp/g.js && echo "CHECK OK"
