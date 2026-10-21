# Pipeline update — bring an older pipeline up to schema 9

For a pipeline whose config `schema` (none means 1) is below what this skill writes. Who starts it and what the other sessions do meanwhile is SKILL.md → *Pipeline update*; this file is the update itself. Inputs: the root page and its config. Output: the converted pipeline and the report (*When it ends*). "Update the pipeline" in chat runs it too, and finishes one that stopped. The update works **in place**: the same root, databases, cards, links and tasks; nothing is copied to a new page, and nothing the user wrote is lost. Each version below says what its update does; a pipeline several versions behind takes them in order, oldest first, as one update: `schema` is written once, at the end, with the newest version, and there is one report.

**One session at a time.** Before anything else, add `updating: `<now, ISO with offset>`` to the config (`update_content` on the toggle, as SKILL.md → *Notion calls* → **Page text**, the value in backticks like every other key; in the same edit remove any `update_error` line), then fetch the root again. More than one `updating` line → the earliest wins: a session whose line is not the earliest removes its own and stops (in chat: one line, an update is already running). A line older than 2 hours belongs to a session that died: replace it with yours.

**The dashboard first**, before step 1 of the first version: `references/dashboard.md` → *Update*, published to the URL in `dashboard` (read it first) so the link stays; `dashboard_version` set to N. The new page reads the config's `schema` and, until the update writes it, shows only that the update is running — so nothing reads a half-converted pipeline as if it were done. A session that cannot publish (no Artifact tool, as in the hourly run), or a publish that fails, goes on without it: the next conversation republishes it as a regular dashboard update (SKILL.md → *Dashboard updates*), and a conversation's report says so. No `dashboard` line → nothing to publish here.

**Safe to stop and run again.** Every step checks first and does only what is missing, so an update cut short is finished by the next session that runs it. `schema` is written last: until then the scheduled runs stay paused, and nothing half-converted is read by them.

**If it stops** — a check below fails, a write errors (SKILL.md → *Rules that protect the user*: stop, re-fetch, report), the session runs out of budget — replace the `updating` line with `update_error: `<version and step> — <why, one line in language>`` (no backticks inside the value). The automatic runs then stay paused and the dashboard says so until a conversation runs the update again: an hourly run does not retry a cause that would only repeat every hour.

**Nothing is dropped unchecked.** A column is removed only after its values are verified to be in their new place. What an old text column held beyond the facts that have columns (a client's open jobs or review count, a region) goes with it — say so in the report. A column the update does not know (one the user added by hand) is never removed — it is named in the report. "Now" is the session clock in the config's timezone.

**When it ends**, in one `update_content` on the config: `schema: <new>` (the line added if missing), `updating` and `update_error` removed. Then the **report**, in `language`, as each version's last step lists. In a conversation it is the reply, before the answer to the user's own request. In the hourly run the report is the run's final reply, and the push is one line: "Upwork Pulse updated to schema <new> — <what changed, in a few words>; details in this task's chat" (load `PushNotification` with `ToolSearch`); an update that stopped pushes "Upwork Pulse update stopped: <update_error>. Open a chat and say \"update the pipeline\"". The run ends there, without searching; the next hourly run catches up from the watermark.

## To 3 (from 1 or 2)

1. **Jobs columns.** Fetch the data source. First, an old text column named `Proposal` (an early schema 2) is renamed `Proposal (old)`, so the relation of step 2 can take the name; a schema-2 `Skipped on` is renamed `Decided on` (`RENAME COLUMN`), which keeps its dates. Then add every `references/setup.md` §4 Jobs column that is missing (`ADD COLUMN`, the types and options of `references/setup.md` §4), and give the existing money columns (`Budget`, `Rate min`, `Rate max`, `My $`) the dollar format. **Runs** without `Created` gets it, and its Latest view sorts by it (skip what is already so).
2. **Proposals.** Create the database if it is missing (`references/setup.md` §4 DDL, `Job` related to this Jobs data source), with its two views (`references/setup.md` §5).
3. **Convert the cards.** Read `jobs_all`, every page. A card that still has text in an old column gets one `update_properties` (several cards per turn) filling the new columns from that text — a value goes in only when the text states it; anything unclear stays empty, never guessed; a new column that already has a value is left alone:
   - `Client $` → `Payment` when empty, and `Budget` (`$1,500 fixed`) or `Rate min` / `Rate max` (`$40–60/hr`; a single `$45/hr` fills both);
   - `Client time` → `Duration`, when it is one of the five values;
   - `Client` → `Country` (in English, as the API names it: `United States`, `Germany`), `Verified` (checked only when the text says verified), `Hires`, `Spent` (`$8.4K` → 8400), `Rating` (the average is left out: it is `Spent` / `Hires`); "no hires" is `Hires` 0;
   - `Competition` → `Invites`, `Interviewing`, `Bid low` / `Bid high` (a hired count is left out);
   - old cards have no decision or advice dates: `Decided on` (schema 1) and `Advised on` stay empty.
4. **Schema-2 drafts.** Only cards with a `Draft` value can hold a draft (fetch just those for a `Proposal` page). For each, a row in Proposals in the `references/setup.md` §4 shape, unless one with this `Job ID` exists — two cards with one `Job ID` (a duplicate) get one row, from the draft written last (`Drafted`), and the other card is named in the report: `Job` = the card, `Title`, `Job ID` from the card; `Proposal ID` and `Boost` from the card; `State` `Ready` unless the card's `Draft` says Sent (then empty); `Written` = the card's `Sent on` for a sent one, else `Drafted`; body = the page's content without its `## Rate` section. The price goes to the card, not the row: the number in that `## Rate` section → `My $` when the draft was sent or the card's `My $` is empty; a sent draft's card gets `Status` Applied, and its `Sent on` → `Decided on` when that is empty. Older text draft columns, where they exist, become the body instead: `Proposal` → Cover letter, `Bid` → the card's `My $` (by the same rule), `Milestones` and `Screening` → their sections, `Draft notes` → How it was written, as it is. A sent draft with no `Proposal ID` on the card gets one found on Upwork, as To 4 step 2 says. Once the row is written, the `Proposal` page leaves the card: `update_content` replacing its `<page …>Proposal</page>` line with nothing, `allow_deleting_content: true` (the page goes to Notion's trash).
5. **Check.** Read `jobs_all` and `proposals_open` / `proposals_sent` again. Every card that had text in an old column has at least one new column filled from it (per card, per old column); every schema-2 draft has its row. Anything missing → stop here as *If it stops* says, drop nothing; `update_error` and the report name the cards and why.
6. **Remove the old columns** that are present: `Client $`, `Client time`, `Client`, `Competition`; from schema 2 also `Draft`, `Drafted`, `Proposal ID`, `Boost`, `Sent on`, and the text columns `Proposal`, `Bid`, `Milestones`, `Screening`, `Draft notes` (`DROP COLUMN`). Columns not in `references/setup.md` §4 and not on this list stay.
7. **Views** as `references/setup.md` §5: Inbox shows the new columns; Skipped (created if missing) and Applied sort by `Decided on`.
8. **Run state**: `PROPOSALS_SYNCED_UNTIL: <now>` appended if missing (`insert_content`; the `PROCESSED_UNTIL` line is never touched).
9. **Drafts task**: created if the config has no `drafts_task` (`references/setup.md` §8; no schedule, on Opus). Where tasks cannot be created, its prompt goes in the report.
10. **Config** (`update_content` on the toggle, SKILL.md → *Notion calls* → **Page text**): add whatever is missing of `proposals`, `jobs_skipped`, `proposals_open`, `proposals_sent`, `auto_drafts: off`, `auto_skip: off`, `drafts_task`. To 4 follows: its steps 1–4 find nothing to convert for rows written here in the `references/setup.md` §4 shape, and its steps 5–6 still run.
11. **Report** in `language`: what was added, converted and removed; the cards whose old text gave nothing for a column (by short id, if any); columns left in place; a line in the rules pages or Field notes that names a removed column (quote it — the user decides); that `auto_drafts` and `auto_skip` are off and switch on the dashboard; and that "sync proposals for the last N months" fills Proposals with what they sent before.

## To 4 (from 3)

Price, time and the send date move to the job card, so each lives in one place; a Proposals row keeps only its text, `Written`, `Proposal ID` and `Boost` (SKILL.md → *One fact, one place*). Say in the report: on a sent proposal the price sent becomes the card's `My $`; on a draft the card's `My $` stays (it is the newer estimate) and fills from the draft only when empty.

1. **Read** `proposals_open`, `proposals_sent` (the schema-3 views, filtered by `State`), and `jobs_all`, every page.
2. **Sent rows** (`State` Sent). The card is the row's `Job`; none → a card made as the sync makes one (`references/sync.md` §2: from `find_jobs` `get`; the job gone → from the row's `Title`, `Job ID`, `Link`, `Payment`). One `update_properties` on the card: `Status` Applied, `Decided on` = the row's `Sent on` (when it has one), `My $` = the row's `Rate` (when it has one), and `Payment` / `Link` from the row where the card's are empty. On the row: `Written` = its `Sent on`, `State` cleared (`null`). A sent row without a `Proposal ID` (an old conversion) gets it from Upwork: `list_freelancer_proposals` `list` by status, as the sync does (`references/sync.md` §1), back to the earliest such `Sent on`, matched by `Job ID`; none found → `Proposal ID` `unknown`, named in the report — the row must count as sent.
3. **Draft rows** (`State` Ready, Writing or empty, no `Proposal ID`): the card's `My $` empty → the row's `Rate`; `Connects` empty → the row's `Connects`; `Payment` empty → the row's. A row whose `State` is empty and whose body is empty (a request the dashboard left) stays as it is.
4. **Check.** Read the rows again: every former sent row has a `Proposal ID` and an empty `State`, and its card is Applied with `My $` set when the row had a `Rate`. Anything missing → stop here as *If it stops* says, drop nothing; `update_error` and the report name the rows.
5. **Views** as `references/setup.md` §5: Open filters on an empty `Proposal ID`, Sent on a set one, both sorted by `Written`. The views first: the old Sent view sorts by `Sent on`, which goes next.
6. **Proposals columns**: `DROP COLUMN` `Link`, `Payment`, `Rate`, `Connects`, `Sent on` (those present), and `ALTER COLUMN "State" SET SELECT('Writing':yellow, 'Ready':green)`. Columns not in `references/setup.md` §4 and not on this list stay.
7. **Report** in `language`: rows converted, cards created or changed (price taken from what was sent: by short id), Proposal IDs found or marked `unknown`, columns removed and left in place.

## To 5 (from 4)

Each job gets one Cowork chat with Claude, opened from the dashboard's Claude chat link wherever the job shows up (`references/chat.md` → *A job's chat*); a pending invitation gets a card with advice and, with auto proposals, a proposal (`references/hourly.md` §3).

1. **Jobs**: `ADD COLUMN "Chat" URL COMMENT 'Cowork chat with Claude for this job'` when missing. The `invited` flag needs no step: Notion adds the option the first time a card gets it.
2. **Report** in `language`: the dashboard's Claude chat link — the first chat opened from a job is kept on its card and every later click on that job opens the same one; invitations now get a card and advice like found jobs.

## To 6 (from 5)

Auto skip covers every Skip advice, not only the one just written, and `Locked` keeps it away from the cards the user asked about and from invitations (SKILL.md → *Locked*). Lock what the user already asked about before `schema` is written: from then on the hourly run skips every unlocked card advised Skip.

1. **Jobs**: `ADD COLUMN "Locked" CHECKBOX COMMENT 'Auto skip leaves this card; the user decides'` when missing; the Inbox view shows it (`references/setup.md` §5).
2. **Lock** — read `jobs_inbox` (New cards) and `proposals_open`. `Locked` checked (one `update_properties` per card, several per turn) on every New card that has the `invited` flag, or has `Advice` Skip and a row in Proposals (its `Proposal` relation, or a row with its `Job ID`): the hourly run never writes a proposal row for a Skip, so that row comes from the user's own request — the dashboard's button or a chat. Cards already locked are left alone.
3. **Report** in `language`: what `Locked` does and where it is set (the dashboard's Write a proposal / Rewrite, chat requests, invitations, Lock / Unlock in the drawer); the cards locked now, by short id; and, when `auto_skip` is on, how many New cards are advised Skip and unlocked — the next hourly run skips them.

## To 7 (from 6)

The estimate becomes a column: `Estimate` holds the hours by part of the work and is written in the same call as `My hours` and `My $`, so the breakdown and the numbers can no longer disagree (a card's body text was a second write that could fail on its own). New cards have four body sections (`references/assess.md` §4).

1. **Jobs**: `ADD COLUMN "Estimate" RICH_TEXT COMMENT 'Hours by part of the work, one per line; they add up to My hours'` when missing. `Flags` without the `invited` option gets it: `ALTER COLUMN "Flags" SET MULTI_SELECT(...)` with every option the column has now, in its order and colours, plus `'invited':blue` — an option left out of that list is removed from the cards, so fetch the data source first and copy them all.
2. **Old cards** stay as they are: their `## Estimate` body section is kept, the column stays empty, and the dashboard shows the section in About the job. Nothing is converted.
3. **Report** in `language`: the estimate is now a breakdown by part of the work in the `Estimate` column, shown in the dashboard's Client vs me and in the hourly report; old cards keep their text; the `invited` flag option was added (or was there).

## To 8 (from 7)

Every piece of work records the model that did it (SKILL.md → *Which model*), so the user can see which model found the jobs, which reviewed each one and which drafted its proposal.

1. **Columns**, each when missing (`ADD COLUMN`): Jobs `"Reviewed by" RICH_TEXT COMMENT 'The model that last reviewed the job: assessment, estimate or advice'`; Proposals `"Drafted by" RICH_TEXT COMMENT 'The model that drafted this text; empty when written outside the pipeline'`; Runs `"Found by" RICH_TEXT COMMENT 'The model that ran the search'` and `"Reviewed by" RICH_TEXT COMMENT 'The model that reviewed the survivors'`.
2. **Old rows** stay empty: who wrote them is not known, and a guess would be the very thing the column exists to catch. Nothing is converted.
3. **Report** in `language`: from now on the cards, proposals and runs record the model that wrote them, and the dashboard shows it on the job; older ones have none.

## To 9 (from 8)

Two Jobs views keep the hourly run's reads small: it checks what it has already seen against a week of cards instead of all of them (`references/hourly.md` §4), and it picks the cards to catch up itself, so its Opus subagent no longer reads the whole Inbox and drafts mode on an hour with nothing to catch up (`references/hourly.md` §6). Nothing changes in what the user sees, and no row is touched.

1. **Views.** Fetch the Jobs database: it lists its views by name. Create `To advise` and `Recent` (`notion-create-view`, `type: "table"`, the filter and sort of `references/setup.md` §5), each only when no view by that name exists — a view an earlier, stopped update created is kept, not made twice.
2. **Config** (`update_content` on the toggle, SKILL.md → *Notion calls* → **Page text**, after `jobs_all`): `jobs_to_advise` and `jobs_recent`, each the URL of its view (`references/setup.md` §5), added when missing.
3. **Check.** Query each of the two views once (`mode: "view"`, `page_size: 20`). An error, or rows that break the view's filter (a card that is not New in To advise; one found more than a week ago in Recent) → stop here as *If it stops* says; `update_error` names the view and what came back. The update writes `schema` only with both views working, since the hourly run reads them from then on.
4. **Report** in `language`, one or two lines: the two views were added to Jobs to make the hourly runs cheaper; nothing else changed.

## Digest tasks

Older versions set up a morning and an evening digest task; the skill no longer has that mode. The user reads the leads on the dashboard, live, a Take or an invitation is pushed by the hourly run that finds it, and the hourly run syncs the proposals the digests used to (`references/hourly.md` §6). The skill cannot delete a task, so a digest task that still fires fetches only the root page, for `language`, and writes nothing — no sync, no rules, no schema check — and only tells the user it can go: it loads `PushNotification` and pushes, in `language`, "Upwork Pulse has no digests any more: the dashboard shows the leads and the hourly run syncs proposals. Delete this task", and its reply is that line. The push repeats with every run until the task is deleted, which is the point: a silent run would cost a session twice a day forever.

Off limits here: `PROCESSED_UNTIL` (To 3, step 8); a column the user added, and any column whose values are not yet checked in their new place (*Nothing is dropped unchecked*); any write to Upwork.

