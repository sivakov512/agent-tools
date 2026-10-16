#!/usr/bin/env bash
# Tests for alter-ego: the CLI, the git and gh wrappers and the hooks, with fake
# secret stores and a fake gh. No network, no real Keychain.
# Run: alter-ego/tests/test.sh            (TEST_BASH=/bin/bash runs the plugin under another bash)
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AE="$ROOT/libexec/alter-ego"
T="$(mktemp -d)"; T="$(cd "$T" && pwd -P)"; trap 'rm -rf "$T"' EXIT
FAKE="$T/fake"; mkdir -p "$FAKE"
export ALTER_EGO_CONFIG="$T/config/config.json" ALTER_EGO_CLAUDE_SETTINGS="$T/claude/settings.json"
export GIT_CONFIG_GLOBAL="$T/gitconfig" GIT_CONFIG_NOSYSTEM=1 HOME="$T/home" GH_LOG="$T/gh.log"
mkdir -p "$HOME"; : >"$GIT_CONFIG_GLOBAL"; : >"$GH_LOG"
unset GH_TOKEN GITHUB_TOKEN GH_REPO GIT_CONFIG_COUNT GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
git config --global user.name Me; git config --global user.email me@example.com; git config --global init.defaultBranch main

# Fake secret stores read FAKE_SECRETS_DIR/<name with / as _>; fake uname and gh.
export FAKE_SECRETS_DIR="$T/secrets"; mkdir -p "$FAKE_SECRETS_DIR"
cat >"$FAKE/security" <<'EOF'
#!/usr/bin/env bash
while [ $# -gt 0 ]; do [ "$1" = -s ] && name="$2"; shift; done
f="$FAKE_SECRETS_DIR/$(echo "$name" | tr / _)"; [ -f "$f" ] && cat "$f" || exit 44
EOF
cat >"$FAKE/secret-tool" <<'EOF'
#!/usr/bin/env bash
[ "$1" = lookup ] || exit 1
f="$FAKE_SECRETS_DIR/$(echo "$3" | tr / _)"; [ -f "$f" ] && cat "$f" || exit 1
EOF
cat >"$FAKE/pass" <<'EOF'
#!/usr/bin/env bash
f="$FAKE_SECRETS_DIR/$(echo "$2" | tr / _)"; [ -f "$f" ] && { cat "$f"; echo; echo "url: x"; } || exit 1
EOF
cat >"$FAKE/uname" <<'EOF'
#!/usr/bin/env bash
echo "${FAKE_UNAME:-Darwin}"
EOF
cat >"$FAKE/gh" <<'EOF'
#!/usr/bin/env bash
echo "token=${GH_TOKEN:-none} $*" >>"$GH_LOG"
case "$*" in
  "api user --jq"*)
    case "${GH_TOKEN:-}" in tok-forge) echo "forge-robot 111" ;; tok-other) echo "someone 222" ;; *) echo "HTTP 401: Bad credentials" >&2; exit 1 ;; esac ;;
  "api -i user") printf 'HTTP/2.0 200 OK\r\nX-Oauth-Scopes: repo, workflow\r\n\r\n{}\n' ;;
  "api user/repository_invitations --jq"*) [ "${GH_TOKEN:-}" = tok-forge ] && echo 77 ;;
  *) [ -n "${GH_STDIN:-}" ] && cat >>"$GH_LOG"; echo "gh ran with token=${GH_TOKEN:-none}" ;;
esac
EOF
chmod +x "$FAKE"/*
[ -n "${TEST_BASH:-}" ] && ln -s "$TEST_BASH" "$FAKE/bash"
# As in a Claude session: the wrappers and the CLI first on PATH.
export PATH="$ROOT/shims:$ROOT/libexec:$FAKE:$PATH"
secret() { printf '%s' "$2" >"$FAKE_SECRETS_DIR/$(echo "$1" | tr / _)"; }

pass=0 fail=0
ok() { pass=$((pass + 1)); }
bad() { fail=$((fail + 1)); echo "FAIL: $1"; [ -n "${2:-}" ] && echo "$2" | sed 's/^/      /'; }
check() { if printf '%s' "$2" | grep -qE -- "$3"; then ok; else bad "$1" "want /$3/, got: $2"; fi; }
check_empty() { if [ -z "$2" ]; then ok; else bad "$1" "want nothing, got: $2"; fi; }
check_not() { if printf '%s' "$2" | grep -qE -- "$3"; then bad "$1" "unwanted /$3/ in: $2"; else ok; fi; }
# Runs "$@" expecting success, or a refusal by alter-ego; the output lands in $OUT.
succeeds() { local name="$1"; shift; if OUT="$("$@" 2>&1)"; then ok; else bad "$name (should succeed)" "$OUT"; fi; }
refused() { local name="$1"; shift; if OUT="$("$@" 2>&1)"; then bad "$name (should be refused)" "$OUT"; else check "$name (refused by alter-ego)" "$OUT" "alter-ego:"; fi; }
last_gh() { tail -n1 "$GH_LOG"; }
author() { git -C "$1" log -1 --format='%an <%ae> / %cn <%ce>'; }

new_repo() { # new_repo NAME [OWNER/REPO]: a repository whose GitHub remote resolves to a local bare repo
  local d="$T/$1" bare="$T/$1.git"
  git init -q "$d"
  if [ -n "${2:-}" ]; then
    git init -q --bare "$bare"
    git -C "$d" remote add origin "git@github.com:$2.git"
    git -C "$d" config "url.$bare.insteadOf" "git@github.com:$2.git"
  fi
  git -C "$d" commit -q --allow-empty -m "Initial"
  cd "$d"
  if [ -n "${2:-}" ]; then "$AE" use clean >/dev/null && git push -q -u origin main && "$AE" forget >/dev/null; fi
}
guard() { jq -n --arg c "$1" '{tool_name: "Bash", tool_input: {command: $c}, cwd: "/"}' | "$AE" guard; }

# --- the wrappers are what PATH finds
check "git is the wrapper" "$(command -v git)" "^$ROOT/shims/git$"
check "the real git is behind it" "$(git --version)" "^git version"

# --- repository keys
mkdir -p "$T/keys"; cd "$T/keys"; git init -q
for pair in \
  "git@github.com:Owner/Repo.git|github.com/owner/repo" \
  "ssh://git@github.com/owner/repo.git|github.com/owner/repo" \
  "https://github.com/owner/repo|github.com/owner/repo" \
  "https://x-access-token:abc@github.com/owner/repo.git|github.com/owner/repo" \
  "git@github.com:1password/cli.git|github.com/1password/cli" \
  "ssh://git@ssh.github.com:443/owner/repo.git|github.com/owner/repo" \
  "https://gitea.example.com:8443/o/r.git|gitea.example.com/o/r"; do
  git remote remove origin 2>/dev/null; git remote add origin "${pair%%|*}"
  check "key ${pair%%|*}" "$("$AE" key)" "^${pair#*|}\$"
done

# --- no choice yet
new_repo work me/work
succeeds "a local commit without a mode" git commit -q --allow-empty -m "x"
check "it is the user's" "$(author .)" "^Me <me@example.com>"
refused "a push without a mode" git push
check "the refusal asks the user" "$OUT" "Ask the user once: clean"
check "as a question of its own" "$OUT" "AskUserQuestion"
refused "gh pr create without a mode" gh pr create --title t --body b
succeeds "read-only gh without a mode" gh pr list
check "read-only gh runs as the user" "$(last_gh)" "^token=none pr list"
ctx="$(echo "{\"cwd\": \"$PWD\"}" | CLAUDE_ENV_FILE="$T/envfile" "$AE" session-start)"
echo "{\"cwd\": \"$PWD\"}" | CLAUDE_ENV_FILE="$T/envfile" "$AE" session-start >/dev/null
check "session-start asks" "$ctx" "no identity is chosen"
check "with the question tool" "$ctx" "AskUserQuestion tool"
check "session-start puts the wrappers on PATH" "$(cat "$T/envfile")" "export PATH=$ROOT/shims:$ROOT/libexec"
check "the env line is written once" "$(wc -l <"$T/envfile" | tr -d ' ')" "^1$"
check "the env line adds PATH once" "$(PATH=/usr/bin:/bin; eval "$(cat "$T/envfile")"; eval "$(cat "$T/envfile")"; echo "$PATH")" "^$ROOT/shims:$ROOT/libexec:/usr/bin:/bin$"

# --- clean mode
"$AE" use clean >/dev/null
check "status clean" "$("$AE" status)" "mode: clean"
succeeds "a clean push of clean commits" git push -q
git commit -q --allow-empty -m $'Add thing\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
refused "a clean push with Co-Authored-By" git push
check "the refusal says how to reword" "$OUT" "git commit --amend"
cd "$T"
refused "a clean push through -C from elsewhere" git -C "$T/work" push
refused "a clean push in a subshell" bash -c "(cd '$T/work' && git push)"
refused "a clean push via bash -c" bash -c "cd '$T/work'; git push origin main"
git -C "$T/work" config alias.p push
refused "a clean push through an alias" git -C "$T/work" p
cd "$T/work"; git reset -q --hard HEAD~1
git switch -q -c feature; git commit -q --allow-empty -m "Feature work"; git switch -q main
git commit -q --allow-empty -m $'Other\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)'
succeeds "a clean push of a named clean branch" git push -q -u origin feature
refused "a clean push of HEAD with a marker" git push
refused "a clean push --all" git push --all origin
git reset -q --hard HEAD~1
git tag -a v1 -m "Release 🤖 Generated with Claude Code"
refused "a clean push of a tag with a marker" git push origin v1
refused "a clean push --follow-tags" git push --follow-tags
git tag -d v1 >/dev/null
succeeds "a clean push of a plain tag" bash -c "git tag -a v2 -m 'Release 2' && git push -q origin v2"
refused "a clean PR body with a marker" gh pr create --title t --body 'Done 🤖 Generated with Claude Code'
printf 'Fixes it.\n\nGenerated with [Claude Code](https://claude.com/claude-code)\n' >"$T/body.md"
refused "a clean PR body file with a marker" gh pr create --title t --body-file "$T/body.md"
refused "a clean PR body from stdin with a marker" bash -c "cat '$T/body.md' | gh pr create --title t --body-file -"
refused "a clean gh api field with a marker" gh api repos/me/work/issues/1/comments -f 'body=Co-Authored-By: Claude <noreply@anthropic.com>'
refused "a clean gh api field from a file" gh api repos/me/work/issues/1/comments -F "body=@$T/body.md"
refused "a clean gh repo edit with a marker" gh repo edit --description '🤖 made by Claude'
succeeds "a clean PR with a plain body" gh pr create --title t --body 'Fixes the parser'
check "clean gh writes run as the user" "$(last_gh)" "^token=none pr create"
GH_STDIN=1 succeeds "a clean PR body from stdin passes through" bash -c "printf 'Plain body\n' | gh pr create --title t --body-file -"
check "stdin reaches gh" "$(last_gh)" "^Plain body"
check "clean context" "$(echo "{\"cwd\": \"$PWD\"}" | "$AE" session-start)" "clean mode in"

# --- bots
check "add-bot without a token prints the store command" "$("$AE" add-bot forge forge-robot)" "security add-generic-password -U -s alter-ego/forge-robot -a forge-robot -w"
check "use refuses a bot without an id" "$("$AE" use forge 2>&1)" "no GitHub account id"
secret alter-ego/forge-robot tok-forge
check "check saves the id" "$("$AE" check forge)" "forge ready: GitHub forge-robot \(id 111\), commits signed \"Claude\(forge\)\" <111\+forge-robot@users.noreply.github.com>, token scopes: repo, workflow"
"$AE" name-format 'Claude[{bot}]' --bot forge >/dev/null
"$AE" add-bot forge forge-robot >/dev/null
check "re-adding a bot keeps its id" "$(jq -r '.bots.forge.id' "$ALTER_EGO_CONFIG")" "^111$"
check "re-adding a bot keeps its format" "$(jq -r '.bots.forge.name_format' "$ALTER_EGO_CONFIG")" "^Claude\[\{bot\}\]$"
"$AE" name-format 'Claude({bot})' --bot forge >/dev/null
check "a reserved bot name is refused" "$("$AE" add-bot off x 2>&1)" "reserved"
check "an option without a value is refused" "$("$AE" add-bot x y --secret 2>&1)" "needs a value"
"$AE" add-bot other other-robot >/dev/null; secret alter-ego/other-robot tok-other
check "check rejects another account's token" "$("$AE" check other 2>&1)" "belongs to someone"
"$AE" remove-bot other >/dev/null
check "bots list" "$("$AE" bots)" "forge: GitHub forge-robot, commits signed \"Claude\(forge\)\", ready, chosen for: no repository yet"

# Bot-made commits never leave a clean repository unnoticed.
GIT_AUTHOR_NAME=x GIT_AUTHOR_EMAIL=111+forge-robot@users.noreply.github.com git commit -q --allow-empty -m "Bot work"
refused "a clean push of a bot-authored commit" git push
git reset -q --hard HEAD~1
GIT_COMMITTER_EMAIL=111+forge-robot@users.noreply.github.com git commit -q --allow-empty -m "Bot-committed"
refused "a clean push of a bot-committed commit" git push
git reset -q --hard HEAD~1

"$AE" use forge >/dev/null
check "status bot" "$("$AE" status)" "mode: bot forge"
check "bot pushes go over https" "$("$AE" status)" "bot pushes go to: https://github.com/me/work.git"
git config --unset "url.$T/work.git.insteadOf"; git config remote.origin.pushurl git@github.com:me/work.git
check "a pushurl over ssh is rewritten" "$("$AE" status)" "bot pushes go to: https://github.com/me/work.git"
git config --unset remote.origin.pushurl; git config "url.$T/work.git.insteadOf" git@github.com:me/work.git
git config --global url.git@github.com:.insteadOf https://github.com/
check "a global https-to-ssh rewrite is outranked" "$("$AE" status)" "bot pushes go to: https://github.com/me/work.git"
git config --global --unset url.git@github.com:.insteadOf
refused "a bot push to a literal ssh URL" git push git@github.com:me/work.git main
check "it says why" "$OUT" "would act as the user"

succeeds "a bot commit" git commit -q --allow-empty -m "Bot commit"
check "bot commit author and committer" "$(author .)" "^Claude\(forge\) <111\+forge-robot@users.noreply.github.com> / Claude\(forge\) <111\+forge-robot"
cd "$T"
succeeds "a bot commit through -C" git -C "$T/work" commit -q --allow-empty -m "Bot commit 2"
check "it is the bot's" "$(author "$T/work")" "^Claude\(forge\)"
check "the shell has no bot variables" "$(env | grep -cE '^(GH_TOKEN|GIT_AUTHOR_NAME)=')" "^0$"

new_repo other me/other; "$AE" use clean >/dev/null
cd "$T/work"
succeeds "a commit into a clean repo from a bot folder" git -C "$T/other" commit -q --allow-empty -m "Mine"
check "it is the user's" "$(author "$T/other")" "^Me <me@example.com> / Me"
succeeds "a bot PR" gh pr create --title t --body '🤖 fine here'
check "bot gh writes carry the bot's token" "$(last_gh)" "^token=tok-forge pr create"
succeeds "a bot read" gh pr view 1
check "in a bot repo gh reads are the bot's too" "$(last_gh)" "^token=tok-forge pr view"
succeeds "an unknown gh command in a bot repo" gh frobnicate now
check "it is the bot's" "$(last_gh)" "^token=tok-forge frobnicate"
succeeds "gh auth status in a bot repo" gh auth status
check "account commands stay the user's" "$(last_gh)" "^token=none auth status"
succeeds "plumbing commit in a bot repo" bash -c 'git update-ref refs/heads/plumb "$(git commit-tree "HEAD^{tree}" -p HEAD -m plumb)"'
check "plumbing commits are the bot's too" "$(git log -1 --format='%an / %cn' plumb)" "^Claude\(forge\) / Claude\(forge\)$"
git branch -q -D plumb
succeeds "gh -R to a clean repo from a bot folder" gh pr comment 1 -R me/other --body ok
check "it runs as the user" "$(last_gh)" "^token=none pr comment"
refused "gh -R to a clean repo, with a marker" gh issue comment 1 --repo me/other --body '🤖'
succeeds "gh api to a bot repo by path" gh api -X POST repos/me/work/issues -f title=x
check "it carries the bot's token" "$(last_gh)" "^token=tok-forge api"
succeeds "gh api with gh's placeholders" gh api 'repos/{owner}/{repo}/issues' -f title=x
check "placeholders mean the current repo" "$(last_gh)" "^token=tok-forge api"
cd "$T/other"
succeeds "a graphql query in a clean repo is a read" gh api graphql -f 'query=query { viewer { login } }'
check "it runs as the user" "$(last_gh)" "^token=none api graphql"
cd "$T/work"
succeeds "a graphql mutation is a write" gh api graphql -f 'query=mutation { addStar(input: {}) { clientMutationId } }'
check "it carries the bot's token" "$(last_gh)" "^token=tok-forge api graphql"
check "the credential helper gives the token" "$(printf 'protocol=https\nhost=github.com\n\n' | "$AE" credential forge get)" "password=tok-forge"
check "as runs one command with the token" "$("$AE" as forge gh api user/x)" "token=tok-forge"
check "bot context" "$(echo "{\"cwd\": \"$PWD\"}" | "$AE" session-start)" "works as bot 'forge'"

: >"$GH_LOG"
check "invite: as the user, then accepted as the bot" "$("$AE" invite forge me/work)" "invited to me/work and accepted"
check "the invitation is sent as the user" "$(sed -n 1p "$GH_LOG")" "^token=none api -X PUT repos/me/work/collaborators/forge-robot"
check "it is accepted as the bot" "$(last_gh)" "^token=tok-forge api -X PATCH user/repository_invitations/77"

# Without a token, pushes and gh writes are refused rather than done as the user.
rm "$FAKE_SECRETS_DIR/alter-ego_forge-robot"
refused "a bot push without a token" git push
refused "a bot gh write without a token" gh pr create --title t --body b
check "status names the problem" "$("$AE" status)" "problem: no token"
secret alter-ego/forge-robot tok-forge

# Someone else's GIT_CONFIG_* entries survive a bot commit.
cat >"$T/work/.git/hooks/pre-commit" <<'EOF'
#!/bin/sh
git config --get mine.setting >seen
EOF
chmod +x "$T/work/.git/hooks/pre-commit"
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=mine.setting GIT_CONFIG_VALUE_0=kept git commit -q --allow-empty -m "With hook"
check "existing GIT_CONFIG entries are kept" "$(cat "$T/work/seen")" "^kept$"
rm "$T/work/.git/hooks/pre-commit" "$T/work/seen"

check "remove-bot refuses while chosen" "$("$AE" remove-bot forge 2>&1)" "chosen for"
check "use off means clean" "$("$AE" use off)" "-> clean"

# --- secret stores on Linux
export FAKE_UNAME=Linux
check "linux store: secret-service" "$("$AE" doctor)" "Secret Service"
check "linux store command" "$("$AE" store-command forge)" "secret-tool store --label='alter-ego: forge-robot' service alter-ego/forge-robot account forge-robot"
check "linux token via secret-tool" "$("$AE" credential forge get </dev/null)" "password=tok-forge"
mv "$FAKE/secret-tool" "$T/secret-tool.off"
check "linux store: pass" "$("$AE" store-command forge)" "pass insert alter-ego/forge-robot"
check "linux token via pass (first line)" "$("$AE" credential forge get </dev/null)" "password=tok-forge$"
mv "$FAKE/pass" "$T/pass.off"
check "linux store: none" "$("$AE" doctor)" "secret store: NONE"
check_not "no store, no token" "$("$AE" credential forge get </dev/null)" "password"
"$AE" add-bot forge forge-robot --secret-command "echo tok-forge" >/dev/null 2>&1
check "secret-command" "$("$AE" check forge)" "forge ready"
check "token via secret-command" "$("$AE" credential forge get </dev/null)" "password=tok-forge"
mv "$T/secret-tool.off" "$FAKE/secret-tool"; mv "$T/pass.off" "$FAKE/pass"
unset FAKE_UNAME

# --- a repository without a remote keeps its choice when it gets one
new_repo local
check "path key" "$("$AE" key)" "^path:$T/local\$"
"$AE" use clean >/dev/null
git remote add origin git@github.com:me/local.git
echo "{\"cwd\": \"$PWD\"}" | "$AE" session-start >/dev/null
check "the choice moved to the remote key" "$(jq -r '.repos | keys | join(" ")' "$ALTER_EGO_CONFIG")" "github.com/me/local"
check_not "the path key is gone" "$(jq -r '.repos | keys | join(" ")' "$ALTER_EGO_CONFIG")" "path:"

# --- attribution
mkdir -p "$(dirname "$ALTER_EGO_CLAUDE_SETTINGS")"; echo '{"model": "opus", "includeCoAuthoredBy": false}' >"$ALTER_EGO_CLAUDE_SETTINGS"
check "attribution partly off" "$("$AE" attribution)" "^partly off"
echo '{"model": "opus", "attribution": {"sessionUrl": false}}' >"$ALTER_EGO_CLAUDE_SETTINGS"
check "attribution on" "$("$AE" attribution)" "^on$"
"$AE" attribution off >/dev/null
check "attribution off" "$("$AE" attribution)" "^off$"
check "attribution keeps other settings" "$(jq -c . "$ALTER_EGO_CLAUDE_SETTINGS")" '"model":"opus".*"sessionUrl":false,"commit":"","pr":""'

# --- the guard: git and gh only by name
check "a full path to git is denied" "$(guard "/usr/bin/git push")" '"deny"'
check "a full path to gh is denied" "$(guard "cd x && /opt/homebrew/bin/gh pr create")" '"deny"'
check "a replaced PATH is denied" "$(guard "PATH=/usr/bin:/bin git commit -m x")" '"deny"'
check "a PATH set before the call is denied" "$(guard "export PATH=/usr/bin:/bin; git push")" '"deny"'
check "env -i is denied" "$(guard "env -i git push")" '"deny"'
check "env -i around a shell is denied" "$(guard "env -i bash -c 'gh pr create'")" '"deny"'
check "command -p is denied" "$(guard "command -p git commit -m x")" '"deny"'
check "a full path inside bash -c is denied" "$(guard "bash -c '/usr/bin/git push'")" '"deny"'
check "a full path in a substitution is denied" "$(guard 'id=$(/opt/homebrew/bin/gh api -X POST repos/o/r/issues)')" '"deny"'
check_empty "plain git is allowed" "$(guard "git push")"
check_empty "reading with a full path is allowed" "$(guard "/usr/bin/git status")"
check_empty "a pattern that only mentions them is allowed" "$(guard "grep -nE 'env -i|command -p|commit.gpgsign' libexec/alter-ego")"
check_empty "env -i without git or gh is allowed" "$(guard "env -i ls && git push")"
check_empty "command -v is allowed" "$(guard "command -v git && git commit -m x")"

# --- outside a repository
cd "$T"
check "status outside a repo" "$("$AE" status)" "not inside a git repository"
check_empty "no context outside a repo" "$(echo "{\"cwd\": \"$T\"}" | "$AE" session-start)"
succeeds "git outside a repo" git --version

echo "passed $pass, failed $fail"
[ "$fail" -eq 0 ]
