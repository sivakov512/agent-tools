---
name: alter-ego
description: Decides whose name your git and GitHub work goes out under, per repository — clean mode (as the user, with no AI marks anywhere) or a GitHub bot account (commits authored as e.g. "Claude(beelzebot)", pushes, PRs, issues and comments made by the bot), with bot tokens kept in the macOS Keychain or a Linux secret store. Use it whenever an alter-ego message appears (session context or a refused push / gh command), when the user runs /alter-ego, and whenever they ask whose name commits or PRs go under, to work as a bot or "clean" / "без ИИ-следов" / "от моего имени" in a repo, to switch or show the mode, to add, check, invite, rotate or remove a bot account or its token, to change how the bot signs its name, or to set this up on a new machine (macOS or Linux) — even without the words alter-ego, bot or identity.
---

# alter-ego

The user works in two kinds of repositories. In some — client projects, their open source, issue threads — AI work must not show: everything goes out as the user, with no trace of Claude. In others — their own tools — they want to see at a glance what a machine wrote, review it as someone else's pull request and filter it on GitHub. alter-ego gives each repository one of two modes and remembers it:

- **clean** — commits, pushes, PRs, issues, reviews and comments are the user's own, with no AI marks.
- **a bot** — a GitHub account of the user's (say `beelzebot-robot`): your commits are signed `Claude(beelzebot)`, and pushes and `gh` writes act as that account.

Talk to the user in their language; keep these explanations short — they know what the modes are.

## How it works

The plugin enforces; your part is the conversation.

- In your Bash commands, `git` and `gh` are alter-ego's wrappers, put first on PATH by a SessionStart hook. Each call is decided when it runs, from its own arguments and folder: `git -C`, a `cd`, a subshell or an alias land in the repository they act on, under that repository's mode. Only these programs are touched, and only for you; the user's own terminal is unaffected.
- **No mode yet:** everything runs as the user, but `git push` and `gh` writes are refused with a message that tells you to ask. Local commits are fine.
- **Clean:** a push is refused while the commits or tags it sends carry AI marks or a bot's authorship, and a `gh` write is refused while its text (arguments, body files, stdin) carries AI marks.
- **Bot:** every git and gh call on the repository is the bot. Commits are signed as the bot; pushes go over https with the bot's token, whatever the remote URL looks like; gh runs with the bot's token. Account commands (`gh auth`, `gh config`, `gh gist`, `gh search`) stay the user's. Anything that would put work out as the user instead (no token, a push URL the token can't serve) is refused.
- A PreToolUse hook refuses `git` or `gh` called by full path or with PATH replaced, because that would skip the wrappers.
- Choices live in `~/.config/alter-ego/config.json`, keyed by the remote (`github.com/owner/repo`), so every clone and worktree shares one choice. Tokens never go there: they stay in the OS secret store and are read only when a push or a gh call needs one.

The `alter-ego` command is on PATH too. In a session that started before the plugin was installed it isn't, and nothing is enforced yet: use `bash "${CLAUDE_PLUGIN_ROOT}/libexec/alter-ego"` and tell the user a new session is needed.

| Command | Does |
|---|---|
| `alter-ego status` | this repository's mode, where bot pushes go, the bots, the secret store, whether the wrappers are active |
| `alter-ego use <clean\|bot>` | sets this repository's mode (`off` means clean) |
| `alter-ego forget` | drops the choice, so it is asked again |
| `alter-ego bots` | bots, whether each is ready, where each is chosen |
| `alter-ego add-bot <name> <login> [--secret NAME] [--secret-command CMD] [--name-format FMT]` | adds a bot, or updates one, keeping what it had; checks its token if it is stored already |
| `alter-ego check <bot>` | asks GitHub whose token it is, saves the account id |
| `alter-ego invite <bot> [owner/repo]` | invites the bot to a repository with the user's own `gh` login and accepts as the bot |
| `alter-ego store-command <bot>` | the command that stores the bot's token on this OS |
| `alter-ego as <bot> <command…>` | runs one command with the bot's `GH_TOKEN`, for account chores, not repository work |
| `alter-ego name-format <fmt> [--bot NAME]` | how commits are signed; `{bot}` and `{login}` are replaced |
| `alter-ego remove-bot <bot> [--force]` | removes a bot (not its token) |
| `alter-ego attribution [status\|off]` | Claude's own Co-Authored-By / "Generated with" lines, for all repositories |
| `alter-ego doctor` | dependencies and setup |

## Choosing the mode for a repository

You learn a repository has no mode from the session context or from a refused command. Ask once, before the first push, PR, issue, review or comment there — not at the start of a session that only reads code.

The question has to be one the user cannot miss: a mode chosen by accident puts work out under the wrong name. So:

- Ask it with the AskUserQuestion tool whenever you have it: the options appear as buttons. Offer **Clean** (as them, no AI marks), one option per bot from `alter-ego bots` ("as beelzebot-robot, commits signed Claude(beelzebot)"), and **Add a bot**.
- Ask it on its own. Don't tuck it into a longer report, and don't bundle it with another question ("and shall I release?"): ask the mode first, the rest after.
- Without that tool, make it the last paragraph of your reply, under a bold heading such as **Whose name for this repository?**, with the options as a short list and nothing after it.
- Wait for the answer; don't push or post anything meanwhile.

Recommend nothing: the user knows which kind of repository this is. Then run `alter-ego use <choice>` in the repository and carry on with what was refused.

The choice is the user's alone. Don't pick a mode yourself, even when it looks obvious, and don't route around a refusal: no git or gh by full path, no replaced PATH, no editing the config by hand. Each of those would put work out under the wrong name, which is what the user installed this to prevent.

When the user asks to switch ("работай тут от бота", "сделай этот репо чистым", `/alter-ego off`), run `alter-ego use …` and confirm in one line. Commits already made keep their author. If unpushed commits were made under the old mode, say so and offer to re-author them: `git commit --amend --reset-author` for the last one, `git rebase --exec 'git commit --amend --no-edit --reset-author' <base>` for several. Re-authoring in bot mode gives the bot's authorship. Never rewrite commits that are already pushed unless the user asks.

`/alter-ego` with no arguments: run `alter-ego status` and relay it in two or three lines.

## Clean mode

Everything outward reads as the user wrote it. No `Co-Authored-By` or "Generated with Claude Code" lines, no 🤖, no links to Claude, no "as an AI", and no mention that an assistant was involved — in commit messages, PR and issue text, reviews or comments. The wrappers catch only the obvious markers; the rest is up to you. Match the repository's commit style and the user's voice: plain, short, specific.

If `alter-ego attribution` says `on`, Claude Code itself adds the attribution lines. Offer once to turn them off for every repository with `alter-ego attribution off`; it changes the user's global Claude settings, so ask first. In bot mode they are pointless too: the bot's authorship already says who wrote the work.

## Bot mode

- Commit, push, open PRs and comment yourself with `git` and `gh` in Bash, called by name. Those calls carry the bot's identity.
- Don't offer the app's own commit or create-PR buttons in such a repository: they don't run through your Bash and would act as the user. Offer plain reply buttons ("Commit and open PR") and do the work yourself.
- Don't write to GitHub through an MCP connector there: connectors use the user's own account.
- A pull request opened by the bot is one the user can review and approve like a colleague's. Write its description for that reviewer: what changed, why, how it was checked.
- Bot mode works with github.com repositories only.

## Procedures — read the file for what you are doing

| Doing | Started by | Read |
|---|---|---|
| Adding, checking, inviting, rotating or removing a bot | the user asks, or **Choosing the mode for a repository** → Add a bot | `references/bots.md` |
| Setting alter-ego up on a machine | the user installs the plugin or asks to set it up | `references/setup.md` |

## When something is refused

The message says why. Act on it:
- no mode → ask the user;
- AI marks in clean mode → reword the commits, tag or text, then retry;
- bot commits in a clean repository → ask whether to re-author them or switch the repository;
- missing token or id → give the user the store command, or run `alter-ego check`;
- a push URL the bot can't use → push to the repository's GitHub remote by name;
- git or gh by full path → call them by name.

Never route around a refusal.
