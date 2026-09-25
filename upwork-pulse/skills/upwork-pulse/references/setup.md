# Setup — create, adopt, or finish the pipeline

One procedure for three cases: nothing exists yet; the user already has pages or databases from an earlier version (adopt them); a setup that stopped halfway. Every step checks first and adds only what is missing, so running it again is safe and never makes a second root page or a duplicate database.

## 1. Find or create the root page

First look for an existing pipeline: a page the user names or links, else `notion-search` for `read by the upwork-pulse skill` (the config marker).

- Found with a config (toggle or callout) → read the keys; go through steps 3–9 and fill only what is missing.
- The user points at pages and databases built by hand, without a config → **adopt**: fetch what is there, map it onto the model (a database with `Job ID` / `Verdict` / `Status` is Jobs; one with `Run` / `Scanned` is Runs; one with `Question` / `Seen` is Questions; pages named like search spec / rules, proposal guide, field notes, run state are the four pages). Add missing columns (`notion-update-data-source`, `ALTER`/`ADD COLUMN`) rather than recreating; never rename or drop what exists. The page that holds them is the root. Then continue with steps 6–9: config, dashboard, scheduled tasks, report — adopting is not finished without them.
- Nothing → a new root. Propose a name — `Upwork Pulse`, or `Upwork Pulse 2` if a page with that title already exists (`notion-search` by title) — at the top level of the workspace, and wait for the user's answer. When the profile questions of step 2 are needed too, put both in one message, the name first: "I'll create a page **Upwork Pulse** at the top level of your workspace — OK, or another name or place?" followed by the questions. The user may accept, give another name, or name a parent page instead of the top level. If the user already gave a name and place in the request, use them without asking. Create the page with that title, no icon (`notion-create-pages` without a parent puts it at the top level). The name is free; nothing later depends on it.

## 2. The user's profile

The rules pages are written from the user's profile. Gather it before writing anything, in one round of questions — or from the sources the user points at (their Upwork profile via `get_profile`, a Notion page, a CV, an email) with the answers shown for confirmation:

1. **Field and stack** — what kind of work, the tools and platforms they use, what they are learning and willing to take with extra hours.
2. **Rate** — hourly rate; the floor below which fixed prices are not offered; whether they prefer fixed or hourly.
3. **Reject outright** — kinds of work they will not do (tools they do not have, disciplines outside their field, obligations they refuse such as certification or on-site work).
4. **Flag but keep** — things to note in the card without rejecting (an unfamiliar technology, a mandatory daily call, a client with no hires).
5. **Search queries** — 2–4 keyword queries for `find_jobs`; propose them from the stack if the user has none.
6. **Proposal voice** — how they write (short? questions first?), what they never say, whether they mention tools, how they handle calls.
7. **Portfolio** — 3–6 projects: one line each as it should appear in a proposal, status (shipped, prototype), file names of the images they attach, anything that must not be shown (client names under NDA).
8. **Language and timezone** — the language the user wants to read everything in (`language`: messages, analyses, the text of the rules pages and cards) and the timezone. Titles, columns and section headings stay English; proposals follow the posting's language.
9. **Upwork org_uid** — from `list_accounts`.
10. **Model for the scheduled runs** — Sonnet unless the user says otherwise (only when tasks are created here).
11. **When the digests and the weekly review come** — two digest times and a weekly slot, to the minute; 11:00, 22:00 and Sunday 20:00 unless the user says otherwise.

Anything the user does not know yet is left as a marked placeholder (`_to fill_`) in the page, not invented.

When the profile comes from existing rules pages (a hand-built pipeline, an older version of this one), carry over the user's decisions only: queries, scope, what they reject and flag beyond the defaults, how they assess and price, their voice, portfolio and rate. Leave out what this skill already defines — search and filter mechanics, the two default rejects and the default flags, card fields and sections, statuses, message formats, the run log, the questions protocol, the proposal package and the send guard — and move facts about the API and tools to Field notes. A copied mechanic freezes an old version of it, and since the rules pages win on content, it would override the skill from then on.

When adopting or finishing an existing pipeline, most of this is already written down: take the language from the rules pages, the timezone from the watermark's offset, the org from `list_accounts` (when there is one account), the model as Sonnet — fill them, and name each inferred value in the final report so the user can correct it. Ask only for what cannot be inferred.

## 3. Pages

Create the missing ones as children of the root page (`notion-create-pages`, `parent: {page_id: <root>}`), — the text in `language`, the section headings exactly as below, in English. Fill them from the profile; keep the section structure below because the modes refer to it by name.

**Search rules** — sections: `## 1. Search` (the queries, one per code block; sort by recency; no platform filters), `## 2. Filtering` with `### In scope` (the kinds of deliverable the user takes — the hourly run treats anything on neither this list nor the reject lists as an open question), `### Reject on sight` (stage-1 items), `### Reject on full text` and `### Flag, do not reject`, `## 3. Assessment` (verdict Take vs Maybe, how hours are estimated, how price follows from hours and the rate, the floor, what counts as complexity Low / Medium / High, what the client's average spend tells), `## 4. Card conventions` (anything the user wants on cards beyond the skill's defaults — leave "defaults" if nothing), `## 5. Message formats` ("skill defaults" — a format from an older page is not carried over unless the user asks to keep it), `## 6. Ranking` — criteria with points; the hourly run sums the ones that hold into the card's `Score`, and a card at or above `match_score` is a strong match. Unless the user has their own, write this starting set (in `language`): the client has hires +2, or is verified without hires +1; client rating 4.8 or higher +1; client spent $5,000 or more +1; fewer than 5 proposals +2, 5–14 proposals +1, 25 or more −1; the client's rate range or budget covers My $ +1, falls below it −1 (a fixed budget under 70% of My $: −1); complexity Low +1, High −1; each flag −1, except budget mismatch, mandatory calls, timezone lock and partially hired −2. Only criteria that hold when the card is written belong here — the score is not recomputed later.

**Proposal guide** — `## 1. Before writing` (anything the user checks before a proposal, beyond the fresh data the skill always takes), `## 2. Text` (voice, structure, what never to say), `## 3. Portfolio` (the projects: line to quote, status, file names, restrictions; how to pick 2–4 per posting), `## 4. Rate and amounts`, `## 5. Attachments and highlights`, `## 6. After sending` (Status Applied; a confirmed rule goes into this guide or the rules).

**Field notes** — one intro line ("Environment quirks only — facts about the API and tools. Rules live in Search rules and Proposal guide; open questions in the Questions database.") and `## Quirks` with the facts known at the time of writing — they belong here, not in the skill, because the API changes: availability flags and counters in `find_jobs get` can lag the site; the API returns no attachments or photos of a posting; competitors' bids come without a unit (per hour or per project); `client.rating` is the freelancers' rating of the client; the proposal API takes no structured milestones (fixed price with milestones goes through the web form); attachments: open the upload only after the package is approved, a fresh upload per proposal, the upload context matching the proposal type; portfolio highlights are chosen before `create` and cannot be added after sending, invitations have none and cost zero connects.

**Run state** — body exactly `PROCESSED_UNTIL: <now in the timezone, e.g. 2026-09-20T14:00+02:00>`.

## 4. Databases

Create only the missing ones, titled exactly `Jobs`, `Runs`, `Questions`, `notion-create-database` with `parent: {page_id: <root>}`, Runs before Jobs (Jobs relates to it). The `CREATE TABLE` text is the schema these tools take, not a query.

```sql
-- Runs
CREATE TABLE ("Run" TITLE COMMENT 'DD.MM HH:MM, a label only',
  "Created" CREATED_TIME, "Status" SELECT('ok':green, 'empty':gray, 'partial':yellow),
  "Scanned" NUMBER, "Title pass" NUMBER, "Detailed" NUMBER, "Take" NUMBER, "Maybe" NUMBER,
  "Budget hit" CHECKBOX, "Tool calls" NUMBER, "Window" RICH_TEXT)

-- Jobs
CREATE TABLE ("Title" TITLE, "Job ID" RICH_TEXT COMMENT 'Numeric Upwork id; duplicate key', "Link" URL,
  "Published" DATE, "Found" DATE,
  "Verdict" SELECT('Take':green, 'Maybe':yellow),
  "Status" SELECT('New':blue, 'Applied':green, 'Skipped':gray),
  "Payment" SELECT('Fixed':default, 'Hourly':default),
  "Client $" RICH_TEXT COMMENT 'As stated by the client', "Budget" NUMBER, "Rate min" NUMBER, "Rate max" NUMBER,
  "My $" NUMBER, "My hours" NUMBER, "Client time" RICH_TEXT,
  "Complexity" SELECT('Low':green, 'Medium':yellow, 'High':red),
  "Flags" MULTI_SELECT('no client history':gray, 'unfamiliar tech':gray, 'budget mismatch':gray, 'mandatory calls':gray, 'timezone lock':gray, 'partially hired':gray, 'full-time':gray),
  "Client" RICH_TEXT, "Proposals" NUMBER, "Connects" NUMBER COMMENT 'Cost to apply', "Competition" RICH_TEXT,
  "Score" NUMBER COMMENT 'Sum of the Ranking points', "Score why" RICH_TEXT,
  "Run" RELATION('<runs>'))

-- Questions
CREATE TABLE ("Question" TITLE, "Job IDs" RICH_TEXT, "Seen" NUMBER,
  "Status" SELECT('Open':orange, 'Resolved':green), "First seen" DATE, "Decision" RICH_TEXT)
```

Add the user's own flags from the profile to `Flags` (`ALTER COLUMN "Flags" SET MULTI_SELECT(...)`), keeping the defaults.

## 5. Views

Views live on the databases (fetch each database for its default view; rename it and add the rest with `notion-create-view` / `notion-update-view`). Filters list the statuses to show, so a status added later never leaks in.

```
Jobs       Inbox     (default)  FILTER "Status" = "New";   SORT BY "Found" DESC; SHOW "Title", "Verdict", "Client $", "My $", "My hours", "Complexity", "Connects", "Found"
           Applied   table      FILTER "Status" = "Applied"; SORT BY "Found" DESC
           All       table      SORT BY "Found" DESC
Runs       Latest    (default)  SORT BY "Created" DESC; SHOW "Run", "Status", "Scanned", "Detailed", "Take", "Maybe", "Window"
Questions  Open      (default)  FILTER "Status" = "Open"; SORT BY "First seen" ASC
```

A view URL is `https://www.notion.so/<database id without dashes>?v=<view id without dashes>`.

Runs are ordered by `Created`, never by the `Run` title: `DD.MM HH:MM` as text puts `01.10` below `30.09` and January below December. An adopted Runs database without `Created` gets the column, and its view's sort is switched to it.

## 6. Config

At the start of the root page (`insert_content`, `position: {"type": "start"}`), unless it is there — if it exists but lacks keys, `update_content` to add them. The config is a toggle, so it stays collapsed and does not fill the page; an older pipeline's callout is left as a callout and gets the missing keys.

```
<details color="gray_bg">
<summary>⚙️ **Config** — read by the `upwork-pulse` skill; edit if something moves</summary>
	language: `<the user's language, e.g. English>`
	timezone: `<IANA zone, e.g. Europe/Belgrade>`
	jobs: `<jobs data source id — the bare UUID, without collection://>`
	runs: `<runs data source id>`
	questions: `<questions data source id>`
	jobs_inbox: `<view url>`
	jobs_applied: `<view url>`
	jobs_all: `<view url>`
	runs_latest: `<view url>`
	questions_open: `<view url>`
	rules: `<page id>`
	guide: `<page id>`
	notes: `<page id>`
	state: `<page id>`
	match_score: `4`
	upwork_org: `<org_uid>`
	dashboard: `<url, once published>`
</details>
```

Lines inside the toggle are indented with a tab (unindented lines fall outside it); block tags are sent as the raw characters `<details color="gray_bg">`, `<summary>` — never HTML-escaped as `&lt;details&gt;`, which Notion stores as visible text. After the write, fetch the page and check the toggle is first, holds every key, and rendered as a toggle (not as `&lt;details` text).

## 7. Dashboard

The dashboard is a single HTML page (`assets/dashboard.html`) that reads Notion and Upwork with the viewer's own connectors: leads from `Inbox` with a comparison of the client's numbers against the user's estimate, Skip / Applied buttons, active contracts with thread summaries, proposals, connects spend, open questions. It has no server side: it runs only where a page can call the user's connectors — on claude.ai it is published as an artifact with the `mcp` capability (Notion: `notion-query-data-sources`, `notion-fetch`, `notion-update-page`; Upwork: dashboard, financials, messages, proposals, milestones) and `sample` for the summaries.

To publish or update it:

1. Copy `assets/dashboard.html` to a working file and replace every placeholder: `__ROOT_PAGE__` (the root page id — the page reads `match_score` from the config there on every load), `__UPWORK_ORG__`, `__VIEW_INBOX__`, `__VIEW_APPLIED__`, `__VIEW_RUNS__`, `__VIEW_QUESTIONS__` (the view URLs from the config), `__QUESTIONS_URL__` (the Questions database page URL), `__TIMEZONE__`. Nothing else in the file needs editing. Where a shell with Node is available, check the page's script still parses before publishing (`node --check` on the contents of the last `<script>` block) — a page whose script fails shows "Connecting…" forever and no error.
2. Publish it with the artifact tool of the surface (on claude.ai / Cowork: the Artifact tool with the capabilities above; load the artifact-capabilities skill first if the surface has it). Republishing to the same URL keeps the link.
3. Write the URL into the config as `dashboard`.

If the surface has no artifact tool, still do step 1: write the filled file into the working directory (`upwork-dashboard.html`), tell the user where it is and that a claude.ai artifact with the `mcp` capability (or any page that can call their Notion and Upwork connectors) can host it. The dashboard is part of setup; do not leave it for the user to request.

## 8. Scheduled tasks

Four tasks, each a fresh session, each with the Notion and Upwork connectors. The prompts are short because the skill carries the logic; each names the mode, says plainly that the final reply is the notification (the one rule a run must not forget, so it lives in the prompt too), the root page URL (so a run never has to choose between two pipelines) and the parameters the mode needs. `<root>` below is the root page URL — put the real URL into every row, never leave `<root>` in a prompt. Times are in the user's timezone; when the surface schedules in UTC, convert with the offset in effect and tell the user to move the crons when daylight-saving changes.

| Task | When | Prompt |
|---|---|---|
| Upwork search — hourly | every hour | `Use the upwork-pulse skill in hourly search mode on <root>. This is a scheduled run: automatic mode until I write — your final reply goes to my phone as is, so it is the message or nothing.` |
| Upwork digest — morning | e.g. 11:00 | `Use the upwork-pulse skill in digest mode on <root>, window from <evening hour> yesterday to now. This is a scheduled run: automatic mode until I write — your final reply goes to my phone as is, so it is the message or nothing.` |
| Upwork digest — evening | e.g. 22:00 | `Use the upwork-pulse skill in digest mode on <root>, window from <morning hour> today to now. This is a scheduled run: automatic mode until I write — your final reply goes to my phone as is, so it is the message or nothing.` |
| Upwork questions — weekly | e.g. Sunday 20:00 | `Use the upwork-pulse skill in weekly review mode on <root>. This is a scheduled run: automatic mode until I answer — your final reply goes to my phone as is, so it is the message or nothing.` |

Each digest's window starts at the other digest's time, so the two cover the day without gaps; put the user's times into both prompts. Schedule the digests and the weekly review at exactly the minute the user gave — no shifting of the minute to spread load, even where the scheduling tool suggests it: a digest that runs at 10:48 while the next one's window starts at 11:00 loses whatever was found in between. Only the hourly search may run at any minute.

Where the surface has a task-creation tool (Cowork: `create_trigger`), create the four tasks yourself — this is the user's request, so `initiation` is `human_request`; cron in UTC per the tool's rules. The tool takes no model and no approval mode, so two things follow it:
- **Model**: the runs are written for Sonnet. Ask which model once, in the setup questions (default Sonnet), and set it with `update_trigger` `model` — that is the user's explicit choice, which the tool requires.
- **Notifications**: leave the task's notification setting at its default — push only when a run finishes with something worth reporting. That platform filter is what keeps a stray line from a silent run off the phone; a reply that is the run message gets through.
- **Approval**: the runs write to Notion unattended. If a created task reports that its runs will ask for approval, tell the user to switch it to "Automatically approve" in its settings.

The task sessions must have this plugin and the Notion and Upwork connectors. A task cannot check that from inside, so step 9 fires the hourly task once and looks for its Runs row.

Where there is no task-creation tool, the table, filled with the user's hours and the root URL, goes into your final reply so the user can create the tasks by hand. Either way the tasks are part of setup, not an extra the user has to ask for — do not ask whether to set them up; create them, or hand over the table: without them the pipeline is a set of empty databases.

## 9. Verify and tell the user

Fetch the root page: the config toggle first with every key filled (except `dashboard` if not yet published), then the four pages and three databases. Fetch each database: columns and views as above.

If you created the tasks: fire the hourly one once (`fire_trigger`), wait a few minutes, and query `runs_latest`. A new row means the task session has the skill, the connectors and write access. No row → the task's last run tells why (the plugin not installed on that surface, a connector missing, approval pending); say so to the user plainly — the pipeline does not run until it is fixed.

Reply in `language` with: what was created, adopted or already in place; the placeholders left in the rules pages for the user to fill; **the tasks** — created, or the table with schedule and prompt to create by hand; **the dashboard** — its URL, or where the filled file is and what can host it. Add one line on models: the scheduled tasks run on Sonnet; proposals are best written in a chat on Opus. End with the first live check: "run the hourly search now" in this chat.
