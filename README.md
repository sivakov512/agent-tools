# agent-tools

Tools for AI agents, one folder per plugin. Skills use the open [Agent Skills](https://agentskills.io) format (`SKILL.md`) and work in any agent that reads it; the `.claude-plugin/` folders add Claude Code / Cowork packaging (a plugin can also bundle commands, MCP servers, agents and hooks), and the repo doubles as a Claude plugin marketplace so each plugin installs on its own.

| Plugin | Skill | What it does | Needs |
|---|---|---|---|
| [`project-tracker`](project-tracker/README.md) | `project-tracker` | Keeps client project plans in Notion up to date from plain conversation: progress, slips, issues, status, weekly reports, notes, undo; new projects from emails, documents or Upwork contracts. Creates the Notion structure and a live dashboard itself. | Notion MCP (Upwork MCP for contracts) |
| [`upwork-pulse`](upwork-pulse/README.md) | `upwork-pulse` | Runs an Upwork job search with Notion as the source of truth: hourly search and assessment by your rules, digests, a weekly review that turns open questions into rules, a live dashboard, proposals drafted in chat and sent only on your go. Creates the Notion structure, the dashboard and the scheduled tasks itself. | Notion MCP, Upwork MCP |

## Install

Each plugin's README has the details (connectors, first run). In short:

**Claude Code**

```
/plugin marketplace add sivakov512/agent-tools
/plugin install <plugin>@sivakov512
```

**Cowork** — add the marketplace `sivakov512/agent-tools` in the plugin settings, then install the plugin you want.

**Chat (claude.ai and the desktop app)** — install the plugin from the marketplace where your plan allows it; otherwise zip `<plugin>/skills/<skill>/` and upload it in Settings → Skills (re-upload after changes).

**Codex and other agents** — copy or symlink `<plugin>/skills/<skill>/` to where the agent looks for skills (Codex: `~/.codex/skills/<skill>/`) and connect the MCP servers the skill needs. Talk to the skill in plain language.

## Layout

```
agent-tools/
├── .claude-plugin/marketplace.json   lists the plugins below
└── <plugin>/
    ├── README.md                     install, usage, model, limits
    ├── .claude-plugin/plugin.json    Claude packaging (name, version)
    └── skills/<skill>/
        ├── SKILL.md                  the skill — portable
        └── references/               loaded only when a scenario needs them
```

## Configuration

Skills do not hardcode workspace IDs. Each skill finds its Notion root page by a config toggle (the page can have any name) and reads the IDs from it; if there is none, it creates the whole structure on request, under a name you choose.

## Updating

Edit the skill and push with a conventional commit; the version is not bumped by hand. Claude Code and Cowork pick a release up on `/plugin update`; chat needs a re-upload; a Codex symlink picks it up on `git pull`.

Releases are cut by [release-please](https://github.com/googleapis/release-please), one independent version per plugin. Every push to `master` updates a standing release PR for each plugin that changed, with the next version and changelog; merging it bumps `version` in that plugin's `plugin.json`, writes its `CHANGELOG.md` and tags `<plugin>-vX.Y.Z`. A commit counts for the plugin whose files it touches, whatever its scope. The subject is `type: short imperative subject` (`feat: offer the dashboard when there is none`): `feat` bumps minor, `fix` bumps patch (while the version is below 1.0, a breaking `!` bumps minor too), and `docs`, `test`, `ci`, `chore` stay out of the version math. Config lives in `.release-please/`.

Dashboards: each `assets/dashboard.html` starts with `<!-- dashboard-version: N -->`. When a change to the page is worth republishing, bump N and add a line to the skill's Versions list; the skill then offers the update to everyone whose published dashboard is older, in their next conversation with it. The two dashboards share one look — change the shared parts in both.

## Adding a plugin

New folder `<plugin>/` with `README.md`, `.claude-plugin/plugin.json` and `skills/<skill>/SKILL.md` (optionally `commands/`, `.mcp.json`, `agents/`); add it to `marketplace.json` and to the table above, and to `packages` in `.release-please/config.json` and `.release-please/manifest.json` (same shape as the existing entries, starting at `0.0.0`).
