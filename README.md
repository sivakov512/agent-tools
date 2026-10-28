# agent-tools

Tools for AI agents, one folder per plugin. Skills use the open [Agent Skills](https://agentskills.io) format (`SKILL.md`) and work in any agent that reads it; the `.claude-plugin/` folders add Claude Code / Cowork packaging (a plugin can also bundle commands, MCP servers, agents and hooks), and the repo doubles as a Claude plugin marketplace so each plugin installs on its own.

| Plugin | Skill | What it does | Needs |
|---|---|---|---|
| [`project-tracker`](project-tracker/README.md) | `project-tracker` | Keeps client project plans in Notion up to date from plain conversation: milestones and tasks, progress, slips, problems, status, weekly reports, notes, undo; new projects from emails, documents or Upwork contracts. Creates the Notion structure and a live dashboard itself. | Notion MCP (Upwork MCP for contracts) |
| [`upwork-pulse`](upwork-pulse/README.md) | `upwork-pulse` | Runs an Upwork job search with Notion as the source of truth: hourly search and assessment by your rules, a weekly review that turns open questions into rules, a live dashboard, proposals drafted in chat and sent only on your go. Creates the Notion structure, the dashboard and the scheduled tasks itself. | Notion MCP, Upwork MCP |
| [`alter-ego`](alter-ego/README.md) | `alter-ego` | Decides per repository whose name Claude's git and GitHub work goes under: clean (as you, no AI marks) or a GitHub bot account that commits, pushes and opens PRs, its token kept in the macOS Keychain or a Linux secret store. Asks once per repository, enforced by hooks. | Claude Code (hooks), `git`, `gh`, `jq` |
| [`fusion360`](fusion360/README.md) | `fusion360` | Builds and edits parametric models in Autodesk Fusion 360 the way a careful person would: every size a named parameter, derived sizes as formulas, a component per part built around the parts it mates with, constrained and named sketches, a readable history, FDM-ready fits, and checks after every change (health, rebuild, interference, travel). | Autodesk Fusion 360 with its MCP server |

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
    ├── skills/<skill>/
    │   ├── SKILL.md                  the skill — portable
    │   ├── references/               loaded only when a scenario needs them
    │   └── assets/                   pages the skill publishes
    ├── docs/skill-design.md          what the skill must do, its decisions, where things live
    └── evals/                        claude plugin eval suite
```

A plugin can also ship `hooks/`, `libexec/` and its own `tests/` — never a top-level `bin/` ([docs/skill-development.md](docs/skill-development.md) §2).

## Configuration

Skills do not hardcode workspace IDs. Each skill finds its Notion root page by a config toggle (the page can have any name) and reads the IDs from it; if there is none, it creates the whole structure on request, under a name you choose. alter-ego is the exception: it keeps its choices in `~/.config/alter-ego/config.json` and bot tokens in the OS secret store.

## Updating

Claude Code and Cowork pick a release up on `/plugin update`; chat needs a re-upload; a Codex symlink picks it up on `git pull`. A published dashboard older than the plugin is brought up to date by the skill: upwork-pulse republishes it by itself, project-tracker offers it in the next conversation.

## Development

How plugins here are built, checked and released — and how to add one — is [docs/skill-development.md](docs/skill-development.md); each plugin's own decisions are in its `docs/skill-design.md`.
