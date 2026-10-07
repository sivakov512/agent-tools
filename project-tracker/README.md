# project-tracker

Keeps client project plans in Notion up to date from plain conversation. You tell the agent what happened — "readings are coming through", "the vendor ate a week", "the runner is up" — and it updates the plan, records why, tells you what it changed, and keeps a one-screen status page per project that you can also show the client.

The plugin and the skill inside it are both called `project-tracker`.

## What you get in Notion

A root page — you name it at setup, **Project tracker** by default — with four databases and two kinds of pages. A project is planned at whichever level fits it: **milestones only** (an Upwork contract's stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work such as support, with no promised stages).

**Root page** — a collapsed config toggle, then tabs; each tab is one of the databases with its own views:

```
▸ ⚙️ Config
[ Projects ] [ Milestones ] [ Tasks ] [ Problems ]
```

| Tab | Database · views | Use it for |
|---|---|---|
| Projects | Projects · Active, Closed | the portfolio at a glance: summary, target date, source; finished and removed projects |
| Milestones | Milestones · Next up, Timeline | what is left across projects, and whether they collide |
| Tasks | Tasks · All, Waiting on, Timeline | every open task by project; whom you are waiting on; the steps across projects |
| Problems | Problems · Open, Recently resolved | what is in the way; what got closed, newest first (set to the past month by hand at setup) |

**Project page** — a status callout, then tabs:

```
Late, days  7                                   ← live, computed by Notion
🟡 Now: Demo prototype — due Nov 9 → Board and enclosure designed, ordered, due Oct 16
   Waiting on: Lab quotes received (Kestrel Labs, Halden Test)
   Open: 2 risks
   On hold: Firmware on the dev board — set aside for the demo prototype, since Oct 6

[ Plan ] [ Tasks ] [ Schedule ] [ Problems ] [ Notes ]
```

The callout holds only what changes when something happens (what is in progress, what blocks you, whom you wait on, what is on hold). Lateness depends on today's date, so it is never written as text — Notion computes it live and shows it as `Late, days` at the top of the page and in every table.

| Tab | Shows | Use it for |
|---|---|---|
| Plan | Gantt of milestones | where the project is and what comes next |
| Tasks | a table of tasks grouped by milestone (undated ones too), then their Gantt as a second view | the steps inside each stage |
| Schedule | every milestone with its agreed dates, the day it was finished and days late | what is late and by how much |
| Problems | the project's open blockers, risks and questions | what is in the way |
| Notes | notes, call summaries, client emails, docs, files; the original plan the project was made from | anything that is not the plan |

Click a milestone or a task to see **why**: its page body is a dated history — what was done, when dates were moved with the client and why, what was paused. A milestone page also lists its tasks.

Pages, databases and tabs have no icons.

### The databases

- **Projects** — name, client, `Origin` (Upwork / Direct / Personal, or options you add; the dashboard groups by it), status (Active / Paused / Done / Removed), one-sentence summary, target end, repository, `Source` (where the project came from: an Upwork contract or a shared document), `Claude project` (the claude.ai project its chats open in) and `Late, days` — the worst lateness among its open milestones and tasks, live.
- **Milestones** — the stages the client was promised, status Planned / In progress / Paused / Done / Dropped:
  - `Dates` — the dates agreed with the client; the Gantt is drawn from them. They move only when you say the new dates are agreed (every move is written into the history).
  - `Finished` — the day it was actually done.
  - `Late, days` — live: finished − due for a done milestone; today − due for an open one past its date; nothing while it (or its project) is paused.
- **Tasks** — steps of days or weeks, with an optional milestone, status Planned / In progress / Waiting / Done / Dropped. `Dates` follow the same rule as milestones: every date in the tracker is one the client was given, and a late task counts in the project's lateness; steps you plan only for yourself simply have no dates. A handover the plan expects — an RFQ the labs must answer, a sign-off, files from the client — is a task in `Waiting`, with whom it waits on, named by its result ("Lab quotes received").
- **Problems** — only what was not in the plan: `Blocker` (stuck on something nobody planned for), `Risk`, `Question`, with status Open / Waiting / Resolved / Dropped, who it is waiting on (a person, a vendor or the client by name; empty = on you) and an optional link to the milestone and task it affects.

All four databases have `Chat` — the link of the Claude chat about that row, filled in by the chat itself (see [Dashboard](#dashboard)).

`Removed` and `Dropped` are for things you threw away: they disappear from every view, overview and report instead of showing up as finished work.

The root page's **Config** toggle lists the four database IDs. The skill finds the root page by this toggle and reads it on every run, so nothing is hardcoded: rename or move the page as you like; if you move or recreate the databases, edit the IDs. Keep the toggle's title line — that is what the skill searches for. Setup also adds a `dashboard` line with the dashboard's link and `dashboard_version` with the version it was published from.

**Coming from 0.x** (three databases, `Phase` on milestones, Issues with a `Task` type)? The skill recognises the old tracker and offers the upgrade: it sets up the new structure next to the old one, copies the live data by fixed rules (phases become milestones and their milestones tasks, `Task` issues become tasks, everything else problems, histories kept), keeps the same dashboard link, and retires the old page without deleting it — it stays as your backup.

## Dashboard

A live, read-only page over the tracker for you alone, published by setup as a claude.ai artifact that reads Notion with your Notion connector:

- **pills** in the header — blocked, overdue, due soon — always there, coloured only when not zero;
- **timeline** — every project on one axis with today, 1 month / 3 months / 6 months / year / all, drag to move in time; a bar under the cursor widens to its full name; a milestone's tasks are thin marks under its bar, ▸ next to a project opens them up as bars;
- **projects** — a card per project: state, the milestone in focus with its current task and timing, a blocker if any, a strip of milestones;
- **your move** (blocked, overdue, due soon, on you, needs dates), **waiting on others** — waiting tasks and problems grouped by who, oldest first — and **recently completed**;
- a click on anything opens the project as a page sliding in from the right: status note, where it stands, open items, the plan with tasks under their milestones and each one's history, notes; ↑ / ↓ steps between projects.

Lateness is computed in the page by the same rule as the Notion formulas, for milestones and tasks alike. Nothing on the page writes to Notion: changes go through the chat, where the rules live. The first time it asks to allow the Notion connector for the page. It looks like the upwork-pulse dashboard on purpose. What it is for and how it is republished: [references/dashboard.md](skills/project-tracker/references/dashboard.md). If the tracker was set up before the dashboard existed (or you removed its link from the config), the skill offers to publish it, once; or ask "publish the dashboard".

**Claude chats.** A project and each of its milestones, tasks and problems has a **Claude chat** button. The first click starts a chat that loads that row and writes its own link into the row's `Chat`; later clicks reopen the same chat, and ▾ → New chat replaces it when the old one is gone. In the chat you talk as usual — it is the row's thread. A project's chats open inside its claude.ai project (`Claude project`, asked when the project is created; "open its chats in <project link>" changes it) on the phone and the web; the desktop app opens them outside projects. Details: [references/chats.md](skills/project-tracker/references/chats.md).

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
   - **full width** for the page (••• → Full width), optional but recommended: without it Notion folds each tab's second view (`Closed`, `Timeline`, `Recently resolved`) into a dropdown;
   - **hide properties**, once per database: on a project page `Milestones`, `Tasks`, `Milestones late`, `Tasks late` → *Always hide*, `Chat` and `Claude project` → *Hide when empty*; on a milestone page `Project status` and `Open late` → *Always hide*, `Chat` → *Hide when empty*; on a task page `Project status`, `Milestone status` and `Open late` → *Always hide*, `Chat` → *Hide when empty*; on a problem page `Chat` → *Hide when empty*. Project, milestone and task pages already open at full width.
3. Create a project: paste a plan or an email, point to one ("my last weekly report in Sent"), or name an Upwork contract. Section headings become milestones and the items under them tasks; a flat list becomes milestones; a contract gives its stages as milestones. The agent shows what it extracted and which source it used, and waits for your OK.
4. On the project page: switch the Plan timeline and the Tasks tab's Timeline view to **Quarter** or **Month**. Notion remembers it.

## How to use it

Talk normally. After every change the agent replies with one line per change, **was → now**.

| You say | What happens |
|---|---|
| "Make a project for the meter from this email: …" / "from my last report in Sent" / "from my Upwork contract" | extracts milestones, tasks, dates and problems, shows them, creates everything after you confirm; asks for milestone dates the source lacks |
| "Finished the demo firmware" / "readings are coming through" | marks the task (or milestone) done or records progress; starts the milestone if it was planned; asks whether to close the milestone when its last task is done |
| "Sent the RFQ to the labs" / "Dana signed" | the task waits on the labs / is done |
| "Add a task: order a debugger" | a new task under the milestone it serves, no dates and no questions unless you give them |
| "Open the meter's chats in <claude.ai project link>" | sets the project's `Claude project` |
| "The boards are three days late" | records it as not agreed yet, shows what would move (the task, the steps after it, the milestone's end) and asks whether the new dates are agreed; moves them on yes |
| "The enclosure test is on hold until the parts arrive" / "resume it" | pauses the milestone (not counted as late, nor are its tasks); on resume asks how much is left and whether the new dates are agreed |
| "No CI runner, Marko needs to set one up" / "the lab quote is late, a risk for certification" | adds a blocker / a risk linked to the task and milestone it threatens |
| "It's the client who has to answer, not Marko" | updates the task or problem |
| "No, that was yesterday" / "it wasn't fixed after all" | corrects what was recorded |
| "Undo that" | reverts the agent's last change |
| "Save the notes from today's call: …" / "attach this datasheet" | goes into the project's Notes tab (correspondence about one task goes into that task's history) |
| "The meter is on hold" / "Brightbrush is finished" | sets the project's status |
| "The client added a second enclosure revision" / "break the demo into these steps: …" / "drop the accuracy validation" / "finished early, pull the rest in" | proposes the plan change, asks, applies it with history lines |
| "Sync Brightbrush with Upwork" | re-reads the contract and applies stages started or submitted there and changed due dates |
| "How are the masts?" | now (milestone and its current task) / late / blocked, waiting or on hold / next |
| "What's on me this week?" | your overdue, due, in-progress and starting items, grouped by project, and whom to chase |
| "What's burning this week?" / "Who do I chase?" | overview across all projects |
| "Weekly report for the meter" / "…as an email to the client" | a summary of the week in the chat; a client email only if you ask for one |
| "Delete the test project" / "bring it back" | the API cannot delete: sets it Removed and drops its unfinished milestones, tasks and open problems, so nothing of it shows anywhere; restoring puts them back |

The agent asks before replanning — creating a project, moving dates, adding or dropping milestones — and whenever a milestone date is not stated and does not follow from the source; it never guesses dates. Facts you report (done, waiting, resolved, paused, a corrected date, a task you asked for) and undo it just records and reports. When it sees a milestone or task past its date, it asks what happened.

If a message does not trigger the skill, name the project or say "tracker", or start it with `/project-tracker`.

### As a command

The skill is also a slash command: `/project-tracker <anything>` (in Claude Code the menu may show `/project-tracker:project-tracker`). It does the same as writing the text normally — use it when a message does not trigger the skill on its own: `/project-tracker set up the tracker`, `/project-tracker status of the meter`, `/project-tracker save to the meter notes, nothing else: …`.

### Undo

"Undo that" restores what the agent's last change in this conversation replaced, removes the history lines it added and drops rows it created. In a later conversation it rebuilds the old values from the milestone history (date moves are recorded there as `Mar 6 → Mar 13`), shows what it would restore and asks first. Notion's own page history (••• → Version history) is the fallback — the API cannot restore versions.

## Model

Works with **Claude Opus** and **Claude Sonnet**; both pass the eval suite. Opus is the more reliable of the two. With Sonnet, a bare name with no context ("what's the status of the meter?") sometimes does not trigger the skill — say "project" or "tracker", or use a command. Client emails drafted by Sonnet sometimes carry phrases the tracker does not support ("we'll ship…") — read them before sending. Haiku is not enough: it drops problems when extracting a plan and mismatches project names.

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
        ├── upgrade.md            move a 0.x tracker to this version
        ├── new-project.md        extracting a plan; building a project page
        ├── contracts.md          platform contracts (Upwork): mapping and resync
        ├── plan-changes.md       adding / dropping milestones and tasks, pulling in, removing
        ├── report.md             weekly report
        ├── chats.md              Claude chats opened from the dashboard; a project's claude.ai project
        └── dashboard.md          what the dashboard is for; publishing and updating it
```

To change behaviour, edit `SKILL.md` or the reference for that scenario, push; release-please bumps `version` in `plugin.json`.

## Limits

- The skill reads only through views and page fetches, never Notion SQL (it has a workspace quota on non-Business plans).
- Not settable through the Notion API: full width, the timeline zoom and hiding properties on pages — set them once by hand.
- The API cannot delete pages or restore page versions: removed things are marked `Removed` / `Dropped`; delete pages by hand if you want them gone.
- Filters on formula properties are dropped by the API, so `Schedule` lists every milestone; add "Late, days > 0" by hand if you want only late ones.
- The API returns formula values as opaque references, so the agent computes lateness from the dates by the same rule when it answers.
