# Shared scaffold for alter-ego eval cases: a repo in the workspace whose origin
# looks like GitHub but resolves to a local bare repository, and a config with
# one bot, forge, whose token comes from a command (no secret store needed).
set -euo pipefail
AE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/libexec/alter-ego"
WS="$PWD"

setup_repo() {
  git init -q --bare "$WS/.remote.git"
  git init -q -b main "$WS"
  git -C "$WS" config user.name "Nikita Sivakov"
  git -C "$WS" config user.email "nikita@example.com"
  git -C "$WS" remote add origin git@github.com:sivakov512/tool.git
  git -C "$WS" config "url.$WS/.remote.git.insteadOf" git@github.com:sivakov512/tool.git
  echo ".remote.git/" >>"$WS/.git/info/exclude"
  printf '# tool\n\nA small CLI.\n' >"$WS/README.md"
  git -C "$WS" add README.md
  git -C "$WS" commit -q -m "Add README"
  git -C "$WS" push -q -u origin main
}

setup_config() {
  mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/alter-ego"
  cat >"${XDG_CONFIG_HOME:-$HOME/.config}/alter-ego/config.json" <<'JSON'
{
  "name_format": "Claude({bot})",
  "bots": {
    "forge": { "login": "forge-robot", "id": 111, "secret_command": "echo tok-forge" }
  },
  "repos": {}
}
JSON
}

use_mode() { (cd "$WS" && "$AE" use "$1" >/dev/null); }
