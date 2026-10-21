#!/bin/sh
set -e
# the session's folder: a repository whose origin is https://github.com/dana/agent-tools.git
git init -q -b main .
git remote add origin https://github.com/dana/agent-tools.git
printf '# firmware\n' > README.md
