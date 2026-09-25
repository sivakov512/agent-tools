# upwork-pipeline

Runs a freelancer's Upwork job search with Notion as the source of truth. Scheduled agents search the feed every hour, assess each posting against your own rules, write the promising ones into Notion and message you only when something is worth applying to fast; two digests a day recap the rest; a weekly review turns the cases your rules did not cover into new rules. In chat the same skill discusses a posting on fresh data, drafts a proposal in your voice and submits it only on your explicit go. A live dashboard shows leads, proposals, contracts and connects.

The plugin and the skill inside it are both called `upwork-pipeline`.

## What you get in Notion

A root page — you name it at setup, **Upwork pipeline** by default — with a collapsed config toggle, four pages and three databases:

```
▸ ⚙️ Config
Search rules · Proposal guide · Field notes · Run state
Jobs · Runs · Questions
```

| | Holds | Written by |
|---|---|---|
| Search rules | your queries, what is in scope, what to reject, what to flag, how to set the verdict, hours and price, how to rank (criteria with points) | you; the agent adds a rule you confirm |
| Proposal guide | your voice, what never to say, portfolio lines and files, rate | you; the agent adds a rule you confirm |
| Field notes | what the Upwork API and tools do and do not do — nothing else | the agent, when it meets something new |
| Run state | `PROCESSED_UNTIL`, the hourly search's watermark | the hourly run |
| Jobs | one card per Take / Maybe posting: the client's numbers against your estimate, flags, a score by your ranking with the reasons, a five-section write-up; `Status` New → Applied / Skipped | the hourly run; the status by you, in chat or on the dashboard |
| Runs | one log row per run (per 2-hour chunk when catching up on a backlog): what was checked, what was rejected and why | the hourly run |
| Questions | cases your rules did not settle, with a counter of how often they came up | the hourly run; closed by the weekly review |

Views: Jobs — Inbox (New), Applied, All; Runs — Latest; Questions — Open. The agent reads only through these views, which cost no Notion query quota.

**Language.** Everything the agent writes — messages, analyses, cards, questions, rule lines — is in the `language` from the config. The structure stays English: page and database titles, columns, card section headings, the dashboard. Proposals are written in the posting's language.

**Config.** The toggle holds the database IDs, view URLs, page IDs, `language`, `timezone`, `match_score` (the score from which a job counts as a strong match), your Upwork account and the dashboard link. The skill finds the root page by the toggle's title line — keep it — and reads the rest on every run, so the page can have any name and several pipelines can live side by side (each scheduled task names its root page). Move a database, edit the config.

## Install

Needs the **Notion** and **Upwork** connectors on the same surface. Model: see [Model](#model).

**Claude Code**

```
/plugin marketplace add sivakov512/agent-tools
/plugin install upwork-pipeline@sivakov512
```

The claude.ai Notion and Upwork connectors are picked up if you are logged in with a claude.ai account; otherwise add Notion with `claude mcp add --transport http notion https://mcp.notion.com/mcp` and authenticate with `/mcp`.

**Cowork** — in the plugin settings add the marketplace `sivakov512/agent-tools` and install `upwork-pipeline`. Enable the Notion and Upwork connectors. Scheduled tasks are Cowork's: this is the surface where the pipeline runs on its own.

**Chat (claude.ai and the desktop app)** — install the plugin from the same marketplace where your plan allows plugins; otherwise zip `upwork-pipeline/skills/upwork-pipeline/` (the zip must contain the `upwork-pipeline/` folder with `SKILL.md`, `references/` and `assets/`), upload it in Settings → Skills and re-upload after updates. Enable the Notion and Upwork connectors. Chat is enough for setup, assessments and proposals; the scheduled part needs Cowork or another scheduler.

**Codex and other agents** — link the skill folder (`ln -s "$PWD/upwork-pipeline/skills/upwork-pipeline" ~/.codex/skills/upwork-pipeline`) and connect Notion and Upwork MCP. For the scheduled modes, something has to start a session on a timer with the task prompt.

## First run

1. **"Set up the Upwork pipeline."** The agent proposes a page **Upwork pipeline** at the top level and asks for your profile in one message: field and stack, rate, what to reject and flag, search queries, proposal voice, portfolio, language, timezone, when the digests and the weekly review should come, the model for scheduled runs. Instead of answering you can point it at your Upwork profile, a Notion page, a CV or an email — it takes your decisions from there (not someone else's formats) and shows what it found. Unknowns stay as `_to fill_`; nothing is invented.
2. **It builds everything**: the four pages, the three databases with views, the config, the dashboard (published as a claude.ai artifact), and on Cowork the four scheduled tasks — hourly search, morning and evening digest, weekly review. It then fires the hourly task once and checks that a run was logged; if not, it says why (plugin not installed for tasks, connector missing, approval pending). Elsewhere it hands you the table of schedules and prompts.
3. **Fill the placeholders** in Search rules and Proposal guide. Both are read on every run, so edits apply from the next one.
4. **"Run the hourly search now"** in chat — the first live check.

Running setup again is safe: every step checks first and adds only what is missing. Pages and databases from a hand-built pipeline are adopted — mapped, missing columns added, nothing renamed or deleted.

On Cowork: leave the tasks' notifications at their default (a push only when a run has something worth reporting) and set them to **Automatically approve** if a run asks for approval — they write to Notion unattended.

## How to use it

The scheduled tasks need nothing from you. A message arrives only when there is something to read:

| Task | Sends |
|---|---|
| Hourly search | the run report with the new cards — only if at least one Take was found |
| Digests (e.g. 11:00 and 22:00) | the New cards found since the previous digest, two lines each; nothing if none |
| Weekly review | open questions with a recommendation each; reply "1 yes, 2 no, 3 as recommended" and it writes the rules |

Every job in a message has a number and a short id — `2. #584350 …` — the same id as on the dashboard. In chat:

| You say | What happens |
|---|---|
| "What about #584350?" / a link / "what about the second one?" after a digest | fetches fresh data from Upwork first, gives the link, then an assessment by your rules |
| "Details 2" / "details #584350" | the full card |
| "Write a proposal for it" | one package: fresh numbers, the text, rate, screening drafts, boost advice, files — then waits |
| "Send it" | submits, sets the card Applied, reports the cost |
| "Skip it" / "already applied" / "put it back" | sets the card's status |
| "From now on skip anything with X" | writes the rule into Search rules as one line |
| "How many connects?" | balance and recent spend |

A number ("the second one") works only in the conversation that showed the list; elsewhere use the id. The agent never sends, boosts, messages or saves anything on Upwork without your explicit go for that action, and scheduled runs never write to Upwork at all.

If a message does not trigger the skill, mention Upwork or the job's id, or start it with `/upwork-pipeline`.

### The dashboard

`skills/upwork-pipeline/assets/dashboard.html` — one page that reads Notion and Upwork through the viewer's own connectors (no server, no stored tokens). Setup fills in your view URLs, account and timezone and publishes it; the link goes into the config. Leads with the client's numbers against your estimate — highlighted green when the card's score reaches `match_score` from the config (the page reads it on every load, so a change applies at once) — Skip / Applied buttons, active contracts with thread summaries, proposals by state, connects spend, open questions.

## Model

- **Sonnet** for everything scheduled — search, assessment, cards, digests, the weekly review — and for chat about jobs. Its weak spot: when a case matches an open question, it sometimes adds a second question row instead of bumping the counter; the weekly review still shows both.
- **Opus** for proposals. On Sonnet the text drifts from the guide: it retells the posting, adds experience the portfolio does not have, puts remarks before the package.

## Tests

`evals/` holds a `claude plugin eval` suite with mocked Notion and Upwork — see [evals/README.md](evals/README.md). From `upwork-pipeline/`:

```
claude plugin eval . --tag routine  --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
claude plugin eval . --tag proposal --model opus   --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

The dashboard has no eval; after editing it, check that its script parses:

```
python3 -c "import re;s=open('skills/upwork-pipeline/assets/dashboard.html').read();print(re.findall(r'<script>([\s\S]*?)</script>',s)[-1])" > /tmp/d.js && node --check /tmp/d.js
```

## Where things are

```
upwork-pipeline/
├── README.md                     this file
├── .claude-plugin/plugin.json    Claude plugin packaging (name, version)
├── evals/                        claude plugin eval suite (mocked Notion + Upwork)
└── skills/upwork-pipeline/
    ├── SKILL.md                  loaded on every use: data model, guards, finding things, questions, modes
    ├── references/               loaded only for the mode in use
    │   ├── setup.md              create / adopt / finish; dashboard; scheduled tasks
    │   ├── hourly.md             queue, filter, cards, log, message
    │   ├── digest.md             window, New only, message, "details N"
    │   ├── weekly.md             questions → rules
    │   └── chat.md               postings, skip / applied, proposals, connects
    └── assets/dashboard.html     the dashboard template
```

To change behaviour, edit `SKILL.md` or the reference for that mode, bump `version` in `plugin.json`, push.

## Limits

- Notion is read through views and page fetches only (SQL and rows queries have a workspace quota); the skill filters rows itself.
- The dashboard runs only where a page can call the viewer's connectors (claude.ai artifacts).
- What the Upwork API can and cannot do is kept in Field notes, not in the skill — the API changes, the notes are edited in place.
- Cowork schedules in UTC; move the tasks by hand when daylight-saving changes.
- Scheduled runs work only where the plugin is installed for task sessions; setup's test fire is what proves it.
