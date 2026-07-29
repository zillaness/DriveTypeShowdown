#!/bin/sh
# Copyright (C) 2026 Projects and Mods
# GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
node -e "const fs=require('fs');const h=fs.readFileSync('drive_showdown_v6.6.0.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);if(m)fs.writeFileSync('/tmp/g.js',m[1]);else{console.error('NO SCRIPT');process.exit(1);}"
node --check /tmp/g.js && echo "CHECK OK"
