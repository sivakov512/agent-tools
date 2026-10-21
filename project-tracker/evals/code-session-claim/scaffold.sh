#!/bin/sh
set -e
# the session's folder: a repository whose origin is git@git.example.com:hw/energy-meter.git
git init -q -b main .
git remote add origin git@git.example.com:hw/energy-meter.git
printf '# firmware\n' > README.md
