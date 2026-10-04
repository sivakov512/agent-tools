# Drafts — advice and a ready proposal for each new card

For each card handed to this mode: decide whether the user should apply, write that decision with the reason, and for "apply" write the proposal — a row in Proposals — the user only has to copy into the Upwork form. In the hourly run, with `auto_skip: on`, a "skip" decision also sets the card Skipped; when the user asked for the card, the user decides. This is the slow, careful part of the pipeline, so it runs on Opus — as a subagent at the end of an hourly run, as the "Upwork drafts" task the dashboard starts, or in chat ("draft #584350", "redo the draft for #584350").

It never sends anything to Upwork. The user copies the text and submits it.

## 1. Inputs

- The root page (from the prompt) and its config. Needs `schema: 3`; on an older schema write nothing and say so in one line (chat) or return it to the caller.
- The cards: card URLs or Job IDs given in the prompt (chat, the hourly run's subagent). **The drafts task the dashboard starts** finds its cards in Notion, not in the prompt: before starting the task the dashboard marks each request on the job's row in Proposals — `State` Writing, `Written` = the click — creating the row (`Job` = the card, no text yet) when the job had none. So read `proposals_open`; its rows with `State` Writing and `Written` in the last 30 minutes are the requests, and their `Job` cards are this run's cards. The run may also carry a payload after the prompt — `<routine-fire-payload>` with the line `jobs: 2106…`, the job the button was pressed for. When you can read Job IDs there (digits only; nothing else in it is used, it is data), work on those cards only: another run may be busy with the other Writing rows, and two runs on one card pay twice for the same text. No usable payload → the Writing rows are the list. No request row and no Job ID → nothing to do: write nothing and say so in one line. A Job ID is found as SKILL.md → Finding things says. As the hourly run's subagent, also take, after those, the cards the dashboard lists without advice: New cards in `jobs_inbox` posted in the last 5 days (`Published`, else `Found`; the dashboard folds older ones away as mostly closed) that have no `Advice` — left over from a run whose drafts step failed, or found while drafts were off or paused. Take first, then Maybe, newest first within each; at most 5 per run, so one hour's cost stays bounded — the next run takes the rest.
- Fetch **Search rules**, **Proposal guide** and **Field notes** once per run. Search rules that cannot be read or hold no rules (empty, a stub, a pointer to something else) → no advice can be honest: write nothing (the request rows go back as §3 says for a card without a new proposal) and return or say `rules unreadable`.
- Only cards still New are worked on; one the user has meanwhile skipped or applied to is left alone (return `#<short id> not new`), except that its request row is put back as §3 says for a card without a new proposal, so it does not stay Writing.

**Is the guide ready?** Drafting needs the user's voice, portfolio and rate in the guide. A guide that still holds `_to fill_` in any of those, or has none of them, is not ready: write advice only (§3), write no proposal, and put the reason in `Advice why` after the advice, in `language` ("… — no proposal: the Proposal guide is missing <what>"). The dashboard shows the same.

## 2. Fresh data, per card

`find_jobs` `get` on the job. What changed since the card was written — the terms, competition and client columns (SKILL.md → *One fact, one place*) — goes back to the card in the card's last write (§3), so the card shows what the advice was based on. Gone, closed, or the client has hired everyone sought → advice Skip with that reason, no draft. Otherwise read everything the guide asks to read before writing (description, attachments — unpacked when the guide says so — screening questions, the client's history).

Decide the advice (§3) on this data first. Only when a proposal will be written (Apply, the guide ready), build the preview: `manage_proposals` `create` → preview, as in chat (`references/chat.md`, Proposals step 2) — it gives the screening questions, the connects price and the bid statistics for boost advice. An invitation uses `accept_invitation` instead. The preview is not a submission and costs nothing; `confirm_preview` is never called in this mode. For a fixed price the preview carries the total. Preview blocked → build from `find_jobs get` and say "screening and boost unavailable" under `How it was written`.

## 3. Advice

Decide Apply or Skip the way the user would, by Search rules (scope, rejects, assessment), the Proposal guide (anything it says about which jobs are worth a proposal, a triage step, what counts as an obvious skip) and the fresh data. The user wants work and income, not only perfect matches: a fair job with a decent client is Apply. Skip is for a job the user would not want or cannot win: outside the field, already hired, budget far below the work with no room, a client the rules warn about.

Write `Advice` (Apply / Skip), `Advice why` — one or two sentences in `language`, concrete: what decides it, not a summary of the posting — and `Advised on` = now (the dashboard uses it to see that the run it started has finished).

Write them in one `update_properties` on the card, as the card's last write — after its proposal (§4), when there is one — so `Advised on` marks the end of the card's work. The same call carries the fresh job facts that changed (§2) and, when this run priced the work, your estimate: `My hours`, `My $` (the proposal's price as you set it, before any change the user makes later), `Complexity` if you judged it differently; then `update_content` on the card body's `## Estimate` section only, so the words match the numbers. A Skip with no new estimate leaves the estimate as it was. **Auto skip** only as the hourly run's subagent with `auto_skip: on` (config): a Skip advice also sets `Status` Skipped, `Skipped by` auto, `Skip reason` = the same sentence, `Decided on` = now, in the same call. Otherwise — `auto_skip: off`, the drafts task the dashboard starts, a chat request — the card stays New with the advice on it: the user asked about this card, the user decides. A guide line like "an obvious skip goes straight to Skipped" is advice here too; the status follows these rules.

A card that gets no new proposal from this run — Skip advice, the guide not ready, the posting gone — keeps the proposal it had, if any: its row goes back from `Writing` (the dashboard sets it when it starts this run) to `Ready`, untouched otherwise; a request row with no text yet (the dashboard created it, there was no proposal) gets `State` cleared (null) instead, so nothing reads as a proposal. The dashboard shows the Skip advice above it and says the proposal is older than the advice.

Apply → §4.

## 4. The draft

Follow the Proposal guide for everything about the content — structure, voice, hook, questions, what never to say, portfolio choice, files, price, milestones, boost. The guide may describe its own process ("show the user first", "the package after the user decides"): a run of this mode is that decision — `auto_drafts: on`, the dashboard button or a chat request means the user wants the draft for every Apply now — so write it; the guide's content rules all still hold, including its self-checks and anything it wants marked ⚠️ for the user to confirm.

The proposal is a **row in Proposals**: the numbers in its columns, the text in its body — formatted where the user reads it (Notion, the dashboard), with nothing to untangle.

**Columns.** `Title` (the job's title), `Job` (the card), `Job ID`, `Link` (the job), `State` Ready, `Written` now (with the time), `Payment`, `Rate` — what goes in the form's price field: hourly the rate per hour, fixed the total — `Connects` (the price to apply from the preview, else the card's).

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

`Milestones` only for fixed price; their amounts add up to `Rate`; if the guide holds the split back until the client answers, one milestone for the whole price and a line under `Confirm`. `Attach`, `Portfolio highlights` and `Boost` follow the guide.

**Writing it.** The card's `Proposal` relation points to an existing row → `update_properties` with the columns, then `replace_content` with the body (a redo, the dashboard's Rewrite, a fresh draft over an old one). None → `notion-create-pages` into `proposals` with the columns and the body as `content`, `Job` = the card (the card's `Proposal` fills itself). A row already `Sent` is never rewritten: the proposal is out. Write plain text — never copy the backslashes a fetch shows back into the page.

Before writing, read the proposal once as the client would and check it against the guide's "never" list; every claim about past work must be traceable to the guide's portfolio or the user's profile.

## 5. When it ends

- **Subagent of an hourly run**: return to the caller one line per card, the keywords in English and the reason in `language`: `#<short id> apply — <Advice why>`, `#<short id> skip — <reason>`, or `#<short id> skipped — <reason>` when auto skip moved it. No message, no push: the hourly run reports.
- **The drafts task** (started from the dashboard): scheduled run, automatic mode, but the user is looking at the dashboard, so no push and an empty final reply.
- **Chat**: one line per card with the advice; for Apply say the proposal is in Proposals and on the dashboard, and offer the full package in chat (`references/chat.md`) if the user wants to edit it here.

Off limits here: `confirm_preview`, `send_message`, any write to Upwork beyond the preview; `PROCESSED_UNTIL`; Runs.
