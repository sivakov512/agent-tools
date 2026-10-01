# project-tracker

Keeps client project plans in Notion up to date from plain conversation. You tell the agent what happened — "readings are coming through", "the vendor ate a week", "the runner is up" — and it updates the plan, records why, tells you what it changed, and keeps a one-screen status page per project that you can also show the client.

The plugin and the skill inside it are both called `project-tracker`.

## What you get in Notion

A root page — you name it at setup, **Project tracker** by default — with three databases and two kinds of pages.

**Root page** — a collapsed config toggle, then tabs; each tab is one of the databases with its own views:

```
▸ ⚙️ Config
[ Projects ] [ All plans ] [ Issues ]
```

| Tab | Database · views | Use it for |
|---|---|---|
| Projects | Projects · Active | the portfolio at a glance: summary, target date, source |
| All plans | Milestones · Next up, Timeline | what is left across projects, and whether they collide |
| Issues | Issues · Waiting on, Recently resolved | who to chase; what got closed |

**Project page** — a status callout, then tabs:

```
Late, days  7                                   ← live, computed by Notion
🔴 Now: Enclosure test — due Mar 25
   Blocked on: Test rig (Dana) · Spec sign-off (Fjord Labs)
   On hold: Radio certification — waiting on Kestrel, since Mar 10

[ Plan ] [ Schedule ] [ Open items ] [ Notes ]
```

The callout holds only what changes when something happens (what is in progress, what is in the way, what is on hold). Lateness depends on today's date, so it is never written as text — Notion computes it live and shows it as `Late, days` at the top of the page and in every table.

| Tab | Shows | Use it for |
|---|---|---|
| Plan | Gantt of milestones | where the project is and what comes next |
| Schedule | every milestone with its agreed dates, the day it was finished and days late | what is late and by how much |
| Open items | the project's unresolved issues | what is in the way |
| Notes | notes, call summaries, client emails, docs, files; the original plan the project was made from | anything that is not the plan |

Click a milestone to see **why**: its page body is a dated history — what was done, when dates were moved with the client and why, what was paused.

Pages, databases and tabs have no icons.

### The databases

- **Projects** — name, client, status (Active / Paused / Done / Removed), one-sentence summary, target end, repository, `Source` (where the project came from: an Upwork contract or a shared document) and `Late, days` — the worst lateness among its open milestones, live.
- **Milestones** — plan items, status Planned / In progress / Paused / Done / Dropped:
  - `Dates` — the dates agreed with the client; the Gantt is drawn from them. They move only when you say the new dates are agreed (every move is written into the milestone's history).
  - `Finished` — the day it was actually done.
  - `Late, days` — live: finished − due for a done milestone; today − due for an open one past its date; nothing while it (or its project) is paused.
- **Issues** — `Blocker`, `Risk`, `Question`, `Task`, with status Open / Waiting / Resolved / Dropped, who it is waiting on (a person, a vendor or the client by name; empty = on you) and an optional link to the milestone it affects.

`Removed` and `Dropped` are for things you threw away: they disappear from every view, overview and report instead of showing up as finished work.

The root page's **Config** toggle lists the three database IDs. The skill finds the root page by this toggle and reads it on every run, so nothing is hardcoded: rename or move the page as you like; if you move or recreate the databases, edit the IDs. Keep the toggle's title line — that is what the skill searches for. Setup also adds a `dashboard` line with the dashboard's link and `dashboard_version` with the version it was published from.

## Dashboard

A live, read-only page over the tracker for you alone, published by setup as a claude.ai artifact that reads Notion with your Notion connector:

- **pills** in the header — blocked, overdue, due soon — always there, coloured only when not zero;
- **timeline** — every project on one axis with today, 3 months / 6 months / all, drag to move in time;
- **projects** — a card per project: state, the milestone in focus with its timing, a blocker if any, a strip of milestones;
- **your move** (blocked, overdue, due soon, on you, needs agreed dates), **waiting on others** grouped by who, oldest first, **recently completed**;
- a click on anything opens the project as a page sliding in from the right: status note, where it stands, open items, milestones with their history, notes; ↑ / ↓ steps between projects.

Lateness is computed in the page by the same rule as the Notion formula. Nothing on the page writes to Notion: changes go through the chat, where the rules live. The first time it asks to allow the Notion connector for the page. It looks like the upwork-pulse dashboard on purpose. What it is for and how it is republished: [references/dashboard.md](skills/project-tracker/references/dashboard.md). If the tracker was set up before the dashboard existed (or you removed its link from the config), the skill offers to publish it, once; or ask "publish the dashboard".

**Updates.** The page carries a version on its first line and the config remembers which version you published. When the skill ships a newer one, the next time you talk to the skill it says what is new and asks whether to update; yes republishes to the same link, no means that version is not offered again. With no dashboard in the config at all, it offers to publish one the same way.

## Install

Needs the **Notion** MCP server / connector on the same surface; for projects from Upwork contracts, the **Upwork** connector too. Model: see [Model](#model).

**Claude Code**

```
/plugin marketplace add sivakov512/agent-tools
/plugin install project-tracker@sivakov512
```

Notion: the claude.ai Notion connector is picked up automatically if you are logged in with a claude.ai account; otherwise `claude mcp add --transport http notion https://mcp.notion.com/mcp` and authenticate with `/mcp`.

**Cowork** — in the plugin settings add the marketplace `sivakov512/agent-tools` and install `project-tracker`. Enable the Notion connector.

**Chat (claude.ai and the desktop app)** — install the plugin from the same marketplace where your plan allows plugins there; the skill comes with it. Otherwise upload the skill itself: zip the folder `project-tracker/skills/project-tracker/` (the zip must contain the `project-tracker/` folder with `SKILL.md` and `references/` inside), upload it in Settings → Skills, and talk normally. Re-upload after updates. Enable the Notion connector.

**Codex** — link the skill folder and add Notion MCP:

```
ln -s "$PWD/project-tracker/skills/project-tracker" ~/.codex/skills/project-tracker
codex mcp add notion --url https://mcp.notion.com/mcp
```

then authenticate Notion as the Codex docs describe. Any other agent that reads `SKILL.md` works the same way.

## First run

1. "Set up the project tracker in Notion" (or `/project-tracker set up`). It proposes a name and a place for the page (`Project tracker`, top level) — answer OK or give your own, or say them up front: "set up the tracker as *Client work* under *Freelance*". Running it again is safe: it finishes an interrupted setup instead of making a second one.
2. Click through the short list setup ends with — the API cannot do these:
   - **full width** for the page (••• → Full width), optional but recommended: without it Notion folds each tab's second view (`Timeline`, `Recently resolved`) into a dropdown;
   - **hide helper properties**, once per database: on a project page `Milestones` → *Always hide*; on a milestone page `Project status` and `Open late` → *Always hide*.
3. Create a project: paste a plan or an email, point to one ("my last weekly report in Sent"), or name an Upwork contract. The agent shows what it extracted and which source it used, and waits for your OK.
4. On the project page: switch the Plan timeline to **Quarter** (and full width if you like). Notion remembers both.

## How to use it

Talk normally. After every change the agent replies with one line per change, **was → now**.

| You say | What happens |
|---|---|
| "Make a project for the meter from this email: …" / "from my last report in Sent" / "from my Upwork contract" | extracts milestones, dates and issues, shows them, creates everything after you confirm; asks for dates the source lacks |
| "Readings from the meter are coming through" | marks the milestone done or records progress, updates the status |
| "The vendor ate another week" | asks whether the new date is agreed with the client; if yes, proposes the shifted dates and moves the plan with the cause in the history; if not, only records it — the milestone shows as late once its date passes |
| "The enclosure test is on hold until the parts arrive" / "resume it" | pauses the milestone (not counted as late), links who you wait on; on resume asks how much is left and whether the new dates are agreed |
| "No CI runner, Marko needs to set one up" / "Marko set up the runner" | adds an issue waiting on Marko / resolves it |
| "It's the client who has to answer, not Marko" | updates the issue |
| "No, that was yesterday" / "it wasn't fixed after all" | corrects what was recorded |
| "Undo that" | reverts the agent's last change |
| "Save the notes from today's call: …" / "attach this datasheet" | goes into the project's Notes tab |
| "The meter is on hold" / "Brightbrush is finished" | sets the project's status |
| "The client added a second enclosure revision" / "drop the accuracy validation" / "finished early, pull the rest in" | proposes the plan change, asks, applies it with history lines |
| "Sync Brightbrush with Upwork" | re-reads the contract and applies funded / submitted / paid stages |
| "What's the status of the meter?" | now / late / blocked or on hold / next |
| "What's burning this week?" / "Who do I chase?" | overview across all projects |
| "Weekly report for the meter" / "…as an email to the client" | a summary of the week in the chat; a client email only if you ask for one |
| "Delete the test project" / "bring it back" | the API cannot delete: sets it Removed and drops its unfinished milestones and open issues, so nothing of it shows anywhere; restoring puts them back |

The agent asks before replanning — creating a project, moving milestones, adding or dropping them — and whenever a date is not stated and does not follow from the source; it never guesses dates. Facts you report (done, resolved, paused, a corrected date) and undo it just records and reports. When it sees a milestone past its date, it asks what happened.

If a message does not trigger the skill, name the project or say "tracker", or start it with `/project-tracker`.

### As a command

The skill is also a slash command: `/project-tracker <anything>` (in Claude Code the menu may show `/project-tracker:project-tracker`). It does the same as writing the text normally — use it when a message does not trigger the skill on its own: `/project-tracker set up the tracker`, `/project-tracker status of the meter`, `/project-tracker save to the meter notes, nothing else: …`.

### Undo

"Undo that" restores what the agent's last change in this conversation replaced, removes the history lines it added and drops rows it created. In a later conversation it rebuilds the old values from the milestone history (date moves are recorded there as `Mar 6 → Mar 13`), shows what it would restore and asks first. Notion's own page history (••• → Version history) is the fallback — the API cannot restore versions.

## Model

Works with **Claude Opus** and **Claude Sonnet**; both pass the eval suite. Opus is the more reliable of the two. With Sonnet, a bare name with no context ("what's the status of the meter?") sometimes does not trigger the skill — say "project" or "tracker", or use a command. Client emails drafted by Sonnet sometimes carry phrases the tracker does not support ("we'll ship…") — read them before sending. Haiku is not enough: it drops issues when extracting a plan and mismatches project names.

## Tests

`evals/` holds a `claude plugin eval` suite covering every scenario with a mocked Notion workspace — see [evals/README.md](evals/README.md). From `project-tracker/`:

```
claude plugin eval . --runs 1 --ablation none --scaffold --trust-plugin --judge-model sonnet -j 2 --no-publish
```

## Where things are

```
project-tracker/
├── README.md                     this file
├── .claude-plugin/plugin.json    Claude plugin packaging (name, version)
├── evals/                        claude plugin eval suite (mocked Notion)
└── skills/project-tracker/
    ├── SKILL.md                  loaded on every use: the model, data rules, Notion calls, everyday scenarios
    ├── assets/dashboard.html     the dashboard page; setup fills in the root page ID and publishes it
    └── references/               loaded only when the scenario needs them
        ├── setup.md              create or finish the Notion structure
        ├── new-project.md        extracting a plan; building a project page
        ├── contracts.md          platform contracts (Upwork): mapping and resync
        ├── plan-changes.md       adding / dropping milestones, pulling in, removing
        ├── report.md             weekly report
        └── dashboard.md          what the dashboard is for; publishing and updating it
```

To change behaviour, edit `SKILL.md` or the reference for that scenario, bump `version` in `plugin.json`, push.

## Limits

- The skill reads only through views and page fetches, never Notion SQL (it has a workspace quota on non-Business plans).
- Not settable through the Notion API: full width, the timeline zoom and hiding properties on pages — set them once by hand.
- The API cannot delete pages or restore page versions: removed things are marked `Removed` / `Dropped`; delete pages by hand if you want them gone.
- Filters on formula properties are dropped by the API, so `Schedule` lists every milestone; add "Late, days > 0" by hand if you want only late ones.
- The API returns formula values as opaque references, so the agent computes lateness from the dates by the same rule when it answers.
