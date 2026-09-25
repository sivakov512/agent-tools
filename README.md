# agent-tools

Tools for AI agents, one folder per plugin. Skills use the open [Agent Skills](https://agentskills.io) format (`SKILL.md`) and work in any agent that reads it; the `.claude-plugin/` folders add Claude Code / Cowork packaging (a plugin can also bundle commands, MCP servers, agents and hooks), and the repo doubles as a Claude plugin marketplace so each plugin installs on its own.

| Plugin | Skill | What it does | Needs |
|---|---|---|---|
| [`project-tracker`](project-tracker/README.md) | `project-tracker` | Keeps client project plans in Notion up to date from plain conversation: progress, slips, issues, status, weekly reports, notes, undo; new projects from emails, documents or Upwork contracts. Creates the Notion structure itself. | Notion MCP (Upwork MCP for contracts) |

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

Skills do not hardcode workspace IDs. `project-tracker` finds its Notion root page by a config callout (the page can have any name) and reads the database IDs from it; if there is none, it creates the whole structure on request, under a name you choose.

## Updating

Edit the skill, bump `version` in the plugin's `plugin.json` (semver), push. Claude Code and Cowork pick it up on `/plugin update`; chat needs a re-upload; a Codex symlink picks it up on `git pull`.

## Adding a plugin

New folder `<plugin>/` with `README.md`, `.claude-plugin/plugin.json` and `skills/<skill>/SKILL.md` (optionally `commands/`, `.mcp.json`, `agents/`); add it to `marketplace.json` and to the table above.
