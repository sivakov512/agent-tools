# Setup — create, adopt, or finish the pipeline

One procedure for three cases: nothing exists yet; the user already has pages or databases from an earlier version (adopt them); a setup that stopped halfway. Every step checks first and adds only what is missing, so running it again is safe and never makes a second root page or a duplicate database.

## 1. Find or create the root page

First look for an existing pipeline: a page the user names or links, else `notion-search` for `read by the upwork-pulse skill` (the config marker).

- Found with a config (toggle or callout) → read the keys; go through steps 3–9 and fill only what is missing.
- The user points at pages and databases built by hand, without a config → **adopt**: fetch what is there, map it onto the model (a database with `Job ID` / `Verdict` / `Status` is Jobs; one with `Proposal ID` / `State` is Proposals; one with `Run` / `Scanned` is Runs; one with `Question` / `Seen` is Questions; pages named like search spec / rules, proposal guide, field notes, run state are the four pages). Add missing columns (`notion-update-data-source`, `ALTER`/`ADD COLUMN`) rather than recreating; never rename or drop what exists. The page that holds them is the root. Then continue with steps 6–9: config, dashboard, scheduled tasks, report — adopting is not finished without them.
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
10. **Models for the scheduled runs** — Sonnet for search, digests and the weekly review, Opus for the drafts task, unless the user says otherwise (only when tasks are created here).
11. **When the digests and the weekly review come** — two digest times and a weekly slot, to the minute; 11:00, 22:00 and Sunday 20:00 unless the user says otherwise.
12. **Drafts** — whether Opus should write advice and a ready proposal for each new card (`auto_drafts`), and whether the hourly run should skip every card Claude advises to skip, except locked ones (`auto_skip`). Both off unless the user says so; the dashboard has a switch for each.

Anything the user does not know yet is left as a marked placeholder (`_to fill_`) in the page, not invented.

When the profile comes from existing rules pages (a hand-built pipeline, an older version of this one), carry over the user's decisions only: queries, scope, what they reject and flag beyond the defaults, how they assess and price, their voice, portfolio and rate. Leave out what this skill already defines — search and filter mechanics, the two default rejects and the default flags, card fields and sections, statuses, message formats, the run log, the questions protocol, the proposal package and the send guard — and move facts about the API and tools to Field notes. A copied mechanic freezes an old version of it, and since the rules pages win on content, it would override the skill from then on.

When adopting or finishing an existing pipeline, most of this is already written down: take the language from the rules pages, the timezone from the watermark's offset, the org from `list_accounts` (when there is one account), the model as Sonnet — fill them, and name each inferred value in the final report so the user can correct it. Ask only for what cannot be inferred.

## 3. Pages

Create the missing ones as children of the root page (`notion-create-pages`, `parent: {page_id: <root>}`), — the text in `language`, the section headings exactly as below, in English. Fill them from the profile; keep the section structure below because the modes refer to it by name.

**Search rules** — sections: `## 1. Search` (the queries, one per code block; sort by recency; no platform filters), `## 2. Filtering` with `### In scope` (the kinds of deliverable the user takes — the hourly run treats anything on neither this list nor the reject lists as an open question), `### Reject on sight` (stage-1 items), `### Reject on full text` and `### Flag, do not reject`, `## 3. Assessment` (verdict Take vs Maybe, how hours are estimated, how price follows from hours and the rate, the floor, what counts as complexity Low / Medium / High, what the client's average spend tells), `## 4. Card conventions` (anything the user wants on cards beyond the skill's defaults — leave "defaults" if nothing), `## 5. Message formats` ("skill defaults" — a format from an older page is not carried over unless the user asks to keep it), `## 6. Ranking` — criteria with points; the hourly run sums the ones that hold into the card's `Score`, and a card at or above `match_score` is a strong match. Unless the user has their own, write this starting set (in `language`): the client has hires +2, or is verified without hires +1; client rating 4.8 or higher +1; client spent $5,000 or more +1; fewer than 5 proposals +2, 5–14 proposals +1, 25 or more −1; the client's rate range or budget covers My $ +1, falls below it −1 (a fixed budget under 70% of My $: −1); complexity Low +1, High −1; each flag −1, except budget mismatch, mandatory calls, timezone lock and partially hired −2. Only criteria that hold when the card is written belong here — the score is not recomputed later.

**Proposal guide** — `## 1. Before writing` (anything the user checks before a proposal, beyond the fresh data the skill always takes), `## 2. Text` (voice, structure, what never to say), `## 3. Portfolio` (the projects: line to quote, status, file names, restrictions; how to pick 2–4 per posting), `## 4. Rate and amounts`, `## 5. Attachments and highlights`, `## 6. After sending` (Status Applied; a confirmed rule goes into this guide or the rules).

**Field notes** — one intro line ("Environment quirks only — facts about the API and tools. Rules live in Search rules and Proposal guide; open questions in the Questions database.") and `## Quirks` with the facts known at the time of writing — they belong here, not in the skill, because the API changes: availability flags and counters in `find_jobs get` can lag the site; the API returns no attachments or photos of a posting; competitors' bids come without a unit (per hour or per project); `client.rating` is the freelancers' rating of the client; the proposal API takes no structured milestones (fixed price with milestones goes through the web form); attachments: open the upload only after the package is approved, a fresh upload per proposal, the upload context matching the proposal type; portfolio highlights are chosen before `create` and cannot be added after sending, invitations have none and cost zero connects.

**Run state** — body exactly two lines, both set to now in the timezone: `PROCESSED_UNTIL: 2026-09-20T14:00+02:00` and `PROPOSALS_SYNCED_UNTIL: 2026-09-20T14:00+02:00`.

## 4. Databases

Create only the missing ones, titled exactly `Jobs`, `Proposals`, `Runs`, `Questions`, `notion-create-database` with `parent: {page_id: <root>}`, in this order: Runs, Jobs (relates to Runs), Proposals (relates to Jobs, both ways), Questions. The `CREATE TABLE` text is the schema these tools take, not a query. Every fact is its own column; money is a plain number in dollars.

```sql
-- Runs
CREATE TABLE ("Run" TITLE COMMENT 'DD.MM HH:MM, a label only',
  "Created" CREATED_TIME, "Status" SELECT('ok':green, 'empty':gray, 'partial':yellow),
  "Scanned" NUMBER, "Title pass" NUMBER, "Detailed" NUMBER, "Take" NUMBER, "Maybe" NUMBER,
  "Budget hit" CHECKBOX, "Tool calls" NUMBER, "Window" RICH_TEXT)

-- Jobs
CREATE TABLE ("Title" TITLE, "Job ID" RICH_TEXT COMMENT 'Numeric Upwork id; the duplicate key', "Link" URL,
  "Published" DATE, "Found" DATE, "Run" RELATION('<runs>'),
  "Payment" SELECT('Fixed':default, 'Hourly':default),
  "Budget" NUMBER FORMAT 'dollar' COMMENT 'Fixed price', "Rate min" NUMBER FORMAT 'dollar' COMMENT 'Hourly', "Rate max" NUMBER FORMAT 'dollar' COMMENT 'Hourly',
  "Duration" SELECT('Less than 1 week':gray, 'Less than 1 month':gray, '1 to 3 months':gray, '3 to 6 months':gray, 'More than 6 months':gray),
  "Connects" NUMBER COMMENT 'Cost to apply',
  "Proposals" NUMBER, "Invites" NUMBER, "Interviewing" NUMBER,
  "Bid low" NUMBER FORMAT 'dollar', "Bid high" NUMBER FORMAT 'dollar',
  "Country" RICH_TEXT, "Verified" CHECKBOX, "Hires" NUMBER, "Spent" NUMBER FORMAT 'dollar', "Rating" NUMBER,
  "Verdict" SELECT('Take':green, 'Maybe':yellow),
  "Score" NUMBER COMMENT 'Sum of the Ranking points', "Score why" RICH_TEXT,
  "Complexity" SELECT('Low':green, 'Medium':yellow, 'High':red),
  "My hours" NUMBER, "My $" NUMBER FORMAT 'dollar' COMMENT 'Hourly: the rate; fixed: the total',
  "Flags" MULTI_SELECT('no client history':gray, 'unfamiliar tech':gray, 'budget mismatch':gray, 'mandatory calls':gray, 'timezone lock':gray, 'partially hired':gray, 'full-time':gray, 'invited':blue),
  "Advice" SELECT('Apply':green, 'Skip':gray), "Advice why" RICH_TEXT, "Advised on" DATE COMMENT 'When Advice was last written',
  "Status" SELECT('New':blue, 'Applied':green, 'Skipped':gray),
  "Decided on" DATE COMMENT 'When Status last became Applied or Skipped',
  "Skipped by" SELECT('manual':default, 'auto':purple), "Skip reason" RICH_TEXT,
  "Locked" CHECKBOX COMMENT 'Auto skip leaves this card; the user decides',
  "Chat" URL COMMENT 'Cowork chat with Claude for this job')

-- Proposals (adds "Proposal" to Jobs as the other side of the relation); the text only — price, time and dates are the card's
CREATE TABLE ("Title" TITLE COMMENT 'The job title', "Job" RELATION('<jobs>', DUAL 'Proposal'),
  "Job ID" RICH_TEXT COMMENT 'Numeric Upwork job id; the key',
  "State" SELECT('Writing':yellow, 'Ready':green) COMMENT 'While a draft is written; empty once sent',
  "Written" DATE COMMENT 'When this text was written; for a sent one, when it was sent',
  "Proposal ID" RICH_TEXT COMMENT 'Upwork proposal id; set once sent',
  "Boost" NUMBER COMMENT 'Connects bid on top, as sent')

-- Questions
CREATE TABLE ("Question" TITLE, "Job IDs" RICH_TEXT, "Seen" NUMBER,
  "Status" SELECT('Open':orange, 'Resolved':green), "First seen" DATE, "Decision" RICH_TEXT)
```

Add the user's own flags from the profile to `Flags` (`ALTER COLUMN "Flags" SET MULTI_SELECT(...)`), keeping the defaults.

## 5. Views

Views live on the databases (fetch each database for its default view; rename it and add the rest with `notion-create-view` / `notion-update-view`). Filters list the statuses to show, so a status added later never leaks in.

```
Jobs       Inbox     (default)  FILTER "Status" = "New";   SORT BY "Found" DESC; SHOW "Title", "Verdict", "Score", "Advice", "Locked", "Payment", "Budget", "Rate max", "My $", "My hours", "Complexity", "Proposals", "Connects", "Found"
           Applied   table      FILTER "Status" = "Applied"; SORT BY "Decided on" DESC; SHOW "Title", "Verdict", "My $", "Proposal", "Decided on"
           Skipped   table      FILTER "Status" = "Skipped"; SORT BY "Decided on" DESC; SHOW "Title", "Verdict", "Skipped by", "Skip reason", "Decided on"
           All       table      SORT BY "Found" DESC
Proposals  Open      (default)  FILTER "Proposal ID" IS EMPTY; SORT BY "Written" DESC; SHOW "Title", "State", "Job", "Written"
           Sent      table      FILTER "Proposal ID" IS NOT EMPTY; SORT BY "Written" DESC; SHOW "Title", "Job", "Boost", "Written"
Runs       Latest    (default)  SORT BY "Created" DESC; SHOW "Run", "Status", "Scanned", "Detailed", "Take", "Maybe", "Window"
Questions  Open      (default)  FILTER "Status" = "Open"; SORT BY "First seen" ASC
```

A view URL is `https://www.notion.so/<database id without dashes>?v=<view id without dashes>`.

Runs are ordered by `Created`, never by the `Run` title: `DD.MM HH:MM` as text puts `01.10` below `30.09` and January below December. An adopted Runs database without `Created` gets the column, and its view's sort is switched to it.

## 6. Config

At the start of the root page (`insert_content`, `position: {"type": "start"}`), unless it is there, with every line below that has a value now — the `chat_project` line included — if it exists but lacks keys, `update_content` to add them. The config is a toggle, so it stays collapsed and does not fill the page; an older pipeline's callout is left as a callout and gets the missing keys.

```
<details color="gray_bg">
<summary>⚙️ **Config** — read by the `upwork-pulse` skill; edit if something moves</summary>
	language: `<the user's language, e.g. English>`
	timezone: `<IANA zone, e.g. Europe/Belgrade>`
	jobs: `<jobs data source id — the bare UUID, without collection://>`
	proposals: `<proposals data source id>`
	runs: `<runs data source id>`
	questions: `<questions data source id>`
	jobs_inbox: `<view url>`
	jobs_applied: `<view url>`
	jobs_skipped: `<view url>`
	jobs_all: `<view url>`
	proposals_open: `<view url>`
	proposals_sent: `<view url>`
	runs_latest: `<view url>`
	questions_open: `<view url>`
	rules: `<page id>`
	guide: `<page id>`
	notes: `<page id>`
	state: `<page id>`
	match_score: `4`
	upwork_org: `<org_uid>`
	dashboard: `<url, once published>`
	dashboard_version: `<N from the asset's first line, once published>`
	skill_version: `<N from the asset's first line>`
	chat_project: `none`
	auto_drafts: `off`
	auto_skip: `off`
	drafts_task: `<trigger id of the Upwork drafts task>`
	schema: `6`
</details>
```

`dashboard`, `dashboard_version` and `drafts_task` wait until there is something to put in them; every other line is written now. `chat_project` stays `none` unless this conversation is in a claude.ai project: then `<project id> <name>` of that project (SKILL.md → Chat project; in a project whose id is not visible, the line is left out). Lines inside the toggle are indented with a tab (unindented lines fall outside it); block tags are sent as the raw characters `<details color="gray_bg">`, `<summary>` — never HTML-escaped as `&lt;details&gt;`, which Notion stores as visible text. After the write, fetch the page and check the toggle is first, holds every key, and rendered as a toggle (not as `&lt;details` text).

## 7. Dashboard

The dashboard is a single HTML page (`assets/dashboard.html`) that reads Notion and Upwork with the viewer's own connectors. It has no server side: it runs only where a page can call the user's connectors — on claude.ai it is published as an artifact with the `mcp` capability (Notion: `notion-query-data-sources`, `notion-fetch`, `notion-update-page`, `notion-create-pages` — the Write a proposal button records the request as a Proposals row; Upwork: `upwork__get_freelancer_dashboard`, `upwork__get_freelancer_financials`, `upwork__get_messages`, `upwork__list_freelancer_proposals`, `upwork__list_milestones`, `upwork__list_contracts` — a contract's job id, so the contract opens its job's chat; Claude Code Remote: `fire_trigger`, for the Rewrite button that starts the drafts task) and `sample` for the thread summaries.

What is on it, 1180px wide, one screen on a laptop:

- **Header**: name, three pills — `replies` · `overdue` · `invitations` — always shown, coloured only when not zero, a click scrolls to Your move; `Live · updated hh:mm`, Refresh, **Settings** (a popover with the `auto_drafts` / `auto_skip` switches, written to the config, and the `chat_project` the job chats open in, shown read-only — it is changed in chat).
- **Leads** (left): `New` cards from `Inbox` minus jobs already applied to, Take / Maybe / Skipped tabs (Skipped: the last 2 days, more on request, Auto / Manual on the right), an "Only ready" switch, a "Proposal ready" / "Writing…" mark on the right of a row from the job's row in Proposals `Open`, grouped by day, posting time on the right, the client's numbers against the user's estimate in a Client / Me grid, flags on each side; a green mark for a score at or above `match_score`. Every value is a column shown as stored — the page never parses text.
- **Connects** and **Balance** tiles (right, top).
- **Your move**: everything that waits on the user, each thing once — contracts that need a reply or have an overdue milestone (a short row: what it needs — the overdue milestone named — and the summary; the card itself stays under Contracts), other chats where the next message is the user's, invitations and offers. Each chat and contract carries Claude's summary of the thread and the next step (`Your move: …`), made with `sample` from the last 12 messages and redone when a new message arrives; a chat's or contract's drawer opens with the same summary, the thread folded below it. An invitation shows its job card's advice (the hourly run gives every pending invitation a card) and opens that card's lead drawer — Write a proposal, Skip, Claude chat; until the card exists it says the next hourly run assesses it.
- **Contracts**: every active contract, always — summary, milestone strip, the current milestone; one that needs the user has a red bar and is in Your move too.
- **Proposals**: Sent / In talks / Closed, live from Upwork; In talks lists every proposal chat, newest message first, each marked whose turn it is (the user's-turn ones are in Your move too). A proposal's drawer shows its job (the Jobs card: Client vs me, About the job) and **What you sent** — the row in Proposals `Sent`, or, until the next digest syncs it, the proposal as Upwork returns it (same blocks, no milestones, marked as from Upwork) — with links to both in Notion.
- **Rows**: the title opens the item on Upwork (the job, the thread for a reply, the workroom, the invitation); the rest of the row opens the **drawer** from the right — the lead's advice line, Client vs me, About the job and then the proposal from Proposals with a copy icon on every value, with Mark applied / Skip (a reason if you want one) / Write a proposal or Rewrite / Restore in a sticky bar, a contract's summary, milestones and conversation, a proposal's chat and terms — with the main Upwork action as a button, foldable sections and ↑ / ↓ through the list. Every drawer lists its sections in one order — Client vs me (first and always open, when the job has a card), About the job, the proposal or What you sent, Milestones, Conversation, Facts — and starts folded what matters less for its kind: About the job once the user has applied (an applied lead, a proposal, a contract, a conversation), What you sent in a proposal that is being discussed, the Conversation under its summary, Facts always. A New lead has Lock / Unlock in the bar, and a locked one shows `Locked` on its row and in the drawer's header; Write a proposal and Rewrite check `Locked` on the card before starting the task (SKILL.md → *Locked*). Mark applied / Skip / Restore write `Status`, `Decided on` and the skip fields to the card, Lock / Unlock writes `Locked`, the switches write the config, Rewrite sets the proposal's `State` to Writing and starts the drafts task; nothing else writes.
- **Claude chat**, in the drawer's top bar for a lead, a proposal, a contract or a conversation: the job's one Cowork chat. The link is the card's `Chat` — on a phone `https://claude.ai/cowork/cse_<id>`, elsewhere `claude://claude.ai/code/session_<id>` (artifacts let `claude://` out in the desktop app; iOS keeps claude.ai links in the browser). No `Chat` yet → a new Cowork with the job named first and its ids — `claude://cowork/new?q=…`, on a phone `https://claude.ai/new?mode=cowork&surface=cowork&project=<id>&q=…` with the project from `chat_project` (none → no `project`) — and that chat writes its own link to the card (`references/chat.md` → *A job's chat*). A contract finds its job through `list_contracts` `get` (`job.id`), its conversation through the contract; a conversation with no proposal or contract gets a chat that is not kept.
- Same look as the project-tracker dashboard (tokens, pills, rows, drawer); change the shared parts in both together.

To publish or update it:

1. Copy `assets/dashboard.html` to a working file and replace every placeholder: `__ROOT_PAGE__` (the root page id — the page reads `match_score` from the config there on every load), `__UPWORK_ORG__`, `__VIEW_INBOX__`, `__VIEW_APPLIED__`, `__VIEW_SKIPPED__`, `__VIEW_PROPOSALS_OPEN__`, `__VIEW_PROPOSALS_SENT__`, `__VIEW_RUNS__`, `__VIEW_QUESTIONS__` (the view URLs from the config), `__QUESTIONS_URL__` (the Questions database page URL), `__TIMEZONE__`. Nothing else in the file needs editing; keep the first line, `<!-- dashboard-version: N -->`. Where a shell with Node is available, check the page's script still parses before publishing (`node --check` on the contents of the last `<script>` block) — a page whose script fails shows "Connecting…" forever and no error.
2. Publish it with the artifact tool of the surface (on claude.ai / Cowork: the Artifact tool with the capabilities above; load the artifact-capabilities skill first if the surface has it). **Updating** an existing dashboard: read the artifact first (`action: "read"` with the `dashboard` URL — the surface refuses a publish over an artifact this conversation has not read), then read the full page it saves, every line, as the read result says (the Read tool in chunks, by offset and limit) — the surface counts the page as read only then — and publish to that URL; the link stays the same. That read is a few thousand lines, once per release: it is the price of the update, not a reason to put it off — an hourly run with a pending update does it in that run, never leaves it for a later run or a chat. Only a publish that fails after the read waits for the next run. Always pass the capabilities above in full: omitting them keeps the set the page was first published with, and a tool a newer page calls would be refused. A new artifact for an existing dashboard asks the user to allow the connectors again — avoid it.
3. Write the URL into the config as `dashboard` and the asset's N as `dashboard_version` (add the line if it is missing).

If the surface has no artifact tool, still do step 1: write the filled file into the working directory (`upwork-dashboard.html`), tell the user where it is and that a claude.ai artifact with the `mcp` capability (or any page that can call their Notion and Upwork connectors) can host it. The dashboard is part of setup; do not leave it for the user to request.

### Versions

The asset's first line carries the plugin's version, stamped by the release on every release (the line is marked `x-release-please-version`); SKILL.md (*Dashboard updates*) compares it with the config's `dashboard_version`, and a lower one is republished without asking. No hand edits: a release that did not change the page still republishes it, which costs one publish and changes nothing.

## 8. Scheduled tasks

Five tasks, each a fresh session, each with the Notion and Upwork connectors. The prompts are short because the skill carries the logic; each names the mode, the root page URL (so a run never has to choose between two pipelines), the parameters the mode needs, and says the run is scheduled — that is what switches the skill to automatic mode. Nothing else goes into a prompt: how a run reports, when it pushes and when it stays silent live in the skill, so updating the skill updates every task without touching the prompts. `<root>` below is the root page URL — put the real URL into every row, never leave `<root>` in a prompt. Times are in the user's timezone; when the surface schedules in UTC, convert with the offset in effect and tell the user to move the crons when daylight-saving changes.

| Task | When | Prompt |
|---|---|---|
| Upwork search — hourly | every hour | `Use the upwork-pulse skill in hourly search mode on <root>. Scheduled run.` |
| Upwork digest — morning | e.g. 11:00 | `Use the upwork-pulse skill in digest mode on <root>, window from <evening hour> yesterday to now. Scheduled run.` |
| Upwork digest — evening | e.g. 22:00 | `Use the upwork-pulse skill in digest mode on <root>, window from <morning hour> today to now. Scheduled run.` |
| Upwork questions — weekly | e.g. Sunday 20:00 | `Use the upwork-pulse skill in weekly review mode on <root>. Scheduled run.` |
| Upwork drafts | no schedule — started by the dashboard's Write a proposal / Rewrite button | `Use the upwork-pulse skill in drafts mode on <root>. Scheduled run; the jobs come with the run.` |

The drafts task has no schedule of its own: the hourly run writes drafts through an Opus subagent, and this task exists so the dashboard can write or redo one job's proposal. Write its id into the config as `drafts_task`.

Each digest's window starts at the other digest's time, so the two cover the day without gaps; put the user's times into both prompts. Schedule the digests and the weekly review at exactly the minute the user gave — no shifting of the minute to spread load, even where the scheduling tool suggests it: a digest that runs at 10:48 while the next one's window starts at 11:00 loses whatever was found in between. Only the hourly search may run at any minute.

Where the surface has a task-creation tool (Cowork: `create_trigger`), create the five tasks yourself — this is the user's request, so `initiation` is `human_request`; cron in UTC per the tool's rules. The tool takes no model and no approval mode, so two things follow it:
- **Model**: the runs are written for Sonnet, the drafts task for Opus. Ask once, in the setup questions (default: Sonnet for the four, Opus for drafts), and set each with `update_trigger` `model` — that is the user's explicit choice, which the tool requires.
- **Notifications**: the push comes from the run itself (the `PushNotification` tool, SKILL.md → automatic mode), not from the task's notification setting; the task's final reply is not pushed. Leave that setting as it is.
- **Approval**: the runs write to Notion unattended. If a created task reports that its runs will ask for approval, tell the user to switch it to "Automatically approve" in its settings.

The task sessions must have this plugin and the Notion and Upwork connectors. A task cannot check that from inside, so step 9 fires the hourly task once and looks for its Runs row.

Where there is no task-creation tool, the table, filled with the user's hours and the root URL, goes into your final reply so the user can create the tasks by hand — all five rows, each with its schedule and its full prompt, in this reply. Never offer it "on request", never hold it back to ask for the times (no times given → the defaults of §2, said as such), and never point the user to the skill's own files: they cannot see them. Either way the tasks are part of setup, not an extra the user has to ask for — do not ask whether to set them up; create them, or hand over the table: without them the pipeline is a set of empty databases.

## 9. Verify and tell the user

Fetch the root page: the config toggle first with every key filled (except `dashboard` if not yet published), then the four pages and four databases. Fetch each database: columns and views as above.

If you created the tasks: fire the hourly one once (`fire_trigger`), wait a few minutes, and query `runs_latest`. A new row means the task session has the skill, the connectors and write access. No row → the task's last run tells why (the plugin not installed on that surface, a connector missing, approval pending); say so to the user plainly — the pipeline does not run until it is fixed.

Reply in `language` with: what was created, adopted or already in place; the placeholders left in the rules pages for the user to fill; **the tasks** — created, or, when this session cannot create them, the §8 table itself in the reply: every task with its schedule and its full prompt carrying the real root URL (saying they are not created without the table leaves the user with nothing to act on); **the dashboard** — its URL; where no artifact tool exists, fill the file anyway (§7 step 1) and say where it is and what can host it. Add one line on models: the scheduled tasks run on Sonnet; proposals are best written in a chat on Opus. End with the first live check: "run the hourly search now" in this chat.

## 10. Updating an existing pipeline — "update the pipeline"

For a pipeline whose config `schema` (none means 1) is below what this skill writes. The newer skill cannot work on the old structure, so the skill updates it on its own, with nobody asked (SKILL.md → Pipeline update): the first hourly run that sees the old schema, or a conversation that gets there first; "update the pipeline" in chat runs it too, and finishes one that stopped. The update works **in place**: the same root, databases, cards, links and tasks; nothing is copied to a new page, and nothing the user wrote is lost. Each version below says what its update does; a pipeline several versions behind takes them in order, oldest first, as one update: `schema` is written once, at the end, with the newest version, and there is one report.

**One session at a time.** Before anything else, add `updating: `<now, ISO with offset>`` to the config (`update_content` on the toggle, tab-indented, the value in backticks like every other key; in the same edit remove any `update_error` line), then fetch the root again. More than one `updating` line → the earliest wins: a session whose line is not the earliest removes its own and stops (in chat: one line, an update is already running). A line older than 2 hours belongs to a session that died: replace it with yours.

**The dashboard first**, before step 1 of the first version: §7, published to the URL in `dashboard` (read it first) so the link stays; `dashboard_version` set to N. The new page reads the config's `schema` and, until the update writes it, shows only that the update is running — so nothing reads a half-converted pipeline as if it were done. A session that cannot publish (no Artifact tool), or a publish that fails, goes on without it: the next hourly run republishes it as a regular dashboard update (SKILL.md → Dashboard updates), and the report says so. No `dashboard` line → nothing to publish here.

**Safe to stop and run again.** Every step checks first and does only what is missing, so an update cut short is finished by the next session that runs it. `schema` is written last: until then the scheduled runs stay paused, and nothing half-converted is read by them.

**If it stops** — a check below fails, a write errors (SKILL.md: stop, re-fetch, report), the session runs out of budget — replace the `updating` line with `update_error: `<version and step> — <why, one line in language>`` (no backticks inside the value). The automatic runs then stay paused and the digests say so until a conversation runs the update again: an hourly run does not retry a cause that would only repeat every hour.

**Nothing is dropped unchecked.** A column is removed only after its values are verified to be in their new place. What an old text column held beyond the facts that have columns (a client's open jobs or review count, a region) goes with it — say so in the report. A column the update does not know (one the user added by hand) is never removed — it is named in the report. "Now" is the session clock in the config's timezone.

**When it ends**, in one `update_content` on the config: `schema: <new>` (the line added if missing), `updating` and `update_error` removed. Then the **report**, in `language`, as each version's last step lists. In a conversation it is the reply, before the answer to the user's own request. In the hourly run the report is the run's final reply, and the push is one line: "Upwork Pulse updated to schema <new> — <what changed, in a few words>; details in this task's chat" (load `PushNotification` with `ToolSearch`); an update that stopped pushes "Upwork Pulse update stopped: <update_error>. Open a chat and say \"update the pipeline\"". The run ends there, without searching; the next hourly run catches up from the watermark.

### To 3 (from 1 or 2)

1. **Jobs columns.** Fetch the data source. First, an old text column named `Proposal` (an early schema 2) is renamed `Proposal (old)`, so the relation of step 2 can take the name; a schema-2 `Skipped on` is renamed `Decided on` (`RENAME COLUMN`), which keeps its dates. Then add every §4 Jobs column that is missing (`ADD COLUMN`, the types and options of §4), and give the existing money columns (`Budget`, `Rate min`, `Rate max`, `My $`) the dollar format. **Runs** without `Created` gets it, and its Latest view sorts by it (skip what is already so).
2. **Proposals.** Create the database if it is missing (§4 DDL, `Job` related to this Jobs data source), with its two views (§5).
3. **Convert the cards.** Read `jobs_all`, every page. A card that still has text in an old column gets one `update_properties` (several cards per turn) filling the new columns from that text — a value goes in only when the text states it; anything unclear stays empty, never guessed; a new column that already has a value is left alone:
   - `Client $` → `Payment` when empty, and `Budget` (`$1,500 fixed`) or `Rate min` / `Rate max` (`$40–60/hr`; a single `$45/hr` fills both);
   - `Client time` → `Duration`, when it is one of the five values;
   - `Client` → `Country` (in English, as the API names it: `United States`, `Germany`), `Verified` (checked only when the text says verified), `Hires`, `Spent` (`$8.4K` → 8400), `Rating` (the average is left out: it is `Spent` / `Hires`); "no hires" is `Hires` 0;
   - `Competition` → `Invites`, `Interviewing`, `Bid low` / `Bid high` (a hired count is left out);
   - old cards have no decision or advice dates: `Decided on` (schema 1) and `Advised on` stay empty.
4. **Schema-2 drafts.** Only cards with a `Draft` value can hold a draft (fetch just those for a `Proposal` page). For each, a row in Proposals in the §4 shape, unless one with this `Job ID` exists — two cards with one `Job ID` (a duplicate) get one row, from the draft written last (`Drafted`), and the other card is named in the report: `Job` = the card, `Title`, `Job ID` from the card; `Proposal ID` and `Boost` from the card; `State` `Ready` unless the card's `Draft` says Sent (then empty); `Written` = the card's `Sent on` for a sent one, else `Drafted`; body = the page's content without its `## Rate` section. The price goes to the card, not the row: the number in that `## Rate` section → `My $` when the draft was sent or the card's `My $` is empty; a sent draft's card gets `Status` Applied, and its `Sent on` → `Decided on` when that is empty. Older text draft columns, where they exist, become the body instead: `Proposal` → Cover letter, `Bid` → the card's `My $` (by the same rule), `Milestones` and `Screening` → their sections, `Draft notes` → How it was written, as it is. A sent draft with no `Proposal ID` on the card gets one found on Upwork, as To 4 step 2 says. Once the row is written, the `Proposal` page leaves the card: `update_content` replacing its `<page …>Proposal</page>` line with nothing, `allow_deleting_content: true` (the page goes to Notion's trash).
5. **Check.** Read `jobs_all` and `proposals_open` / `proposals_sent` again. Every card that had text in an old column has at least one new column filled from it (per card, per old column); every schema-2 draft has its row. Anything missing → stop here as *If it stops* says, drop nothing; `update_error` and the report name the cards and why.
6. **Remove the old columns** that are present: `Client $`, `Client time`, `Client`, `Competition`; from schema 2 also `Draft`, `Drafted`, `Proposal ID`, `Boost`, `Sent on`, and the text columns `Proposal`, `Bid`, `Milestones`, `Screening`, `Draft notes` (`DROP COLUMN`). Columns not in §4 and not on this list stay.
7. **Views** as §5: Inbox shows the new columns; Skipped (created if missing) and Applied sort by `Decided on`.
8. **Run state**: `PROPOSALS_SYNCED_UNTIL: <now>` appended if missing (`insert_content`; the `PROCESSED_UNTIL` line is never touched).
9. **Drafts task**: created if the config has no `drafts_task` (§8; no schedule, on Opus). Where tasks cannot be created, its prompt goes in the report.
10. **Config** (`update_content` on the toggle, tab-indented): add whatever is missing of `proposals`, `jobs_skipped`, `proposals_open`, `proposals_sent`, `auto_drafts: off`, `auto_skip: off`, `drafts_task`. To 4 follows: its steps 1–4 find nothing to convert for rows written here in the §4 shape, and its steps 5–6 still run.
11. **Report** in `language`: what was added, converted and removed; the cards whose old text gave nothing for a column (by short id, if any); columns left in place; a line in the rules pages or Field notes that names a removed column (quote it — the user decides); that `auto_drafts` and `auto_skip` are off and switch on the dashboard; and that "sync proposals for the last N months" fills Proposals with what they sent before.

### To 4 (from 3)

Price, time and the send date move to the job card, so each lives in one place; a Proposals row keeps only its text, `Written`, `Proposal ID` and `Boost` (SKILL.md → *One fact, one place*). Say in the report: on a sent proposal the price sent becomes the card's `My $`; on a draft the card's `My $` stays (it is the newer estimate) and fills from the draft only when empty.

1. **Read** `proposals_open`, `proposals_sent` (the schema-3 views, filtered by `State`), and `jobs_all`, every page.
2. **Sent rows** (`State` Sent). The card is the row's `Job`; none → a card made as the sync makes one (`references/sync.md` §2: from `find_jobs` `get`; the job gone → from the row's `Title`, `Job ID`, `Link`, `Payment`). One `update_properties` on the card: `Status` Applied, `Decided on` = the row's `Sent on` (when it has one), `My $` = the row's `Rate` (when it has one), and `Payment` / `Link` from the row where the card's are empty. On the row: `Written` = its `Sent on`, `State` cleared (`null`). A sent row without a `Proposal ID` (an old conversion) gets it from Upwork: `list_freelancer_proposals` `list` by status, as the sync does (`references/sync.md` §1), back to the earliest such `Sent on`, matched by `Job ID`; none found → `Proposal ID` `unknown`, named in the report — the row must count as sent.
3. **Draft rows** (`State` Ready, Writing or empty, no `Proposal ID`): the card's `My $` empty → the row's `Rate`; `Connects` empty → the row's `Connects`; `Payment` empty → the row's. A row whose `State` is empty and whose body is empty (a request the dashboard left) stays as it is.
4. **Check.** Read the rows again: every former sent row has a `Proposal ID` and an empty `State`, and its card is Applied with `My $` set when the row had a `Rate`. Anything missing → stop here as *If it stops* says, drop nothing; `update_error` and the report name the rows.
5. **Views** as §5: Open filters on an empty `Proposal ID`, Sent on a set one, both sorted by `Written`. The views first: the old Sent view sorts by `Sent on`, which goes next.
6. **Proposals columns**: `DROP COLUMN` `Link`, `Payment`, `Rate`, `Connects`, `Sent on` (those present), and `ALTER COLUMN "State" SET SELECT('Writing':yellow, 'Ready':green)`. Columns not in §4 and not on this list stay.
7. **Report** in `language`: rows converted, cards created or changed (price taken from what was sent: by short id), Proposal IDs found or marked `unknown`, columns removed and left in place.

### To 5 (from 4)

Each job gets one Cowork chat with Claude, opened from the dashboard's Claude chat link wherever the job shows up (`references/chat.md` → *A job's chat*); a pending invitation gets a card with advice and, with auto proposals, a proposal (`references/hourly.md` §3).

1. **Jobs**: `ADD COLUMN "Chat" URL COMMENT 'Cowork chat with Claude for this job'` when missing. The `invited` flag needs no step: Notion adds the option the first time a card gets it.
2. **Report** in `language`: the dashboard's Claude chat link — the first chat opened from a job is kept on its card and every later click on that job opens the same one; invitations now get a card and advice like found jobs.

### To 6 (from 5)

Auto skip covers every Skip advice, not only the one just written, and `Locked` keeps it away from the cards the user asked about and from invitations (SKILL.md → *Locked*). Lock what the user already asked about before `schema` is written: from then on the hourly run skips every unlocked card advised Skip.

1. **Jobs**: `ADD COLUMN "Locked" CHECKBOX COMMENT 'Auto skip leaves this card; the user decides'` when missing; the Inbox view shows it (§5).
2. **Lock** — read `jobs_inbox` (New cards) and `proposals_open`. `Locked` checked (one `update_properties` per card, several per turn) on every New card that has the `invited` flag, or has `Advice` Skip and a row in Proposals (its `Proposal` relation, or a row with its `Job ID`): the hourly run never writes a proposal row for a Skip, so that row comes from the user's own request — the dashboard's button or a chat. Cards already locked are left alone.
3. **Report** in `language`: what `Locked` does and where it is set (the dashboard's Write a proposal / Rewrite, chat requests, invitations, Lock / Unlock in the drawer); the cards locked now, by short id; and, when `auto_skip` is on, how many New cards are advised Skip and unlocked — the next hourly run skips them.
