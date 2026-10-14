# alter-ego

Decides whose name Claude's git and GitHub work goes out under, per repository:

- **clean** — commits, pushes, pull requests, issues, reviews and comments are yours, with no AI marks: no `Co-Authored-By: Claude`, no "Generated with Claude Code", no 🤖. For client projects, your open source, issue threads.
- **a bot** — a GitHub account of yours, say `beelzebot-robot`. Claude's commits are signed `Claude(beelzebot)` and linked to that account; pushes, PRs, issues and comments are made by it. For your own tools: you see at a glance what a machine wrote, review and approve its PRs like a colleague's, and filter with `author:beelzebot-robot`. Your own commits in the same repository stay yours.

Each repository is asked about once, the first time Claude is about to push, open a PR or comment there. The answer is remembered for every clone and worktree. Change it any time with `/alter-ego` or in plain words ("работай тут от бота", "make this repo clean").

The plugin and the skill inside it are both called `alter-ego`.

## How it works

A SessionStart hook puts two wrappers first on PATH for Claude's Bash commands: `git` and `gh`. Every call is decided when it runs, from its own arguments and folder, so `git -C ../other`, a `cd`, a subshell or an alias land in the repository they act on, under that repository's mode. Nothing else is touched: no repository config, no environment for other programs, nothing in your own terminal.

| Mode | `git` | `gh` |
|---|---|---|
| not chosen | runs as you; `push` is refused with a message telling Claude to ask you | runs as you; writes are refused the same way |
| clean | runs as you; `push` is refused while the commits or tags it sends carry AI marks or were authored or committed by a bot | runs as you; writes are refused while their text (arguments, body files, stdin) carries AI marks |
| bot | every git process is the bot: commits (plumbing, hooks and `rebase --exec` included) are signed as the bot; `push` goes over https with the bot's token, whatever the remote URL (SSH, a host alias, a `pushurl`, a global https→ssh rewrite) | every call on the repository runs with the bot's token; account commands (`auth`, `config`, `gist`, `search`, …) stay yours |

In bot mode anything that would act as you instead is refused: a missing token, a push URL the token can't serve. A PreToolUse hook refuses `git` or `gh` called by full path or with PATH replaced, since that would skip the wrappers. The bot's token is read from the secret store only when a push or a `gh` call needs it, and only that process sees it. The wrapper adds about 50 ms to each `git` call inside a repository.

Choices live in `~/.config/alter-ego/config.json` (`$XDG_CONFIG_HOME` is honoured). Tokens never do:

```json
{
  "name_format": "Claude({bot})",
  "bots": {
    "beelzebot": { "login": "beelzebot-robot", "id": 237511708 }
  },
  "repos": {
    "github.com/you/your-tool": "beelzebot",
    "github.com/client/backend": "clean"
  }
}
```

| Field | Meaning |
|---|---|
| `name_format` | how bot commits are signed; `{bot}` and `{login}` are replaced. Also per bot |
| `bots.<name>.login`, `.id` | the GitHub account; `id` is filled by `alter-ego check` and links commits to the account |
| `bots.<name>.secret` | the token's item name in the secret store, `alter-ego/<login>` by default |
| `bots.<name>.secret_command` | a command that prints the token, instead of the secret store; it runs on every push and every `gh` call in a bot repository |
| `secret_backend` | `keychain`, `secret-service` or `pass`, to override the detected store |
| `repos` | the mode per repository, keyed by its remote; a repository without a remote is keyed by its folder until it gets one |

## Install

Needs `git`, `gh` and `jq`, and a secret store: the macOS Keychain, or on Linux the Secret Service (`secret-tool`) or `pass`. Works in Claude Code — the CLI, the desktop app and the IDE extensions — where plugin hooks run.

```
/plugin marketplace add sivakov512/agent-tools
/plugin install alter-ego@sivakov512
```

Start a new session: the wrappers are put on PATH at session start.

In claude.ai cloud sessions, Cowork, chat or Codex there are no plugin hooks, so nothing is enforced; the skill alone can only explain the modes.

## First run

1. "Set up alter-ego" (or `/alter-ego`). Claude runs `alter-ego doctor` and reports anything missing.
2. It offers to turn off Claude Code's own attribution lines everywhere (`"attribution": {"commit": "", "pr": ""}` in `~/.claude/settings.json`), so clean repositories are clean at the source. It asks first: it is a global setting.
3. Add a bot if you want one (below). Repositories need no setup: each is asked about when it first matters.

## How to use it

| You say | What happens |
|---|---|
| (Claude is about to push in a repository with no mode) | it asks: clean, one of your bots, or add a bot; remembers the answer |
| "работай тут от бота beelzebot" / `/alter-ego beelzebot` | this repository switches to the bot from the next command |
| "make this repo clean" / `/alter-ego off` | it switches to clean |
| `/alter-ego` / "how does this repo work?" | the mode, where bot pushes go, whether the token is there |
| "add a bot: account acme-helper-bot, call it helper" | walks you through the token and stores nothing itself (below) |
| "invite helper to this repo" | invites the bot with your `gh` login, accepts as the bot, after you confirm |
| "sign bot commits as `{login} via Claude`" | changes the name format |
| "the beelzebot token expired" | gives you the command to store a new one, then checks it |
| "remove the helper bot" | removes it once no repository uses it |

## Adding a bot

1. A GitHub account for the bot. GitHub's terms allow a machine account next to your personal one.
2. A **classic** personal access token for it, scope `repo` (plus `workflow` if it will edit workflows).
3. `alter-ego add-bot <name> <login>`. The name becomes `{bot}` in the commit signature.
4. Storing the token in your own terminal. The command prompts for it, so it never touches the chat or your shell history:

   | OS | Store | Command |
   |---|---|---|
   | macOS | Keychain | `security add-generic-password -U -s alter-ego/<login> -a <login> -w` |
   | Linux desktop | Secret Service (GNOME Keyring, KWallet, KeePassXC) | `secret-tool store --label='alter-ego: <login>' service alter-ego/<login> account <login>` |
   | Linux server | [pass](https://www.passwordstore.org/) | `pass insert alter-ego/<login>` |
   | anything else | any command that prints the token | `alter-ego add-bot <name> <login> --secret-command 'op read op://Private/<login>/token'` |

   `secret-tool` needs a desktop session's D-Bus; over SSH use `pass` or `--secret-command`. A secret command runs on every push and every `gh` call in a bot repository, so pick one that doesn't prompt each time.
5. `alter-ego check <name>`, which confirms with GitHub whose token it is and saves the account id.
6. `alter-ego invite <name> [owner/repo]` for each repository it should push to.

The commit signature is `Claude({bot})` by default. Change it with `alter-ego name-format '<fmt>'`, globally or with `--bot <name>`.

## Tests

`tests/test.sh` checks the CLI, the wrappers and the hooks offline, with fake secret stores (Keychain, Secret Service, pass) and a fake `gh`. `TEST_BASH=/bin/bash tests/test.sh` runs the plugin under macOS's bash 3.2.

`evals/` holds a `claude plugin eval` suite — see [evals/README.md](evals/README.md). It needs Bash, so run it through `scripts/eval.sh` from the repo root:

```
scripts/eval.sh alter-ego --runs 1 --ablation none --scaffold --allow-tools Bash --trust-plugin -j 4 --no-publish
```

## Where things are

```
alter-ego/
├── README.md                     this file
├── .claude-plugin/plugin.json    Claude plugin packaging (name, version)
├── hooks/hooks.json              SessionStart (wrappers on PATH, the mode as context) and PreToolUse (git/gh by name only)
├── bin/alter-ego                 the CLI and all the logic, wrappers included
├── shims/git, shims/gh           the wrappers PATH finds; they hand over to bin/alter-ego
├── skills/alter-ego/SKILL.md     the conversation: asking, switching, adding bots, clean-mode writing
├── tests/test.sh                 offline tests
└── evals/                        claude plugin eval suite
```

To change behaviour, edit `bin/alter-ego` and `SKILL.md`, run the tests, push; release-please bumps `version` in `plugin.json`.

## Limits

- It covers Claude's Bash commands that call `git` and `gh` by name — which is how Claude works. Programs that change a repository without the `git` command (libgit2 tools), GitHub MCP connectors and the desktop app's own commit / create-PR buttons are outside it; Claude is told not to use them in bot repositories.
- Bot mode works with github.com repositories only.
- Clean mode catches the obvious markers. Writing in your voice is the skill's job, not a filter's.
- Fetches over SSH keep using your own key; only pushes and `gh` go as the bot.
