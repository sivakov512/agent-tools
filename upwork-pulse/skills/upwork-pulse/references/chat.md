# In chat

Everything the user does by hand with the pipeline: look at a posting, get an estimate, draft and send a proposal, set a card's status, ask about connects. The user's own rules for content — what to take, how to price, how to write — are in Search rules and Proposal guide; read the one the scenario needs before acting, every time, since the user edits them.

## Looking at a posting — "what about #584350?", a link, "is this worth it?"

Fresh data first (SKILL.md → Finding things): `find_jobs` `get` on the job. Then the link, and an assessment by Search rules with the card structure — what's needed, complexity, risks, to clarify, estimate — as prose, with the fresh numbers: proposals now vs on the card, hired, connects to apply. When the job has a card, write the facts that changed back to it (SKILL.md → *One fact, one place*), in one `update_properties`; the estimate only if it changed.

If the card does not exist and the verdict is Take or Maybe, offer to create it (hourly card format); do not create it silently.

## A job's chat — opened from the dashboard

The dashboard's Claude chat link starts a Cowork chat with one message: `Job: <title> — Upwork Pulse, job #<short id> (Job ID <id>)[, contract <id>]. Load it with the upwork-pulse skill.`, or, for a conversation with no job, `Conversation: <client> — Upwork Pulse, Upwork room <id>. Load it with the upwork-pulse skill.` The type and the name come first because the app titles the chat from them. `Load it` means everything below — the card, the proposal, the contract and the conversation (step 2) — and nothing more: what to do next is the user's to say. Every later click on that job — its lead, proposal, contract or conversation — opens this same chat, through the card's `Chat`; the ▾ beside the button starts it over with `Its old chat is gone: this is the job's chat from now on.` between the ids and `Load it…`. So the chat is the job's thread: keep it about this job, and answer whatever the user asks in it as usual.

1. **Claim the card first** — right after the config check (SKILL.md → Finding things), before loading anything — so a second click lands here. This session's own link is `https://claude.ai/code/session_<id>` — the session id is in the session's context (Cowork gives it, e.g. in the line it asks to end commits with); never guess it. Find the card by Job ID (SKILL.md → Finding things).
   - `Chat` empty → write this link to it (`update_properties`, `Chat`).
   - `Chat` already holds another session's link → this job has its chat: one line with that link ("this job already has a chat — continue there: <link>") and stop; write nothing. When the first message says `Its old chat is gone: this is the job's chat from now on.` (the dashboard's ▾ → New chat), or the user says so in this chat (the old one is deleted or lost) → write this link over it, without asking.
   - No card (a contract from before the pipeline, a job found elsewhere) → create it from `find_jobs` `get` with the columns of `references/hourly.md` §5 and `Chat` = this link; `Status` New, unless a proposal was sent — then write it as the sync does (`references/sync.md` §2: the card Applied with the price sent, and the Proposals row).
   - No link of its own in the session's context → load and answer anyway, and say in one line that the dashboard will not reopen this chat.
   - A conversation with no job: there is no card; nothing to claim.
   - An update holds the pipeline (`updating` in the config, SKILL.md → Pipeline update): no writes now — load and answer, and say in one line that the chat could not be kept on the card yet; a later click on the job starts another chat.
2. **Load everything**, in as few turns as the calls allow: the card (properties and body) and its Proposals row; the posting fresh (`find_jobs` `get`; what changed goes back to the card as *One fact, one place* says); the proposal on Upwork (`list_freelancer_proposals` `get`) when there is one; the contract (`list_contracts` `get` by the id given, or found by the job) with its milestones; the conversation — the room given, the contract's room, or the proposal's (`get_messages` `find_room`) — its latest messages (`list_messages`).
3. **Reply** in `language`, short: what the job is, what was proposed and at what price, the contract and its milestones if any, the last messages and whose turn it is. Nothing more: what to do next is the user's to say in this chat. Sending anything to Upwork follows the rules as everywhere (SKILL.md → Rules that protect the user).

## Skip and applied — "skip it", "not this one", "already applied"

- "Skip", "pass", "not interested" about a posting → `Status` Skipped on its card, without asking, with `Skipped by` manual, `Decided on` now, and `Skip reason` only when the user gave one or one came up in this conversation — never a question just to get one.
- "Applied", "sent it", "I responded" → `Status` Applied, `Decided on` now; no card yet → create one with the posting's data, then set Applied. What was sent reaches Proposals with the next sync (or "sync proposals" now).
- Undoing: "put it back", "unskip" → `Status` New, and clear `Skipped by`, `Skip reason`, `Decided on`.
- "Lock #584350", "don't auto-skip it" → `Locked` checked; "unlock" → cleared (SKILL.md → *Locked*). Reply `#584350 → Locked` / `Unlocked`.

Reply with one line: `#584350 → Skipped` (with `: <reason>` when there is one).

## Drafts — "draft #584350", "redo the draft for #584350"

Only for these short commands to fill a proposal for the dashboard. "Write a proposal" and "apply to this" are **Proposals** below: the whole package in this chat. Drafts mode (`references/drafts.md`) for that card, here in the conversation: fresh data, advice, and for Apply the proposal written to Proposals. It works whatever `auto_drafts` says — asking is the decision — and the card gets `Locked` (SKILL.md → *Locked*): its advice is for the user to act on, not for auto skip. On Sonnet, say once that drafts are written for Opus and the text will drift from the guide; do it anyway if the user insists.

## Proposals — "write a proposal", "apply to this", "respond to the invitation"

Read the **Proposal guide** first and follow it for the text, the portfolio selection, attachments, screening answers, rate and boost. Whatever it says wins over this section. What this section fixes is the mechanics and the guard:

1. **Fresh data**: `find_jobs` `get`. Check whether the client has already hired the number sought, whether there are screening questions, and the current connects price. The facts that changed go back to the card, with `Locked` checked (the user asked about this job: SKILL.md → *Locked*), and when you price the work again, the estimate too (`My hours`, `My $` and `Estimate` in the same call — `references/hourly.md` §5) — SKILL.md → *One fact, one place*. If the job already has a proposal in `proposals_open` (`State` Ready), start from it — the user may have read it on the dashboard — and change what the fresh data or the user's remarks require.
2. **Preview, not submission**: gathering the form data (`manage_proposals` create → preview: screening questions, bid statistics, boost) is not a submission and costs nothing; do it as part of this request without asking. First `list_freelancer_proposals` `invitations`: an invitation to this job uses `accept_invitation` instead of `create`. If the preview is blocked, build the package from `find_jobs` `get` and mark screening and boost as unavailable.
3. **One package, one message.** The message starts with the `Fresh data:` line — no greeting, no preamble, no "here's the proposal" — and follows this order with these labels, plain text (no bold on the numbers), because the user reads it on a phone, opens the link to check the posting and says "ok" or "send it"; anything before the package pushes the text they need to read below the fold:

```
Fresh data: proposals <N> (<M> at find time), hired <N>, <N> connects to apply.
<link to the posting>

**Proposal text:**

<code block with the full text>

**Rate:** <$N/hr in the form field | fixed $N, and how it is split, if the guide says>

**Screening, drafts:**   ← only if there are questions
1. *<question as posted>* → <draft answer>
2. *<question>* → ⚠️ check: <draft + why it needs the user>

**Boost:** <N> connects to apply, balance <N>. <no auction | auction: …>. Recommend: <boost to <slot> | no boost> — <one phrase why>.

**Files:** <which, by the guide's file names | none needed>

```

   Before replying, read the draft reply once as the user will. It starts with `Fresh data:` — anything above it (a verdict, a summary of your work) or between the blocks pushes the text down on a phone; a concern about fit fits into the Fresh data line in a few words. The proposal text breaks none of the guide's "never" lines. Every claim about past work can be pointed to in the guide's portfolio lines or the profile — a client who asks about a detail you added and the user never did will stop trusting the rest; what is missing becomes a question to the client instead. The package around the text is in `language`; only the proposal text and screening answers follow the posting's language.

   The package also goes to the job's row in Proposals (`references/drafts.md` §4 — the same columns, sections and create-or-replace; `State` Ready, `Written` now), and its price and hours to the card (`My $`, `My hours`, `Estimate`, in one call — drafts §3) in the same turn, and again after every edit — so the latest version is in Notion even if the user sends it from the dashboard or the website. No card yet (an invitation, a job found outside the pipeline) → create one first, as the hourly run would, with `Status` New.

   Then nothing — wait. Any time you show the full text again (an edit, the final), put the link right above it so the user does not scroll for it.
4. **Send only on the user's plain "send it"** about this proposal, in this conversation. Right before, name the total once more: connects for the application, boost separately, balance after. Attachments are uploaded only after the package is approved, with the mechanics Field notes describe. If the platform cannot take the shape the guide asks for, say so and hand the user what to paste into the web form.
5. **After sending**: write this proposal exactly as the sync does (`references/sync.md` §2, the `get` of the proposal just sent): the Proposals row becomes what Upwork stored, including the boost it actually took; the card Applied. Then one line to the user with what was sent and what it cost.

Never guess a fact for a screening answer or the text: profile, portfolio, cards and what the user said in this conversation are the only sources. Where an honest answer depends on something only the user knows, mark the draft ⚠️.

## Proposals sync — "sync proposals", "pull my past proposals"

`references/sync.md`: no period → from its watermark, as a digest would; a period the user names ("for the last 3 months", "all") → from that start. Reply with one line: how many proposals written, how many of them for jobs the pipeline never saw, how many already in place.

## Connects — "how many connects", "what's my balance"

`get_freelancer_financials` `connects_balance`: balance (free / paid), and the recent history, paged with the cursor while it covers the period asked. Purchases are not spend; refunds are shown separately from spend.

## Rules the user states in chat

"From now on skip anything with X", "always ask about Y", "the rate is Z" — a confirmed rule goes into Search rules or Proposal guide as one line refining the existing item, right away (SKILL.md → Questions and quirks). An unclear case the user did not decide becomes a question row, not a rule.

## What stays off limits here

Sending, boosting, messaging or saving anything on Upwork without the explicit go for that action; moving `PROCESSED_UNTIL`; editing Runs.
