#!/usr/bin/env bash
# Runs `claude plugin eval` for one plugin with an empty temporary HOME.
#
# An eval that grants Bash refuses to start when ~/.docker holds symbolic links,
# which Docker Desktop puts there. With an empty HOME the check passes; the login
# then comes from a long-lived token (`claude setup-token`) instead of ~/.claude:
# CLAUDE_CODE_OAUTH_TOKEN if set, else the secret `claude-eval-token` in the
# macOS Keychain or, on Linux, the Secret Service.
#
# On macOS it also puts a wrapper for the real git ahead of the /usr/bin/git shim.
#
# Usage, from the repo root: scripts/eval.sh <plugin> [claude plugin eval options]
#   scripts/eval.sh alter-ego --runs 1 --ablation none --scaffold --allow-tools Bash --trust-plugin --no-publish
set -euo pipefail

plugin="${1:?usage: scripts/eval.sh <plugin> [claude plugin eval options]}"; shift
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$root/$plugin/.claude-plugin/plugin.json" ] || { echo "no plugin $plugin in $root" >&2; exit 1; }

token="${CLAUDE_CODE_OAUTH_TOKEN:-}"
if [ -z "$token" ]; then
  case "$(uname -s)" in
    Darwin) token="$(security find-generic-password -s claude-eval-token -w 2>/dev/null || true)" ;;
    *) token="$(secret-tool lookup service claude-eval-token 2>/dev/null || true)" ;;
  esac
fi
[ -n "$token" ] || { echo "no token: run \`claude setup-token\` and store it as claude-eval-token, or set CLAUDE_CODE_OAUTH_TOKEN" >&2; exit 1; }

# The plugin folder is the one place outside the workspace the sandbox lets Bash see.
tools="$root/$plugin/.eval-tools/$$"
home="$(mktemp -d)"; mkdir -p "$tools"; trap 'rm -rf "$home" "$tools"' EXIT

# In the Bash sandbox the /usr/bin/git shim fails (xcrun cannot write its cache),
# and the real git runs by full path but is hidden from PATH lookup (the sandbox
# denies stat under /Applications and /Library), so a wrapper calls it by path.
if [ "$(uname -s)" = Darwin ] && git_bin="$(xcrun --find git 2>/dev/null)"; then
  for t in git git-receive-pack git-upload-pack git-upload-archive; do
    printf '#!/bin/sh\nexec %s "$@"\n' "$(dirname "$git_bin")/$t" >"$tools/$t"; chmod +x "$tools/$t"
  done
  PATH="$tools:$PATH"
fi

cd "$root/$plugin"
HOME="$home" CLAUDE_CODE_OAUTH_TOKEN="$token" claude plugin eval . "$@"
