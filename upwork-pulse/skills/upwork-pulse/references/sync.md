# Proposals sync — what the user sent, into Proposals

Brings every proposal the user submitted on Upwork into the Proposals database, as Upwork stored it, and marks its job Applied. It runs at the start of every digest (`references/digest.md`), after a proposal is sent from chat, and on command ("sync proposals", "sync proposals for the last 3 months" — `references/chat.md`). It reads Upwork and writes Notion only; nothing goes to Upwork.

## 1. Which proposals

Its own watermark, like the hourly search's: the line `PROPOSALS_SYNCED_UNTIL: <ISO time>` in **Run state** — everything sent before it is already in Proposals. No line → the last 24 hours.

1. Note the time now (the new watermark).
2. The start: the watermark − 10 min (the overlap catches one sent while the previous sync was writing), or the start of the period the user named.
3. `list_freelancer_proposals` `list` for each status that returns proposals — `Accepted`, `Activated`, `Offered`, `Archived` — all in one turn (`Hired`, `Declined` and `Withdrawn` always come back empty from this connector, and a proposal whose client hired someone else is put on hold and left out of every list: such a one reaches Proposals only when it was sent from chat, which writes it itself), `sort_field: "CREATEDDATETIME"`, `sort_order: "DESC"`, `limit` 10; take the next page (`cursor`) only while a page's oldest proposal is still after the start. Keep the proposals created after the start. Usually none: go to step 5.
4. Write each one (§2).
5. Set the line to the time from step 1 — but only if this sync covered everything from the old watermark to now (a period the user named that starts later leaves it alone) — with `update_content` on that line only; no line yet → `insert_content` at the end. A sync that fails or stops early leaves it, so the next one picks up what was missed.

## 2. Writing one proposal

Only when at least one proposal is left, read `proposals_sent`, `proposals_open` and `jobs_all` once each. Per proposal, in this order:

- **An old conversion**: a row in `proposals_sent` with this `Job ID` and `Proposal ID` `unknown` is this proposal's row — write the real `Proposal ID` to it and treat it as the draft row below (card, columns, body).
- **Already in place**: a row in `proposals_sent` with this `Proposal ID` → skip it. Chat writes it when it sends, and the overlap brings a few back.
- **Read it**: `list_freelancer_proposals` `get` — the text, answers and files as stored, the terms (the price) and the boost.
- **The card first**: the one in `jobs_all` with this `Job ID` → `Status` Applied, `Decided on` = the proposal's created time, `My $` = the price sent (hourly: the charge rate; fixed: the total) — the price sent is the price (SKILL.md → *One fact, one place*); a card that was Skipped also gets `Skipped by` and `Skip reason` cleared. No card (applied to outside the pipeline) → `find_jobs` `get` and create one with the columns of `references/hourly.md` §5, `Status` Applied, `Decided on` and `My $` as above, no verdict, score, advice or body; the job is gone (`get` says not found or private) → only `Title`, `Job ID`, `Link`, `Found` now, `My $`, `Status` Applied, `Decided on`. Every proposal gets a card: the money and the dates live there.
- **The row**: the one in `proposals_open` with this `Job ID` (a draft that was sent) or a new one with `Job` = the card (the relation is two-way: the card's `Proposal` fills itself). Columns: `Proposal ID`, `Boost` = the stored connects bid (empty when not boosted), `Written` = the proposal's created time, `State` cleared (`null`), and on a new row `Title`, `Job ID`. Body (`replace_content` on a draft, `content` on a new row): what Upwork stored, in the sections of `references/drafts.md` §4 — `Milestones` kept from the draft (Upwork does not return them), `Cover letter` exactly as returned, `Screening questions` with the answers as sent, `Attach` with the attachment names. No `Confirm before sending`, `Portfolio highlights`, `Boost` or `How it was written`: it is no longer a draft.

A named period can mean dozens of proposals, each a `get` and a few writes. Above 20, say the number once and go on unless the user stops you — nothing is written to Upwork, so there is no go to wait for.
