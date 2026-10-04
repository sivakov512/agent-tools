# upwork-pulse

Runs a freelancer's Upwork job search with Notion as the source of truth. Scheduled agents search the feed every hour, assess each posting against your own rules, write the promising ones into Notion and message you only when something is worth applying to fast; two digests a day recap the rest; a weekly review turns the cases your rules did not cover into new rules. With auto proposals on, for every new card an Opus agent advises apply or skip and, for apply, writes a ready-to-paste draft — cover letter, bid, milestones, screening answers — that you copy into Upwork yourself. In chat the same skill discusses a posting on fresh data, drafts a proposal in your voice and submits it only on your explicit go. Every proposal you write or send lands in a Proposals database, as sent. A live dashboard shows leads with their proposals, what you sent, contracts and connects.

The plugin and the skill inside it are both called `upwork-pulse`.

## What you get in Notion

A root page — you name it at setup, **Upwork Pulse** by default — with a collapsed config toggle, four pages and four databases:

```
▸ ⚙️ Config
Search rules · Proposal guide · Field notes · Run state
Jobs · Proposals · Runs · Questions
```

| | Holds | Written by |
|---|---|---|
| Search rules | your queries, what is in scope, what to reject, what to flag, how to set the verdict, hours and price, how to rank (criteria with points) | you; the agent adds a rule you confirm |
| Proposal guide | your voice, what never to say, portfolio lines and files, rate | you; the agent adds a rule you confirm |
| Field notes | what the Upwork API and tools do and do not do — nothing else | the agent, when it meets something new |
| Run state | two watermarks: `PROCESSED_UNTIL` for the hourly search, `PROPOSALS_SYNCED_UNTIL` for the proposals sync | the hourly run; the digests and "sync proposals" |
| Jobs | one card per Take / Maybe posting, every fact in its own column — the client's terms (payment, budget or rate range, duration, connects), competition (proposals, invites, interviewing, bid range), the client (country, verified, hires, spent, rating) — against your estimate (hours, price, complexity, flags) and a score by your ranking with the reasons; a five-section write-up; the advice (Apply / Skip, why); `Status` New → Applied / Skipped with when it was decided, every skip with who (manual / auto) and, when given, why | the hourly run and the drafts agent; the status by you, in chat or on the dashboard, Applied also by the proposals sync |
| Proposals | one row per job you write or send a proposal for: state (Writing / Ready / Sent), rate, connects, boost, sent on, the Upwork id, linked to the job; the text in fixed sections (Confirm before sending, Milestones, Cover letter, Screening questions, Attach, Portfolio highlights, Boost, How it was written). Once you apply, the draft is replaced by what Upwork stored (letter, rate, answers, files, boost), however you sent it — one final version per job | the drafts agent and chat; the proposals sync (digests twice a day, or "sync proposals") |
| Runs | one log row per run (per 2-hour chunk when catching up on a backlog): what was checked, what was rejected and why | the hourly run |
| Questions | cases your rules did not settle, with a counter of how often they came up | the hourly run; closed by the weekly review |

Views: Jobs — Inbox (New), Applied, All, Skipped; Proposals — Open, Sent; Runs — Latest; Questions — Open. The agent reads only through these views, which cost no Notion query quota.

**Language.** Everything the agent writes — messages, analyses, cards, questions, rule lines — is in the `language` from the config. The structure stays English: page and database titles, columns, card section headings, the dashboard. Proposals are written in the posting's language.

**Config.** The toggle holds the database IDs, view URLs, page IDs, `language`, `timezone`, `match_score` (the score from which a job counts as a strong match), your Upwork account, the dashboard link, the switches `auto_drafts` and `auto_skip`, the drafts task id and the `schema` version. The skill finds the root page by the toggle's title line — keep it — and reads the rest on every run, so the page can have any name and several pipelines can live side by side (each scheduled task names its root page). Move a database, edit the config.

## Install

Needs the **Notion** and **Upwork** connectors on the same surface. Model: see [Model](#model).

**Claude Code**

```
/plugin marketplace add sivakov512/agent-tools
/plugin install upwork-pulse@sivakov512
```

The claude.ai Notion and Upwork connectors are picked up if you are logged in with a claude.ai account; otherwise add Notion with `claude mcp add --transport http notion https://mcp.notion.com/mcp` and authenticate with `/mcp`.

**Cowork** — in the plugin settings add the marketplace `sivakov512/agent-tools` and install `upwork-pulse`. Enable the Notion and Upwork connectors. Scheduled tasks are Cowork's: this is the surface where the pipeline runs on its own.

**Chat (claude.ai and the desktop app)** — install the plugin from the same marketplace where your plan allows plugins; otherwise zip `upwork-pulse/skills/upwork-pulse/` (the zip must contain the `upwork-pulse/` folder with `SKILL.md`, `references/` and `assets/`), upload it in Settings → Skills and re-upload after updates. Enable the Notion and Upwork connectors. Chat is enough for setup, assessments and proposals; the scheduled part needs Cowork or another scheduler.

**Codex and other agents** — link the skill folder (`ln -s "$PWD/upwork-pulse/skills/upwork-pulse" ~/.codex/skills/upwork-pulse`) and connect Notion and Upwork MCP. For the scheduled modes, something has to start a session on a timer with the task prompt.

## First run

1. **"Set up Upwork Pulse."** The agent proposes a page **Upwork Pulse** at the top level and asks for your profile in one message: field and stack, rate, what to reject and flag, search queries, proposal voice, portfolio, language, timezone, when the digests and the weekly review should come, the model for scheduled runs. Instead of answering you can point it at your Upwork profile, a Notion page, a CV or an email — it takes your decisions from there (not someone else's formats) and shows what it found. Unknowns stay as `_to fill_`; nothing is invented.
2. **It builds everything**: the four pages, the four databases with views, the config, the dashboard (published as a claude.ai artifact), and on Cowork five scheduled tasks — hourly search, morning and evening digest, weekly review, and "Upwork drafts" with no schedule, which the dashboard starts. It then fires the hourly task once and checks that a run was logged; if not, it says why (plugin not installed for tasks, connector missing, approval pending). Elsewhere it hands you the table of schedules and prompts.
3. **Fill the placeholders** in Search rules and Proposal guide. Both are read on every run, so edits apply from the next one.
4. **"Run the hourly search now"** in chat — the first live check.

Running setup again is safe: every step checks first and adds only what is missing. Pages and databases from a hand-built pipeline are adopted — mapped, missing columns added, nothing renamed or deleted.

On Cowork: set the tasks to **Automatically approve** if a run asks for approval — they write to Notion unattended. The task prompts only name the mode, the root page and the window; how a run reports lives in the skill, so updating the plugin changes every task.

## How to use it

The scheduled tasks need nothing from you. A run pushes one line to your phone only when there is something to read; the full message is in the task's chat:

| Task | Sends |
|---|---|
| Hourly search | the run report with the new cards — only if one of them is a Take or has Apply advice |
| Digests (e.g. 11:00 and 22:00) | the New cards found since the previous digest, two lines each; nothing if none |
| Weekly review | open questions with a recommendation each; reply "1 yes, 2 no, 3 as recommended" and it writes the rules |

**Drafts.** With `auto_drafts` on, the hourly run hands its new cards to an Opus subagent (and any New card from the last day an earlier run left without advice). For each card it fetches the posting fresh and writes the advice — Apply or Skip, with the reason and when it was given. For Apply it builds a proposal preview (never submitted) and writes the proposal by your Proposal guide as a row in Proposals — rate and connects as columns, and in the body: what you must confirm first, milestones, the cover letter, screening answers (⚠️ where only you can answer), files to attach, highlights, boost advice, and how the text was put together — formatted the same in Notion and on the dashboard. With `auto_skip` on, a Skip advice from the hourly run also sets the card Skipped, marked `auto` with the reason. A card you ask about yourself — Write a proposal / Rewrite on the dashboard, "draft #584350" in chat — is never skipped for you: a Skip stays advice, the card stays New and you decide; a proposal it already had is kept, marked as older than the advice. Both switches are off after setup; flip them under Settings on the dashboard (Auto proposals, Auto skip). Without your voice, portfolio and rate in the Proposal guide, only the advice is written and the dashboard says what is missing.

Every job in a message has a number and a short id — `2. #584350 …` — the same id as on the dashboard. In chat:

| You say | What happens |
|---|---|
| "What about #584350?" / a link / "what about the second one?" after a digest | fetches fresh data from Upwork first, gives the link, then an assessment by your rules |
| "Details 2" / "details #584350" | the full card |
| "Draft #584350" / "redo the draft for #584350" | the advice and the proposal written to Proposals, as the drafts agent does |
| "Write a proposal for it" | one package: fresh numbers, the text, rate, screening drafts, boost advice, files — then waits |
| "Send it" | submits, writes what was sent to Proposals, sets the card Applied, reports the cost |
| "Skip it" / "already applied" / "put it back" | sets the card's status |
| "From now on skip anything with X" | writes the rule into Search rules as one line |
| "How many connects?" | balance and recent spend |
| "Sync proposals" / "sync proposals for the last 3 months" | puts what you sent on Upwork into Proposals now (the digests do it twice a day anyway); with a period it also pulls in older proposals, each with its job |
| "Update the pipeline" | after a plugin update that changes the structure (see [Pipeline updates](#pipeline-updates)) |

A number ("the second one") works only in the conversation that showed the list; elsewhere use the id. The agent never sends, boosts, messages or saves anything on Upwork without your explicit go for that action, and scheduled runs never write to Upwork — the drafts agent only builds proposal previews, which submit nothing.

If a message does not trigger the skill, mention Upwork or the job's id, or start it with `/upwork-pulse`.

### The dashboard

`skills/upwork-pulse/assets/dashboard.html` — one page that reads Notion and Upwork through the viewer's own connectors (no server, no stored tokens). Setup fills in your view URLs, account and timezone and publishes it; the link goes into the config.

- **Pills** in the header — replies, overdue, invitations — always there, red or green only when not zero.
- **Leads** with the client's numbers against your estimate, grouped by day; a green mark when the card's score reaches `match_score` from the config (read on every load, so a change applies at once). Tabs Take, Maybe and Skipped (the last two days, more on request, auto or manual and the reason if one was given, Restore). A lead with a proposal is marked "Proposal ready", one being written "Writing…", one whose writing task stopped "Not written"; "Only ready" filters every tab. The drawer shows the advice on top, the job, then the proposal, each value with a copy icon, and Facts with when the job was posted, found, advised, its proposal written and sent, and when you applied or skipped. Skip asks for a reason but does not need one; Rewrite starts the "Upwork drafts" task for that job. Every number is a column shown as stored.
- **Settings** in the header: the `auto_drafts` / `auto_skip` switches.
- **Your move** — everything that waits on you, each thing once: contracts that need a reply or have an overdue milestone, other chats where it is your turn, invitations and offers. Every chat and contract shows Claude's summary of the thread and the next step.
- **Contracts** that need nothing now, **Proposals** (Sent / In talks / Closed, live from Upwork — a proposal's drawer shows its job and what you sent, with Notion links), Connects spend and Balance.
- A row's **title opens it on Upwork**; the rest of the row opens a drawer with the details — the lead's notes with Skip / Applied, a contract's milestones and conversation, a proposal's chat — and ↑ / ↓ to walk the list. An ⓘ next to a section says how its list is built.

**Dashboard updates.** The page carries a version on its first line and the config remembers which version you published. When the skill ships a newer one, the next time you talk to the skill it says what is new and asks whether to update; yes republishes to the same link, no means that version is not offered again. With no dashboard in the config at all, it offers to publish one the same way.

### Pipeline updates

The config's `schema` is the structure the pipeline was built with. When a plugin update needs a newer one, the skill says so at the end of the next chat reply; until you say "update the pipeline", the scheduled runs pause (they write nothing; a digest sends one line asking for the update) and their watermarks stay put, so nothing is lost. The update works in place — same page, databases, cards, links and tasks: it tells you what will change, waits for your go, converts the cards, removes old columns only after checking their values moved, never removes a column you added, writes `schema` last, and can be run again if it stops halfway. Several versions behind, it takes them in order. Take a copy of the page in Notion first if you want a backup.

## Model

- **Sonnet** for everything scheduled — search, assessment, cards, digests, the weekly review — and for chat about jobs. Its weak spot: when a case matches an open question, it sometimes adds a second question row instead of bumping the counter; the weekly review still shows both.
- **Opus** for proposals and drafts — the hourly run starts the drafts subagent on Opus itself, and the "Upwork drafts" task is set to Opus. On Sonnet the text drifts from the guide: it retells the posting, adds experience the portfolio does not have, puts remarks before the package.

## Tests

`evals/` holds a `claude plugin eval` suite with mocked Notion and Upwork — see [evals/README.md](evals/README.md). From `upwork-pulse/`:

```
claude plugin eval . --tag routine  --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
claude plugin eval . --tag proposal --model opus   --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

The dashboard has no eval; after editing it, check that its script parses:

```
python3 -c "import re;s=open('skills/upwork-pulse/assets/dashboard.html').read();print(re.findall(r'<script>([\s\S]*?)</script>',s)[-1])" > /tmp/d.js && node --check /tmp/d.js
```

## Where things are

```
upwork-pulse/
├── README.md                     this file
├── .claude-plugin/plugin.json    Claude plugin packaging (name, version)
├── evals/                        claude plugin eval suite (mocked Notion + Upwork)
└── skills/upwork-pulse/
    ├── SKILL.md                  loaded on every use: data model, guards, finding things, questions, modes
    ├── references/               loaded only for the mode in use
    │   ├── setup.md              create / adopt / finish; dashboard; scheduled tasks; "update the pipeline"
    │   ├── hourly.md             queue, filter, cards, log, message
    │   ├── digest.md             sync, then the window's New cards, message, "details N"
    │   ├── weekly.md             questions → rules
    │   ├── chat.md               postings, skip / applied, proposals, connects
    │   ├── sync.md               sent proposals from Upwork into Proposals (digests, chat)
    │   └── drafts.md             advice and ready-to-paste proposals for new cards
    └── assets/dashboard.html     the dashboard template
```

To change behaviour, edit `SKILL.md` or the reference for that mode, push; release-please bumps `version` in `plugin.json`.

## Limits

- Notion is read through views and page fetches only (SQL and rows queries have a workspace quota); the skill filters rows itself.
- The dashboard runs only where a page can call the viewer's connectors (claude.ai artifacts).
- What the Upwork API can and cannot do is kept in Field notes, not in the skill — the API changes, the notes are edited in place.
- Cowork schedules in UTC; move the tasks by hand when daylight-saving changes.
- Scheduled runs work only where the plugin is installed for task sessions; setup's test fire is what proves it.
