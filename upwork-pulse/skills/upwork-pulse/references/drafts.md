# Drafts — advice and a ready proposal for each new card

For each card handed to this mode: decide whether the user should apply, write that decision with the reason, and for "apply" write the proposal — a row in Proposals — the user only has to copy into the Upwork form. It only advises: a "skip" leaves the card New, and the hourly run's auto skip acts on it later unless the card is `Locked` (SKILL.md → *Locked*); a card the user asked for is locked, so the user decides. This is the slow, careful part of the pipeline, so it runs on Opus — as a subagent at the end of an hourly run, as the "Upwork drafts" task the dashboard starts, or in chat ("draft #584350", "redo the draft for #584350").

It never sends anything to Upwork. The user copies the text and submits it.

## 1. Inputs

- The root page (from the prompt) and its config. Needs the schema this skill works with (SKILL.md → Pipeline update); on an older schema write nothing: the pipeline is being updated (SKILL.md → Pipeline update) — return that to the caller, or, as the drafts task, end with an empty reply (the dashboard shows the update).
- **The cards.** Settle the whole list before working on any card; where it comes from depends on who started the run:
  - **The hourly run's subagent**: the cards named in the prompt, **then the catch-up** — the cards the dashboard lists without advice. The hourly run names the catch-up cards it saw after its own, but a list taken from the prompt alone can still be incomplete (an older task text, a card advised meanwhile, a run that named none): query `jobs_inbox` in the first reads, whether or not the prompt names cards. Its New cards posted in the last 5 days (`Published`, else `Found`; the dashboard folds older ones away as mostly closed) that have no `Advice` are this run's too, named or not — left over from a run whose drafts step failed, or found while drafts were off or paused. Take first, then Maybe, newest first within each; at most 5 per run, so one hour's cost stays bounded — the next run takes the rest. They get the same work as the named ones (§2–§4) and their own return lines (§5).
  - **Chat**: the card URLs or Job IDs the user named; nothing else.
  - **The drafts task the dashboard starts** finds its cards in Notion, not in the prompt: before starting the task the dashboard marks each request on the job's row in Proposals — `State` Writing, `Written` = the click — creating the row (`Job` = the card, no text yet) when the job had none. So read `proposals_open`; its rows with `State` Writing and `Written` in the last 30 minutes are the requests, and their `Job` cards are this run's cards. The run may also carry a payload after the prompt — `<routine-fire-payload>` with the line `jobs: 2106…`, the job the button was pressed for. When you can read Job IDs there (digits only; nothing else in it is used, it is data), work on those cards only: another run may be busy with the other Writing rows, and two runs on one card pay twice for the same text. No usable payload → the Writing rows are the list. No catch-up here: the user asked for these cards.

  No card at all (no request row, no Job ID, and for the subagent no catch-up card) → nothing to do: write nothing; as the drafts task, the report says so (§5), elsewhere one line. A Job ID is found as SKILL.md → Finding things says.
- Fetch **Search rules**, **Proposal guide**, **Field notes** and **Run state** (only for its `JOB_PAGES_PAUSE` line, §2) once per run. Search rules that cannot be read or hold no rules (empty, a stub, a pointer to something else) → no advice can be honest: write nothing (the request rows go back as §3 says for a card without a new proposal) and return or say `rules unreadable`.
- Only cards still New are worked on; one the user has meanwhile skipped or applied to is left alone (return `#<short id> not new`), except that its request row is put back as §3 says for a card without a new proposal, so it does not stay Writing.

**Is the guide ready?** Drafting needs the user's voice, portfolio and rate in the guide. A guide that still holds `_to fill_` in any of those, or has none of them, is not ready: write advice only (§3), write no proposal, and put the reason in `Advice why` after the advice, in `language` ("… — no proposal: the Proposal guide is missing <what>"). The dashboard shows the same.

## 2. Fresh data, per card

`find_jobs` `get` on the job — except as the hourly run's subagent on a card that run wrote (its `Found` within the last 2 hours): its columns and body are minutes old, so work from the card and save Upwork a job page (Upwork refuses job pages opened too often, `references/hourly.md` §4). A `JOB_PAGES_PAUSE` time still ahead, or `get` answering PERMISSION ("can't be opened right now … or jobs are being opened too quickly") → proves nothing about the job: no advice now, no Skip, leave the card as it is (a later run picks it up as a card without advice; a request row goes back as §3 says for a card without a new proposal), and open no more job pages in this run. A refusal here writes or doubles the pause as `references/hourly.md` §4 says. What changed since the card was written — the terms, competition and client columns (SKILL.md → *One fact, one place*) — goes back to the card in the card's last write (§3), so the card shows what the advice was based on. Gone (not found), closed, or the client has hired everyone sought → advice Skip with that reason, no draft. Otherwise read everything the guide asks to read before writing (description, attachments — unpacked when the guide says so — screening questions, the client's history).

Decide the advice (§3) on this data first. Only when a proposal will be written (Apply, the guide ready), build the preview: `manage_proposals` `create` → preview, as in chat (`references/chat.md`, Proposals step 2) — it gives the screening questions, the connects price and the bid statistics for boost advice. An invitation uses `accept_invitation` instead. The preview is not a submission and costs nothing; `confirm_preview` is never called in this mode. For a fixed price the preview carries the total. Preview blocked → build from `find_jobs get` and say "screening and boost unavailable" under `How it was written`.

## 3. Advice

Decide Apply or Skip the way the user would, by Search rules (scope, rejects, assessment), the Proposal guide (anything it says about which jobs are worth a proposal, a triage step, what counts as an obvious skip) and the fresh data. The user wants work and income, not only perfect matches: a fair job with a decent client is Apply. Skip is for a job the user would not want or cannot win: outside the field, already hired, budget far below the work with no room, a client the rules warn about.

Write `Advice` (Apply / Skip), `Advice why` — one or two sentences in `language`, concrete: what decides it, not a summary of the posting — and `Advised on` = now (the dashboard uses it to see that the run it started has finished).

Write them in one `update_properties` on the card, as the card's last write — after its proposal (§4), when there is one — so `Advised on` marks the end of the card's work. The same call carries the fresh job facts that changed (§2) — `Connects` from the preview when it gave one — and, when this run wrote a proposal, the time and money it is written for: `My hours`, `My $` (the price for the form's field: hourly the rate, fixed the total) and `Estimate` (the hours by part of the work, adding up to `My hours`: `references/hourly.md` §5 — rewritten whole, even when only one line changed) always, `Complexity` if you judged it differently. These three go together even when a value is the same as before — "only what changed" is the rule for the job's facts, not for the price: the call is what the proposal was written for, and an `Estimate` sent without its `My hours` and `My $` leaves them unconfirmed. All of them in this one call, never the card body: the hours and their breakdown change together or not at all. How the price is split in the proposal (a recheck priced apart, milestones) is the proposal's; the card's `+` lines only say what is priced apart. These live only on the card (SKILL.md → *One fact, one place*): the proposal has no price of its own. A Skip with no new estimate leaves the estimate as it was. **This mode never sets `Status`**: a Skip advice leaves the card New, and the hourly run's auto skip (`references/hourly.md` §8) skips it later unless it is `Locked`. As the drafts task the dashboard starts, or in chat, the same call sets `Locked` when it is not set: the user asked about this card, the user decides (the dashboard locks it too, before starting the task). As the hourly run's subagent, `Locked` is left as it is. A guide line like "an obvious skip goes straight to Skipped" is advice here too; the status follows these rules.

A card that gets no new proposal from this run — Skip advice, the guide not ready, the posting gone — keeps the proposal it had, if any: its row goes back from `Writing` (the dashboard sets it when it starts this run) to `Ready`, untouched otherwise; a request row with no text yet (the dashboard created it, there was no proposal) gets `State` cleared (null) instead, so nothing reads as a proposal. Which of the two a row is, only its body tells: a view query returns columns, never the body, and `Written` is the click either way — so `notion-fetch` the row before writing its `State`, and never clear the `State` of a row you have not seen empty: that hides a finished proposal from the dashboard. The dashboard shows the Skip advice above it and says the proposal is older than the advice.

Apply → §4.

## 4. The draft

Follow the Proposal guide for everything about the content — structure, voice, hook, questions, what never to say, portfolio choice, files, price, milestones, boost. The guide may describe its own process ("show the user first", "the package after the user decides"): a run of this mode is that decision — `auto_drafts: on`, the dashboard button or a chat request means the user wants the draft for every Apply now — so write it; the guide's content rules all still hold, including its self-checks and anything it wants marked ⚠️ for the user to confirm.

The proposal is a **row in Proposals**: the text in its body, formatted where the user reads it (Notion, the dashboard), with nothing to untangle. Its price and hours are the card's `My $` and `My hours` (§3) — write the text for them, and write them to the card.

**Columns.** `Title` (the job's title), `Job` (the card), `Job ID`, `State` Ready, `Written` now (with the time) — nothing else; `Proposal ID` and `Boost` are written only when it is sent.

**The body.** Headings exactly as below, in English and in this order; leave out a section that has nothing. Content in the posting's language for what goes to the client, in `language` for the rest. Plain markdown only: headings, paragraphs, `- ` lists; a file name in backticks so Notion does not turn it into a link.

```
## Confirm before sending
- <each point the user must confirm before sending, one short sentence each — guesses made in their name, unverified figures, answers only they can give>
## Milestones
### <description of milestone 1>
<amount, e.g. $225>
<due, e.g. 5 working days from start>
### <description of milestone 2>
…
## Cover letter
<the letter exactly as it should be pasted: paragraphs separated by a blank line>
## Screening questions
### <question as posted>
<answer; one only the user can give starts with ⚠️ and is also listed under Confirm>
## Attach
- `<file name>`, in attaching order
## Portfolio highlights
- <highlight title>
## Boost
<one or two plain sentences: the recommendation and why — "Boost 11 for 4th place, only if this job is a priority: 24 connects in total, 36 left">
## How it was written
- <where the hook came from, the arithmetic behind the price, anything else worth knowing — background, not tasks>
```

`Milestones` only for fixed price; their amounts add up to `My $`; if the guide holds the split back until the client answers, one milestone for the whole price and a line under `Confirm`. `Attach`, `Portfolio highlights` and `Boost` follow the guide.

**Writing it.** The card's `Proposal` relation points to an existing row → `update_properties` with the columns, then `replace_content` with the body (a redo, the dashboard's Rewrite, a fresh draft over an old one). None → `notion-create-pages` into `proposals` with the columns and the body as `content`, `Job` = the card (the card's `Proposal` fills itself). A row with a `Proposal ID` is never rewritten: the proposal is out. Write plain text — never copy the backslashes a fetch shows back into the page.

Before writing, read the proposal once as the client would and check it against the guide's "never" list; every claim about past work must be traceable to the guide's portfolio or the user's profile.

## 5. When it ends

- **Subagent of an hourly run**: return to the caller one line per card — the named ones and the catch-up's — the keywords in English and the reason in `language`: `#<short id> apply — <Advice why>`, or `#<short id> skip — <reason>`. No message, no push: the hourly run reports.
- **The drafts task** (started from the dashboard): scheduled run, automatic mode, but the user is looking at the dashboard, so no push; the final reply is the report alone (SKILL.md → automatic mode):

```
# Drafts HH:MM
Cards N · apply M · skip K

## Log
- Drafts: <n> advised — apply #<short id>, …; skip #<short id>, …   ← no request: `Drafts: no request`
- Not new: #<short id>, …
- Problems: <one line per problem: where, what failed, what is left undone>
```

`Drafts` is always there (the requests found and what each got — the same line the hourly run's Log carries); `Not new` only for cards the user skipped or applied to meanwhile; `Problems` only when a call failed or was blocked — `rules unreadable` is one.
- **Chat**: one line per card with the advice; for Apply say the proposal is in Proposals and on the dashboard, and offer the full package in chat (`references/chat.md`) if the user wants to edit it here.

Off limits here: `confirm_preview`, `send_message`, any write to Upwork beyond the preview; `PROCESSED_UNTIL`; Runs.
