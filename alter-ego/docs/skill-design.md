# Skill design

How the `alter-ego` plugin is put together and the criteria every change is checked against — for whoever edits `skills/alter-ego/`, `hooks/`, `shims/` or `libexec/`. Read `docs/skill-development.md` at the repository root first: this file adds only what is particular to this plugin. Neither the skill nor the CLI reads it at run time.

alter-ego is unlike the other plugins: most of it is enforcement code, not instructions. The CLI and the wrappers refuse what would go out under the wrong name; the skill is the conversation around those refusals — asking for the mode, switching it, adding a bot, writing in the user's voice.

## What the skill must do

These hold in every repository and every mode. Each is checked by an eval case (`evals/README.md`) or by `tests/test.sh`; a change that breaks one is a bug, not a trade-off.

1. **The mode is the user's choice.** Claude never picks or sets a repository's mode itself, even when it looks obvious, and recommends none: a mode chosen by accident puts work out under the wrong name. It runs `alter-ego use` only on the user's answer or request.
2. **The question is asked on its own.** Once per repository, before the first push, PR, issue, review or comment there — not at the start of a session that only reads. With AskUserQuestion when Claude has it (Clean, one option per bot, Add a bot); without it, as the reply's last paragraph under a bold heading, options as a short list, nothing else asked alongside. Nothing is pushed or posted while the answer is pending.
3. **Nothing goes out before a mode is chosen.** With no mode, `git push` and `gh` writes are refused with a message telling Claude to ask; local commits and reads run as the user.
4. **Each call is decided by the repository it acts on.** `git -C`, a `cd`, a subshell, `bash -c`, a git alias, `gh -R`, `GH_REPO` and `gh api repos/OWNER/NAME/…` all land under that repository's mode, wherever the shell stands.
5. **Clean mode shows no AI.** A push is refused while the commits or tags it sends carry AI marks (`TELLS` in `libexec/alter-ego`) or were authored or committed by a bot; a `gh` write is refused while its text — arguments, body files, stdin, `gh api` fields — carries them. Beyond what the filter catches, Claude writes in the user's voice with no mention of an assistant.
6. **Bot mode is the bot throughout, and never falls back to the user.** Every git process in a bot repository is signed as the bot (plumbing, hooks and `rebase --exec` included); pushes go over https with the bot's token whatever the remote URL says; `gh` runs with the bot's token. Account commands (`gh auth`, `config`, `gist`, `search`, …) stay the user's. A missing token, a missing account id or a push URL the token cannot serve is refused, never done as the user.
7. **A refusal is never routed around.** No git or gh by full path, no replaced PATH, no `env -i`, no hand edits of the config, no switching the mode to get past a refusal. Claude acts on what the refusal says (rewords, asks, gives the store command); the PreToolUse hook backs this up.
8. **Tokens never appear in chat, shell history or the config.** The user stores a token in their own terminal with a command that prompts for it; a token pasted into chat is not used — Claude says it is exposed and should be revoked. The token is read from the secret store only when a push or a `gh` call needs it, and only that process sees it.
9. **In a bot repository, Claude's work goes through its own Bash.** It commits, pushes and opens PRs with `git` and `gh` called by name; it does not offer the app's commit or create-PR buttons, nor write to GitHub through an MCP connector — both act as the user.
10. **Switching keeps history honest.** A switch is confirmed in one line; unpushed commits made under the old mode are pointed out with an offer to re-author them; pushed commits are never rewritten unless the user asks.
11. **Writes to the user's own accounts are confirmed first.** `alter-ego attribution off` changes the user's global Claude settings and `alter-ego invite` acts on their GitHub account: each is offered and run on a yes.
12. **Adding a bot is walked through, step by step.** Account, classic token with `repo`, `alter-ego add-bot`, the store command for this OS, `alter-ego check`, access — Claude does every step it can and leaves the user only what needs them.
13. **Only Claude's own `git` and `gh` are touched.** No repository config is written, no variables leak into the shell, others' `GIT_CONFIG_*` entries survive, and the user's terminal is unaffected.

| # | Eval case (grader) | `tests/test.sh` | Gap |
|---|---|---|---|
| 1 | `ask-mode` (`no-self-choice`, `asks`); `switch-to-bot` (`uses-forge`) | — | |
| 2 | `ask-mode` (`asks`) | refusal and session context name AskUserQuestion | the AskUserQuestion path: eval runs offer no such tool |
| 3 | `ask-mode` | *no choice yet* | |
| 4 | — | *clean mode* (`-C`, subshell, `bash -c`, alias), *bots* (`-C`, `-R`, `api repos/…`, placeholders) | |
| 5 | `clean-commit-push` (`no-marks`), `clean-push-reword` | *clean mode*, bot-made commits in a clean repository | clean-mode PR, issue and comment text written by Claude |
| 6 | `bot-commit` (`author`) | *bots*, *without a token* | |
| 7 | `ask-mode` (`no-bypass`), `clean-push-reword` (`no-bypass`, `outcome`), `clean-commit-push` (`no-marks`) | *the guard* | |
| 8 | `add-bot` (`walkthrough`) | the shell has no bot variables | a token pasted into chat |
| 9 | `bot-commit` (`no-app-buttons`) | — | MCP connectors |
| 10 | `switch-to-bot` (`confirms`) | — | the re-author offer; not rewriting pushed commits |
| 11 | — | — | no case yet |
| 12 | `add-bot` (`registers`, `walkthrough`) | *bots* (`add-bot`, `check`, store commands) | |
| 13 | — | existing `GIT_CONFIG` entries kept; no bot variables in the shell | |

## Decisions

Choices the user made or confirmed. A request that goes against one is raised with the user before anything changes.

- **Two modes per repository: clean or a named bot.** Some repositories must show no AI (client work, open source, issue threads); in others the user wants to see at a glance what a machine wrote, review it as a colleague's PR and filter it on GitHub.
- **No mode means ask, not a default.** A question costs one turn; work out under the wrong name cannot be taken back.
- **Modes are keyed by the remote** (`github.com/owner/repo`, from `origin` or else the first remote, SSH host aliases resolved), so every clone and worktree shares one choice. A repository without a remote is keyed by its main worktree's path, and the choice moves to the remote key once it has one.
- **Choices live on the machine, in `~/.config/alter-ego/config.json`** (`$XDG_CONFIG_HOME` honoured), never in the repository: whose name the user's work goes under is theirs, not the project's. The file is rewritten in place so a symlinked dotfile survives.
- **Enforcement is wrappers on PATH, decided per call.** A SessionStart hook puts `shims/git` and `shims/gh` first on PATH for Claude's Bash; each call reads its own arguments and folder. Per-session variables or repository config would follow a `cd` or `-C` into another repository under the wrong name, and would touch the user's own terminal.
- **A PreToolUse hook guards the wrappers.** It denies git or gh by full path, a replaced PATH, `env -i` and `command -p` when the command also writes (push, commit, `pr`, `api`, …); reading with a full path passes, so ordinary inspection is not blocked.
- **The CLI lives in `libexec/`, not `bin/`.** claude.ai rejects a plugin with a top-level `bin/`; the hook puts `libexec/` on PATH itself.
- **One bash script holds all the logic**, needing only `git`, `gh` and `jq`, and runs under macOS's bash 3.2: nothing to build or install beyond tools the user already has.
- **Clean mode filters only obvious marks** (Co-Authored-By Claude, "Generated with Claude", Claude Code links, 🤖) and leaves voice to the skill: a filter cannot judge style, and a broad one would block honest work.
- **Bot commits are signed `Claude({bot})` by default**, with `{bot}` and `{login}` placeholders, globally or per bot: the name says both that Claude wrote it and which bot. The email is `<id>+<login>@users.noreply.github.com`, which links the commit to the bot's GitHub account — so a bot needs its account id (`alter-ego check`) before it can be chosen.
- **In a bot repository every git process is the bot**, not only `push`: identity comes from `GIT_AUTHOR_*`/`GIT_COMMITTER_*` and `GIT_CONFIG_*` set for that process alone; pushes are rewritten to https with a credential helper that reads the token; commit and tag signing are off, since the user's key would sign the bot's work. `gh` reads are the bot's too; fetches over SSH keep the user's key.
- **Classic personal access tokens with `repo`** (plus `workflow` for workflow files): it is what alter-ego is tested with, and a fine-grained token may not reach repositories the bot only collaborates on.
- **Tokens stay in the OS secret store** — macOS Keychain, Secret Service or `pass` on Linux, or a `secret_command` — read per call, never written by alter-ego: the user stores them with a prompting command, so they reach neither chat nor shell history.
- **Bot mode is github.com only**: the token, the noreply email and the invite flow are GitHub's.
- **Claude Code's own attribution is turned off at the source, on request.** `alter-ego attribution off` sets `"attribution": {"commit": "", "pr": ""}` in `~/.claude/settings.json`; it is offered once and asked first, as it applies to every repository.
- **`invite` asks with the user's `gh` login and accepts as the bot**, so giving a bot access is one confirmed step instead of a trip through two GitHub accounts.
- **A bot is removed only when no repository uses it** (or with `--force`), and its token is left in the secret store for the user to delete.
- **Re-adding a bot keeps what it had** (id, name format, secret) unless given anew; a different login drops the id, since it is a different account.

## Where things live

| File | Owns |
|---|---|
| `skills/alter-ego/SKILL.md` | trigger; the modes; how enforcement works, as Claude needs to know it; the command table; asking and switching; clean-mode writing; bot-mode conduct; adding, rotating and removing a bot; first run; acting on refusals |
| `hooks/hooks.json` | SessionStart (`libexec/alter-ego session-start`: wrappers on PATH, the repository's mode as session context) and PreToolUse on Bash (`libexec/alter-ego guard`) |
| `shims/git`, `shims/gh` | the programs PATH finds; each hands over to `libexec/alter-ego __git` / `__gh` |
| `shims/.alter-ego-shims` | marker that tells `real_bin` to skip this folder when looking for the real git and gh |
| `libexec/alter-ego` | everything else: config, repository keys, the git and gh wrappers, the clean-mode filter (`TELLS`), bot identity and pushes, the credential helper, both hooks' logic and the user commands (`status`, `use`, `add-bot`, …) |
| `tests/test.sh` | offline tests of the CLI, wrappers and hooks with fake secret stores and a fake `gh` |
| `evals/` | the `claude plugin eval` suite; `lib.sh` is the shared scaffold |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why.

- **No Notion, no pages.** The state is a local config file and the OS secret store, so §5's Notion rules and §6 do not apply, and there is no `docs/dashboard-design.md`.
- **Executables and hooks beyond §2's table.** `hooks/`, `shims/` and `libexec/` carry the enforcement, which is the plugin's purpose; `shims/` holds only the two names PATH must find.
- **The skill points outside its folder** (`${CLAUDE_PLUGIN_ROOT}/libexec/alter-ego`, the CLI it drives). Without the plugin's hooks nothing is enforced, so the skill alone — in chat, Cowork or cloud sessions — can only explain the modes; the README says so.
- **Evals need Bash** and so run through `scripts/eval.sh` with `--allow-tools Bash --scaffold --trust-plugin`; without Bash the agent cannot run git and the "must not" graders pass trivially.

Not yet in line, each for a change of its own (§9):

- **The config has no `schema` number** (§4.7). It is a local JSON file read field by field with defaults; `schema` is to be added, with the upgrade of existing files, in a change of its own.
- **`SKILL.md` does not state §4.1** (answer the message first) **or §4.3** (plain text in chat).
- **`evals/README.md` names neither the model nor the cost of a full run** (§7.2).
- **The guard matches words, not calls.** `cmd_guard` greps the whole command text, so a read that only mentions them — `grep -nE 'env -i|command -p|commit.gpgsign' libexec/alter-ego` — is denied though it runs neither git nor gh. A fix comes with a *the guard* case in `tests/test.sh` for that command.

## Checking a change

Beyond `docs/skill-development.md` §7:

- `alter-ego/tests/test.sh` (run by `scripts/check.py`), and once more under macOS's bash 3.2: `TEST_BASH=/bin/bash alter-ego/tests/test.sh`.
- A change to the wrappers, the hooks or the refusal texts runs the eval suite through `scripts/eval.sh` (`evals/README.md`): the agent reads those texts, so a reworded refusal can change what it does.
