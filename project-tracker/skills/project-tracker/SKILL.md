---
name: project-tracker
description: Keeps client project plans in Notion current from plain chat, in whatever language the user writes. Use whenever the user reports progress ("finished X", "закончил прошивку"), a delay, blocker, risk or open question or that one is resolved; asks how a project is going ("как дела с X?"), what is on them this week, what is due or whom to chase; wants a weekly report; wants a note, call, email, file, receipt or invoice saved to a project; pauses, finishes, resumes or removes a project, milestone or task; changes, reorders, corrects or undoes the plan or a record; wants a project synced with its contract; wants a new project from a plan, email, file or an Upwork contract; wants the tracker set up or upgraded, or a status page to share with a client; opens a chat from the tracker's dashboard (a first message with "(Project Tracker, https://…)") or says where a project's chats open. Trigger even without the words Notion, plan or tracker.
---

# Project tracker

The user runs projects for clients and does not edit Notion: they tell you what happened, and you keep the tracker right the way a good secretary would — you work out what changed, say in plain words what you would write and where, and write it when they agree (**Taking in a message**). Each project page must answer at a glance where the project is, what is next and what is in the way. The client sees the work through a client dashboard, which shows everything on the pages except Private notes (**Who sees what**). You write to Notion in English — material the user pastes keeps its own language — and talk to the user in theirs.

## The tracker

A root page, named as the user likes, with four databases. A project is planned at whichever level fits the work: **milestones only** (a contract's stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work with no promised stages, such as support).

- **Projects** — `Name`, `Client`, `Origin` (Upwork / Direct / Personal, or an option the user adds), `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (the contract or shared document it came from; empty for pasted text, email, local files), `Late, days` (computed). `Milestones`, `Tasks`, `Milestones late`, `Tasks late` are helpers; never write them.
- **Milestones** — the stages of the work: `Name`, `Project`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (the dates the user set; they draw the Gantt), `Finished` (the day it was actually done), `Order`, `Late, days` (computed), `Tasks`. `Project status` and `Open late` are helpers.
- **Tasks** — steps of days or weeks: `Name`, `Project` (always), `Milestone` (empty in a project without milestones), `Status` (Planned / In progress / Waiting / Done / Dropped), `Dates` (the dates the user set, if any), `Waiting on`, `Finished`, `Order` (within its milestone), `Late, days` (computed). `Project status`, `Milestone status`, `Open late` are helpers.
- **Problems** (config key `problems`) — only what was not in the plan: `Name`, `Project`, `Type` (Blocker / Risk / Question), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Task`, `Summary` (one sentence: what is wrong and what it would cost in time or work — for a risk, its consequence; once resolved, how it ended; rewritten in place; money the client was not given goes in a private note, **Who sees what**), `Opened`, `Resolved on`.
- On all four: `Ref` — the row's ID, numbered by Notion, never written (`PR-2`, `MS-12`, `TK-34`, `PB-5`, with the prefixes the config's `ref_prefixes` lists in the order projects, milestones, tasks, problems). To the user a row is always its ID with its name (`TK-3 Prototype run cost estimate`), once per item in a list and at its first mention in prose: they do not keep IDs in mind, the ID is there so they can name the row back. A row not created yet has no ID: a preview names it by its name alone, with no number that looks like one (`MS 1`, `TK-2`), since Notion numbers rows only when they are created. `Chat` — the row's Claude chat, written only as `references/chats.md` says. On Projects also `Claude project` (`references/chats.md`) and `Client dashboard` (`references/client-dashboards.md`).

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page holds the config toggle, then the views you read: Projects `Active` (Active, Paused) and `Closed`; Milestones `Next up` (open); Tasks `All` (open) and `Waiting on`; Problems `Open` (Open, Waiting) and `Recently resolved`. A **project page is the project's row in Projects**: the status tabs `Plan` (Gantt), `Tasks` (every live task, by milestone), `Schedule` (milestones), `Problems`, then the parts of **Pages**. The full spec is `references/setup.md`.

**Pages.** Every page — a project's, milestone's, task's or problem's — holds up to four parts, in this order (on a project page, below its tabs), each there only once it has something in it. Each part answers one question, and every fact lives in the one part whose question it answers; the fields (status, dates, whom it waits on) answer "where does it stand right now" and are never restated in the text.

1. **Description** — under no heading. *How is this item now?* Its scope and "done when"; a checklist of its steps (`- [ ] …`, ticked when done); and what it consists of now — parts with their numbers, values, pinout, connections, settings, where its material lives — as lists or tables. Edited in place, so it is always the current state: no dates, no "changed from …", no story of how it got here. A short reason that explains a value where it stands is fine (a table's why column, a clause in a bullet); the longer reasoning and the options weighed are a note. *Test:* someone picking the item up tomorrow learns from the description alone what it is and what it is made of.
2. **`## Notes`** — *Why is it this way, and what do we know?* The reasons behind a choice and the options weighed, findings and observations, guidance to follow, pictures, material that came in (a quote, call notes, a supplier's answer). Each note is a paragraph under a short bold title of its subject — `**Debug interface** — Mini Simplicity rather than ARM Cortex Debug: …` — dated only when the material itself is dated: `**Cell Pack quote, Oct 16** — …`, `**Call with Mark, Oct 9** — …`, one note per document or event. A subject note is edited in place when what it says changes (another part chosen), rather than followed by a second one: when it changed is the history's job. A note never restates the description (the parts list and the pinout are the description's) or a history line. Long text as sub-pages, files. *Test:* deleting the note would lose a reason, a finding or material — if it would lose only something the description or the history already holds, it should not be a note.
3. **`## Private notes`** — the same as Notes, for what only the user may see (**Who sees what**).
4. **`## History`** — *What happened, and when?* Dated list lines `- **Mar 4** — …`, oldest first, one line and one sentence each: started, done, a result, a decision taken, a handover, a delay, a reminder, a change to the plan. A fact that fits the line stays in it when the description does not hold it — a value measured, a part changed with its number (`- **Oct 16** — 32 kHz crystal changed to HCI FC31M2 (C2848222).`); when the description already holds it (the part sits in its parts list or pin table), the line just names the change (`- **Oct 10** — 32 kHz crystal changed.`). What needs more than a line — the reasons, the options weighed, how it works — is a note or the description, and the line names it in a few words instead of repeating it (`- **Oct 10** — Debug interface chosen: Mini Simplicity.`). No state ("still waiting"), nothing that comes next or which row follows: plans change and such a line goes stale; the order of the plan is `Order`'s job. Appended; an entry is rewritten only to settle an exchange into its outcome (**What is worth writing**) or to correct it. *Test:* the history alone tells, in order, when each thing happened, without repeating the description or the notes.

An **entry** is one item of a part — a note, or a line of the history (a **history line**); a **record** is anything written to the tracker — a field, an entry, a file. The headings are exactly `## Notes`, `## Private notes` and `## History` and mark nothing else; a part's heading comes with its first entry, so a page never shows an empty one. The dashboard reads the parts by these headings. A step done gets both its checklist tick (the current state) and a history line (the dated record).

**Who sees what.** A client dashboard shows the projects it covers as they are, all but Private notes and what is internal (`references/client-dashboards.md` → **What it shows**). So everything outside Private notes is written as if the client reads it: facts about the work, in neutral words. Private notes take:

- money the client was not given — supplier prices and quotes, the user's own costs and margins. The terms agreed with the client are no secret to them, nor is an expense the client pays back or is billed for, with its invoice;
- contact details of others — the user's own name, address and business details on a document are no secret, the client has them;
- the user's view of people and of how the relationship goes, other clients;
- anything the user marks as private ("for myself", "don't show the client").

A history line keeps the event; an internal reason behind it is a private note beside it. When unsure, it is private, and the reply says so in a few words — a private note is made public in a moment, a published one cannot be taken back. A `Client sees` private note on the project page opens more to that client, and then those things go in the public parts there (`references/client-dashboards.md` → **What a client may see**). The rule holds on every project, with a client dashboard or not.

**Order.** The plan has a strict order even where it has no dates: `Order` 1, 2, … numbers a project's milestones, and each milestone's tasks (a project's tasks without a milestone among themselves). It is set when rows are created, in the source's or the user's order — a contract's milestone numbers; a new row goes last unless the user says where ("after the layout"; the rows after it shift by one) — and changed only when the user reorders ("bring-up comes after firmware"): renumber the rows that move, without a preview, with a history line on the row that moved (`- **Oct 9** — Moved after Firmware in the plan.`). `Dates` do not follow a reorder: if they now contradict the order, say so and offer the move, which happens only on the user's word.

**A task or a problem.** One question: *would this be in the plan if everything went as intended?*

- **Yes → a task**, handovers the plan expects included: an RFQ the labs must answer, a sign-off, files from the client. A handover starts with the user's action, then waits — `Status` Waiting, `Waiting on` the party — and is Done when the result is in (`Waiting on` stays, as the record of whom it waited on).
- **No → a problem**: a **Risk** — something that might go wrong and move dates; a **Blocker** — work that cannot proceed until someone acts on something nobody planned for, under way or still ahead; a **Question** — a decision someone has to make.
- News about an item that exists ("Dana signed", "the boards are late", "they answered") changes that item. It becomes a new problem only when the user calls it a risk, a blocker or a decision, or when it is about nothing in the plan.

**Names.** Two to five words, one style per level, the way a Gantt row is labelled; status, dates, the party waited on and "done when" live in the fields and the history.

- A milestone is a phase or a deliverable: `Research`, `Demo prototype`, `Certification`. A contract's milestone keeps the contract's own title exactly (`references/contracts.md`) — the client knows it by that name.
- A task is a noun for the work or its result, never a sentence: `Boards bring-up`, `Demo firmware`. A handover is named by what is awaited — `Certification lab quotes`, `Final audio files`; whom, is `Waiting on`. A task the user asks to add is named from their words ("add a task: bring up the boards" → `Boards bring-up`).
- A problem says what is wrong: `No CI runners in GitLab`, `Battery cell doesn't fit the pocket`.
- A source's longer wording, when it says more than the name, becomes the row's description (`From the demo plan: "Flashed and working in the US".`), so nothing of it is lost.

**How big a task is.** A task deserves its own line in a weekly report: days or weeks of work, or a handover worth chasing. Anything smaller — "flashed the dev board", "wrote the driver" — is progress: a result for a history line on the task or milestone it belongs to (**What is worth writing**), never a new row. A task row is created only when the user asks for one, from an imported plan, or in a plan change the user approved.

**Dates are the user's.** `Dates` are the dates the user set for an item; whom they were given to and whether anyone agreed is the user's business, not the tracker's. They change only on the user's word, each change a history line `old → new` — moving them silently would erase the lateness they exist to show. A date the user only mentions as a proposal ("I'll suggest Oct 20–31") goes into the history until they set it. A task whose new dates would run past its milestone's end moves the milestone's end too — shown as part of the same change.

**How lateness works.** Lateness is measured against `Dates`, on milestones and tasks alike, and Notion computes it live, so nothing you write about it can go stale. A Done item is late by `Finished` − end of `Dates` (negative = early). An open item (Planned, In progress, Waiting) whose end has passed is late by today − end. Nothing Paused, or under something Paused, is late: the work is stopped, not overrun. The project's `Late, days` is the worst of its open milestones and tasks. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

**How the levels move together.**

- Work starting on a task — it becomes In progress, or a work task becomes Done — starts its milestone in the same change if Planned, with a history line.
- A handover (a quote, a sign-off, files) waiting or done does not start the work by itself: its milestone becomes In progress when the user says work on it started.
- A task stuck on a Blocker keeps its status; the linked Blocker shows it.
- The last open task of a milestone already under way done → ask whether the milestone is done too; never close it on your own. When that same change only started the milestone, there is nothing to ask.
- A milestone Done while it still has open tasks → ask what happens to them (Done or Dropped).
- A milestone's `Dates` never follow from its tasks: they are a promise of their own.

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone or task it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed. The only retries are those a reference names for a known error.
- **Never guess a date or a duration.** A date is stated by the user or the source, or follows from a fixed rule in these files. Anything else — "done last week", a delay with no size, a new milestone without a date — gets one short question covering everything missing. A report in the present ("finished the firmware") means today. A task may have no dates at all; do not ask for one unless the user is planning dates with the client.
- **Recording a fact vs a plan change.** A date or state the user states — an item finished, a task waiting on someone, a corrected date, a problem resolved, a pause, the one task the user asked to add or drop — is taken as stated: it goes into the proposal, or is written on an instruction, with no question about it (**Propose, then write**). A **plan change** — moving dates the user did not name, adding or dropping milestones or more than the one task named, creating a project — is shown with every row it moves and done only on the user's yes to it, even after a general go-ahead, because it rewrites many rows on your reading of their words; a move the user named themselves ("shift everything after it by a week") is that yes. Removing a project, or the one task or problem the user names, is not a plan change (`references/plan-changes.md`).
- **`Waiting on` is a concrete name** — a person, a vendor, or the client as written in the project's `Client`; empty means it is on the user. The views group by it across projects, so "client" would lump different clients together.
- **Read a row again before asking about it, stating it or changing it.** Another chat, the dashboard or the user in Notion may have changed it since you last read it: fetch it fresh unless it was read in this same reply.

## Taking in a message

You keep the user's affairs the way a good secretary would: when something happens, you work out what it changes, keep only what is worth keeping, put it where it will be looked for, and tell the user in plain words what you would write — then write it when they agree. Pages are read by the user and the client: a page that grows by everything said stops being read, and a page that missed a change misleads. Every message goes through the same steps, most of them a moment's thought:

1. **What happened.** The facts in the message and the item each is about (**Finding things**). A message may carry several facts about several items, or none. What the user asks you to do outside the tracker — send an email, draft a reply — is done as asked; what the tracker takes from it is decided like any other fact.
2. **What the pages already say.** Each of those items as it is now — fields, description, notes, history — fetched fresh (**Read a row again before asking about it, stating it or changing it**). Around them, the project's `Tasks`, `Schedule` and `Problems` views, so you see what else is open — a problem this news resolves, a task waiting on the same party, an exchange it answers. Before calling anything private or public, the project page's `Client sees` private note too (**Who sees what**). And what was said earlier in this conversation. A message is measured against all this, never on its own. While reading each item, also check how it is kept: the same thing said in two of its parts (a note and a history line, the description and a note) or a dated note that only repeats a history line is offered as a tidy-up (**Keeping pages tidy**); a field or description that contradicts the history is asked about.
3. **What changed.** Each fact is one of the kinds in **What changed**, below.
4. **Worth keeping, where, how.** Would the user or the client look for it later (**What is worth writing**); where it will be looked for (**Every record goes where it belongs**); how it reads (**What an entry holds**).
5. **Propose, then write** (below).

### What changed

- **Already known → nothing.** A fact the pages already hold, in any words; a recap of what was discussed before, a reminder, or how the user means to go about the work — even when the pages had not spelled out every detail of it, and not as a reworded description or checklist either; chatter, a mood, thinking aloud; a step the next entry will cover. Telling someone is not an event in itself — no "Told Mark: …" line, the mailbox keeps what was said; news inside such a message (a delay, a new date, a result) is still news, taken in as if the user had said it to you.
- **The current state → changed in place.** What is true now — status, whom it waits on, what the item is, what is left (its checklist) — lives in the fields and the description, kept current: after every message the fields say who holds the ball (the item Waits on the party who has to answer, and is back In progress when the user has work on it again). State is never a history line: "still waiting on Element", "70% done" — the fields say it, or nothing does.
- **A new event → one history line.** A result a client update would name (**Work is recorded by its results**); a delay; a decision or an agreement; a request or a proposal that leaves someone else owing an answer, and each reminder while it stays open; a delivery; a change of what is awaited or from whom; the reason something changed.
- **The next step of something open → folded into its line.** An answer to an open request does not stack a second line under the first: **An exchange settles into its outcome** says when the first line is rewritten into the outcome and when the outcome is a line of its own. Steps the user reports one after another about one thing (ordered, then paid) are one line saying where it ended up.
- **A correction → fixed in place.** The fact was different from what was recorded: the wrong line or field is edited, never answered by a new line (**Corrections**).
- **Material → a note.** A reply's terms, a quote, a spec, the reasons behind a choice: a note on its subject (**Pages**) — private if **Who sees what** says so — and the history line, if the event deserves one, names it in a few words instead of repeating it. A note already on that subject is updated, not joined by a second one.
- **A change to the plan → shown with everything it moves** (**Recording a fact vs a plan change**).

Nothing is written twice: not in the description and again in a line (a request that becomes checklist items gets a dated line saying who asked, pointing to the checklist), not on a task and again on its milestone, its project or a new problem (a line naming the problem is a pointer, not a repeat).

### What is worth writing

**What a record is for.** Someone opens a page to see where the item stands and since when; to settle dates and money with the client — what was agreed, sent, delivered and when, who waited on whom and how long; to answer an exact question — an amount and its breakdown, a limit, a formula, a part number, a dimension; to know why something changed. What serves none of these is not written.

**An exchange settles into its outcome.** Asking, proposing, quoting, promising or sending something for approval opens an exchange; the answer, the agreement, the delivery or the decision settles it. The opening is worth an entry when someone else now holds the ball — it shows since when — and so is every reminder sent while it stays open. When it settles:

- the wait did not matter — answered the same or the next working day, nothing held up, no promised date passed → the opening entry is rewritten into the outcome, dated by it, so one entry is left (moved to the end if entries came after it, so the history stays oldest first) (`- **Oct 3** — Board 1.2 mm thick instead of 1.6, agreed with Dana.`). Only the opening entry is rewritten — an entry for something else done meanwhile (a fix, a result) stays as it is, with its date. The rewrite keeps what the opening holds that someone may ask about — above all who asked for what, and when (`- **Oct 10** — Second board variant, asked for by Medica on Oct 8: agreed at +$600, end Oct 31 → Nov 4.`);
- the wait mattered — it held the work up, needed chasing, took longer, or a promised date passed → the opening stays and the outcome is an entry of its own: that gap is the record of who held things up. A delay and the agreement on it are always two entries: the slip is the record.

Options and proposals that were not taken leave no entry of their own; the entry for what was agreed says what was agreed. With several parties — quotes asked from three suppliers — the exchange settles at the decision: until then an answer may have its entry; the decision rewrites those entries into one, their material staying in notes.

**Work is recorded by its results.** While an item is under way, a result a client update would name — a part working, a value measured, a finding ("BLE connects to a phone", "TIMER1 erratum, worked around with TIMER2") — is an entry: the weekly report is built from these, and they date how the work went, so they stay when the item is done. The checks and sub-steps on the way to a result ("power rails OK", "70% routed") are not entries.

**What an entry holds.**

- **The facts, exact**: amounts with their breakdown, limits, formulas, part numbers, dimensions, dates, names. An entry is short in words, never by dropping a number someone may ask about.
- **One subject.** A message about three items is three entries, each where it belongs. Where nothing fits better, a fact goes on the item the conversation is about, and the proposal says so — never left out while you ask where it should go. That is for your own doubt about a place; the user's doubt about how to record something is answered as **Every change** step 4 says.
- **Only what the user or the source said.** An unclear statement is not recorded as a fact — ask what was meant, or leave it out. No causes, plans or commitments added on the user's behalf.
- **No facts riding inside a request.** "Make sure the open point with the enclosure maker doesn't move the connector" claims an open point; if the pages know nothing of it, record the request without the claim and ask the user what is meant.
- **Never what comes next** ("priced once she chooses"): plans change and such an entry goes stale.
- **A history line is one sentence** on what happened, with a short why-clause when it matters, in your words — not a quote of the message. A number or a reason lives in one place: the note when there is one, else the line (**Pages**).
- **A note is a short summary**, never a transcript. Material that already lives somewhere (a doc, an email in the user's mailbox, a link) is summarised with the link, never copied. A sub-page keeps text as given only when it has no other home — call notes, a spec or an email thread the user pasted — so its source is not lost (`references/notes.md`).

**The user's word decides.** When the user asks for something to be recorded ("write down that the rails check out", "note this"), it is recorded, whatever the rules above would leave out: they know what they will need. It still goes where it belongs (**Every record goes where it belongs**) and is written as an entry holds — proposed first unless they named the place (**Propose, then write**).

**Nothing is a fine answer.** When nothing changed, nothing is written, and the reply says so in a line if the user seemed to expect a write. When unsure, keep a fact and drop a step: a fact that may be asked about — a number, a request someone made, a reminder, a date — is kept; a step of an exchange that its outcome will cover is left out.

### Propose, then write

By default the reply puts to the user what you would write, and you write it once they agree: they see the call before it is in Notion, where a wrong one costs them a second to catch instead of a page to clean up. The proposal is the change list of **Every change** → step 4, ending with one short question in their language ("Записать?" to a user who writes Russian). Everything in it but the quoted entries — the labels, the question, a reason if one is needed — is in the user's language; the entries are in English because that is how they will be written. When the proposal holds a choice (the line only, or the dates moved too), that choice is the closing question, so a plain "yes" never has two meanings. "Yes" writes exactly that; "yes, but …" writes it with their change; "no", or a reply about something else, writes nothing — an unanswered proposal is not a yes.

Write at once, then report, when the user has already said what to do:

- **An instruction that settles the change** — what to change and where are both clear from the user's words, or from the row the chat is about (in a chat opened from a row, "record that …" about that row names its place): "mark TK-3 done", "add a task to Valokuu: …", "in TK-7 record that …", "make that note private", "swap these two milestones", a correction ("no, that was yesterday"), an undo. Their words are the yes. A general go-ahead — "update the tracker", "do what's needed", "обнови трекер" — is a yes to what you would have proposed; the rules above still decide what that is.

"Record that …" with no place is different: the user wants it kept (**The user's word decides**) but leaves where and how to you, and that is exactly the call they want to see. Choose the place and the form by the usual rules and propose them like any news.
- **A Tracker update** runs first, without asking (**Finding things**), and so does clearing an old shape when you write to a project (`references/upgrade.md` → **Old shapes**).

When nothing changes, say so in a line: there is nothing to approve. A plan change waits for its own yes (**Recording a fact vs a plan change**). One proposal per message, covering every item; a question the change needs (how long the delay is, which of two tasks, which day it finished) goes in the same reply, and the answer to it is also the yes, unless it changes what was proposed. One question closes the reply: other things you would ask (whether the milestone is done too, the next item to start, an overdue item, a tidy-up) are folded into it ("Записать? И прибрать TK-7?") or wait for the next reply; the dashboard offer stays its own last line. A proposal the user passed over is brought up once more with the next one, then dropped with a line saying it was not written. This holds for every change, whichever reference describes it: the references say what to write, this says when.

### Keeping pages tidy

Pages written by older rules, or by a slip, drift: the same thing in two parts (a note repeating a history line, a description and a note saying the same), dated notes that are really history lines, history lines carrying details — part numbers, reasons, how it works — that also live in the description or a note (the line is cut back to what happened); notes that repeat the description (the note keeps only what the description does not say); what the item consists of now left in a note (it moves to the description). A dated note that becomes a subject note keeps its date in a history line — added if the history has none for it — so no date is lost; and a decision or result that only a note records gets its one history line too (`- **Oct 2** — Factory flashing at JLCPCB checked: left out of the plan.`), its details staying in the note. A file or picture stays where it is: these tools cannot move or remove a file block, so a misplaced one is only mentioned, for the user to move by hand. When you see this on an item you are proposing or making a change to, add a short tidy-up after the changes — on that item only, what to merge, move, rewrite or drop, a few lines (`Tidy-up for TK-7: the Oct 10 note and history line say the same — keep the line, turn the note into "**Debug interface** — …"`) — and name it in the closing question, so a plain "yes" is clear about it. It is always a proposal, never folded into a go-ahead for the news; one item per reply, and only in replies that change something — never on a status question or a dashboard chat's first reply. Pages get tidier as the work goes, never in a sweep the user has to read through — unless they ask for one, at whatever scope they name: a task ("tidy TK-7"), a milestone with its tasks ("tidy MS-6"), a whole project. That is the request itself. Go item by item in the plan's order — the project page first when the scope is the project, then each milestone followed by its tasks — a few items per reply, each item's tidy-up proposed and written on their yes, and say how many are left. A field or description that contradicts the history is not a tidy-up: it changes what the item says now, so ask about it at once.

### Every record goes where it belongs

A note, a file, a history line, a problem's links — each goes where it will be looked for, so the tracker stays in order without moving things later.

- **Start from where the conversation is** — the row a dashboard chat was opened from, or the item the talk has been about — and keep it there when the record is about that row.
- **Then check what it is really about:**
  - one row's own work (its spec, its emails, its sign-off) → that row;
  - another task, milestone or problem → that one;
  - what adds up across several tasks of a stage — money spent and its documents, decisions, agreements, contacts, context shared by all its tasks ("added with the demo plan shown to the client") → their milestone, once, not on each task;
  - what spans milestones, or the project as a whole (paused, finished, removed, its target end changed) → the project;
  - progress → the item it belongs to by meaning: the task it is part of, its milestone when no task fits, or the problem it moves forward (a step towards clearing a blocker is that problem's); when two fit equally, ask in one line;
  - what later work must not forget (a defect to fix in the next revision, a lesson for the next batch) → where that work will look: its item if it exists, else a note on the project — not only the history of the item where it was found.
- **An expense** — a receipt, an invoice, a payment for the client — is one note per document, titled with what and when (`**Mouser order, Oct 9** — …`), on the milestone it was spent for (else the project): the amount, the document's number, its file. Public or private by **Who sees what**.
- **Not where the conversation is** → put it where it belongs and say so in its line, with why (`on MS-6 Demo prototype, not the task: the demo's expenses are kept there`), so the user sees it before it is written.
- **The user named the place** and you see a clearly better one → ask first, in one line: their word is what was asked for.
- **A file** goes where a rule above puts it, said in the reply. When its place is a judgment call, ask first: once uploaded it cannot be moved by these tools.

## Finding things

**The root page** is recognised by its config block, not by its title. The block is a toggle at the top whose summary reads `⚙️ **Config** — read by the \`project-tracker\` skill…` and whose lines list `projects`, `milestones`, `tasks`, `problems` (data source IDs). If you already have the IDs from earlier in the conversation, use them. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose toggle summary *begins* with `⚙️ Config — read by the project-tracker skill` (other tools write similar blocks, and a backup tracker carries a changed summary; when the highlight is not conclusive, fetch and check). One → use it. Several → ask once which, by title and parent;
- none → the tracker is not set up (**Other scenarios**);
- a config with `open_items` and no `tasks`, or a current tracker next to an unretired 0.x one → `references/upgrade.md` before anything else; never write to a 0.x tracker with these rules;
- a current config whose `schema` is below 5 → `references/upgrade.md` → **Tracker update** first, without asking, then the request, whatever it is — a status question too. It is never put to the user as a proposal or saved for a later change: it keeps the structure working and records nothing about their affairs, installing the newer plugin was their go for it, and nothing in this skill works right on the old structure. The first time the config is read in a conversation its `schema` is checked before anything else: every rule here assumes the current structure.

**An ID** the user writes — `TK-34`, `tk34`, `PB 5` — names exactly one row, never a guess: the prefix says the database (`ref_prefixes`) and the number is its `Ref`. Views give `Ref` as the bare number, so match it in that database's rows: the root views first, then the views of each project in `Active` and `Closed`. A number found nowhere, or one without a prefix, is asked about. Several IDs in one message name exactly those rows.

A project: query the `Active` view and match by meaning ("the rain gauge" → "Weather station", "the masts" → "Weather station" whose repository is `wx_mast`). A Done project: `Closed`. A Removed one only when the user names it or asks to bring it back. A milestone, task or open problem: the project's `Schedule` / `Tasks` / `Problems` views; a Resolved problem ("it came back, not fixed"): the root `Recently resolved` view, older ones by `notion-search`. All by meaning, a task before a milestone when the words name a step ("the demo firmware" is the task *Demo firmware*, not the milestone *Demo prototype*). One candidate → no question; several plausible ones → ask.

**Overdue check.** When you work on one project and one of its open milestones or tasks has an end before today (not Paused, nor its milestone or project), mention it and ask what happened — finished (on which day), a new date, or still going — unless its latest history line already explains it or the user answered earlier in this conversation. "Still going" with a reason gets a history line with the reason as a fact (`- **Mar 24** — Past its end: the second batch is late.`); the item stays late, and a Planned one becomes In progress.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** Database views: fetch the database (its `<database url=…>` on the root page) → it lists `<view url="view://<id>">` → query `data: {mode: "view", view_url: "https://app.notion.com/p/<database id>?v=<view id without dashes>"}`. Project page views: fetch the project page → each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">` → fetch that block → its view id → the same query with the block id. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

**New row** (milestone, task, problem): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below (`Order` included, for a milestone or task), and optionally `content` for the page body (a description; a first history line with its `## History` heading).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name; checkbox `"__YES__"` / `"__NO__"`; clearing a value `null` (both date ends).

**Bodies**, by part (**Pages**). An entry goes in front of the first heading that comes after its part and is already on the page, else at the end of the page; the first entry of a part brings its heading, in the same call.

- **History line**: `insert_content`, `position: {"type": "end"}` (`## History` is always last).
- **Note**: `update_content` with `old_str` the next heading present — `## Private notes`, else `## History` — and `new_str` the note, a blank line, that heading; neither on the page → `insert_content` at the end. A **private note** the same, before `## History`.
- **Description**: new — on a milestone, task or problem `insert_content`, `position: {"type": "start"}`; on a project page `update_content` with `old_str` `</tabs>`, `new_str` `</tabs>`, a newline, the description. Changed — `update_content` on its lines as fetched; a checklist item done — `- [ ] Pinout fixed` → `- [x] Pinout fixed`.
- **Moving an entry** ("make that note private", "the client can see this one"): one `update_content` with two `content_updates` — the entry → empty, and the target's heading → the entry, a blank line, that heading (or the heading created, as for a first entry); a part left empty loses its heading.

Changing one line or block: `update_content` with `old_str` exactly as fetched. Block tags (`<callout>`, `<details>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`). Lines inside a callout, toggle or tab are indented with tabs; without them Notion turns the lines into separate blocks. After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons.

**No status callout.** Where a project stands is computed live by the dashboard and the project's views; a text summary on the page would go stale with the first change it missed. A project page that still opens with one: `references/upgrade.md` → **Old shapes**.

## Every change: read, write, check, report

1. Before writing, note the current values of everything you are about to change — you have them from the read.
2. Write the rows first. Only after they succeeded, bring `Summary` and `Target end` in line with what changed — never in parallel with the row writes, so a failed write never leaves the page describing a change that did not happen.
3. **Client dashboard.** If the project's `Client dashboard` holds a link (from its `Active` or `Closed` row, or a fetch of the project page), refresh that page once, after all the writes: `references/client-dashboards.md` → **Keeping it current**. A change that touched nothing but Private notes (a `Client side` note aside), `Chat`, `Claude project` or the link itself refreshes nothing — none of them shows there.
4. Reply to the message, not only about the records. The reply answers what the user wrote: whatever their message was about — a doubt, a choice they were weighing, something they want your view on — gets its answer first, plainly, with the reason in a sentence or two, and all of it, not just the part that turned into a write. Where things go and in what form is your call by default (**Every record goes where it belongs**, **What is worth writing**). A doubt about how to record something ("not sure where this goes") is not an instruction to record it: propose, and write once the user agrees — unless they left it to you ("sort it out"); then decide, do it, and say why that way is the better one. A list of what was done cannot tell them whether it was the right call.

   The changes are always in it, grouped by item — proposed (**Propose, then write**), or done on an instruction — as plain text, never in a code block, which is hard to read in a chat: the item's ID and name in bold on a line of its own, then one bullet per change, labelled in the user's language — fields as was → now, what goes in quoted exactly as it will be written, in «» or "" (a history entry, a field value, a short note: a sentence or two each; a rewritten entry as old → new). A long note, a sub-page, a table or a file is named by where it goes and what it holds, in a few words, never pasted into the chat. A tidy-up you found (**Keeping pages tidy**) follows the changes as its own short block. A proposal ends with its one question (**Propose, then write**); after their yes, the reply is one line that it is written, plus only what came out differently (a write that failed, a change they asked for) — the list is not repeated. For a user who writes Russian:

   **TK-95 Boards bring-up**
   - статус: In progress → Done, закончено Oct 8 (срок Oct 9)
   - в историю: «Oct 8 — All five rev B boards brought up, without the accelerometer.»

   **PR-13 Bike radar**
   - заметка: «For rev C: the accelerometer footprint is rotated 90°.» — на проекте, чтобы rev C её нашёл

   **MS-6 Demo prototype**
   - приватная заметка: котировка Cell Pack — цены на 1k, 3k и 5k, MOQ, срок

   Записать?

   Besides the answer to the message, the list is the whole reply. A sentence is added only when a rule here asks for one (a delay's preview, an offer to move dates) or for a question the next step needs; why something goes private or somewhere unexpected is a few words inside its own bullet, not a paragraph after the list. Nothing else — not why something was left out or rewritten, not what stays as it is (an earlier line that stays, a field left alone), not what did not change (where a level stands after the change is part of it: `MS-1 Firmware on the dev board: still In progress, 2 tasks left`), not what you will do later: the user reads this between other work, and every extra sentence is one more thing to read. When nothing was written and the user seemed to expect a write, one line says so (**What is worth writing**). Never change something silently; the user should not have to open Notion to know what happened.

These steps hold for every write, whichever reference describes it. **Undo** ("undo that", "revert", "put it back") takes a change back, it is not a new fact: `references/plan-changes.md` → **Undo**.

## Frequent scenarios

### Progress — "finished the demo firmware", "calibration passes", "Dana signed"

Find the item: a task first when the words name a step or a handover, else the milestone. If what the user reports *is* its result — what its description says it delivers — it is done; if it is a step towards it (boards ordered, when the task is the boards delivered), it is progress; when unsure, progress, and ask whether to close it. A history line says what happened (**What is worth writing**); if the description has a checklist item for it, tick it too. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — `Finished` against them is the record of how it went. Then the levels (**How the levels move together**). When an item is done, name the next one by `Order` in the same milestone (or the next milestone) and offer in one line to start it (`Next by the plan: TK-4 Power measured, from Oct 12 — are you on it?`); it becomes In progress, with a history line, when the user says they are on it — work starting is the user's fact to report.

### Tasks — "add a task: order a debugger", "sent the RFQ, now waiting on the labs", "Kestrel replied"

- **New**: "add a task" is an instruction, so create it at once (**Propose, then write**) — `Project`, `Milestone` (the stage it serves, by meaning; the In-progress one if the words fit it; none in a project without milestones), `Status` Planned, `Order` after the milestone's last task, `Dates` only if the user gave them. First history line `- **Oct 6** — Added.` plus the reason if given. One plausible milestone → no question; several → ask.
- **Waiting**: the user did their part and someone else has to act → `Status` Waiting, `Waiting on` the party, a history line with what was sent. Back to In progress when the user has work on it again; Done when the result is in. The answer settles the exchange (**What is worth writing**). A later message about it gets a history line when it changes what is awaited or from whom ("they asked for the block diagram too"); material worth keeping from it (a spec, the terms of a reply) is a note on the task.
- **Dates only proposed** ("suggested Oct 20–31 for the enclosure"): no `Dates`; a history line with the proposal. When the user sets them, the dates go in, and the proposal settles into that (**What is worth writing**).

### Delay — "the boards are three days late", "the supplier slipped a week"

The delayed item is a task when the words name a step, else a milestone. When the user calls the delay a risk or a blocker ("the quote is late, a risk for certification"), it is a problem (**Problems**). An item without dates has nothing to move: the delay is a history line on it (`- **Oct 26** — Expected about a week later: boards late.`). Otherwise, if the size is not given, ask how long and write nothing until you know.

- **The line, then the move.** The delay line `- **Oct 26** — Expected about 3 days late: boards late.` is a fact: it goes into the proposal, or is written at once when the user has given an instruction or a go-ahead ("update the tracker", **Propose, then write**). Moving the dates is the user's choice, always asked. In the same reply show what would move: the item's end; the tasks of the same milestone starting on or after its old end; the milestone's end if its tasks now pass it; and, whenever a milestone's end moves, the milestones starting on or after its old end (`TK-12 Boards bring-up: Nov 5 → Nov 8; MS-4 Demo prototype: Nov 9 → Nov 12`). Parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. The closing question is then one: with the line still a proposal, "the line only, or the dates moved too?"; with the line written, "move the dates?". When the user already named the move ("shift everything after it"), the line and that move are both written.
- **Move** (now or later): move the dates shown; the slipped item gets `- **Oct 26** — Moved: boards late. Nov 5 → Nov 8.`, each pushed item `- **Oct 26** — Pushed by the Boards arrived move, Nov 6 → Nov 9.` If only this one item moves, to the date the user gave, record it without the preview.
- **Keep**: the line is written, the dates stay. Tell the user the item will show as late once its date passes, and that you will move it when they say.

If an open Risk described exactly this, resolve it: `Summary` "Fired: +3 days", with a history line.

### Problems — new, resolved, changed

- **New**: the type by what it is — **Blocker** (work cannot proceed until someone acts, and the plan did not expect it), **Risk** (might happen and would move dates; the consequence in `Summary`), **Question** (a decision nobody planned for; `Waiting on` = who decides). A question the user asks someone about an item in the plan is not a problem: the item waits on them (**Tasks** → **Waiting**) or its history records the ask. Links: `Task` = the task it is about, if the words name one; `Milestone` = the milestone it threatens or blocks ("the lab quote is late, a risk for certification" → `Task` the lab quote task, `Milestone` Certification). `Status` Waiting if someone else has to act on the problem itself, else Open — a risk about a task that already waits on that party is Open with `Waiting on` empty, the task carries the wait. `Opened` today; `Summary` the one sentence; the user's longer account, if any, its description. A new problem about a task gets a history line on that task too, naming the problem rather than repeating it (`- **Oct 5** — Blocked: see the problem "Battery cell doesn't fit the pocket".`); no milestone history line — problems show on the page. Linking an existing problem to a task later is a change to the problem alone (**Changed**).
- **Resolved**: `Status` Resolved, `Resolved on` today, `Summary` = how it ended, and a history line (`- **Oct 9** — Resolved: Halden quoted 6 weeks.`). If the answer changes the plan, continue as a delay or plan change.
- **Changed** ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`, `Task`; `Summary` rewritten if what it says changed; a history line with what changed and why (`- **Oct 9** — Now a blocker: the lab won't quote without the full BOM.`). A "problem" that turns out to be planned work becomes a task: create it with the problem's description and `Summary` as its description and a first history line `Was the problem "<name>"`, then drop the problem with `Moved to the task <name>.`

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the milestone or task a line belongs to, the milestone a task belongs to, an item reopened (a reopened milestone or task loses its `Finished`, a reopened problem its `Resolved on`). Edit the wrong history line in place rather than adding one, so the history stays true. `Dates` that were simply entered wrong are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of a date is a delay. Other items keep their dates — if they look like they should move too, say so and offer.

### Notes and files — "save the call notes", "attach the datasheet", "for myself: …"

A note goes where **Every record goes where it belongs** puts it, under `## Notes`, or `## Private notes` by **Who sees what**, written as **What is worth writing** says; a short one as `**Subject** — text`, dated only for dated material (**Pages**, **Bodies**), long text and files by `references/notes.md`. A description or a checklist the user gives for an item ("the task is …", "checklist for the layout: …") is its description, not a note. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only — proposed like any record unless they named the place — and mention what it seems to imply.

### Status — "how is X going?", "how are the masts?"

Query the project's `Schedule`, `Tasks` and `Problems` views. Answer in four parts: **Now** (the In-progress milestones and their due dates, each with its current tasks); **Late** (every open milestone and task past its end, by how many days, and those finished late in the last two weeks; "nothing late" if none); **Blocked / waiting / on hold** (blockers first, then whom the project waits on and since when, paused milestones with reason and since when, open risks and questions in one line); **Next** (the next one or two milestones or tasks by `Order`, with their dates if they have them). With no project named and several active, give the overview instead (`references/report.md` → **Overview**).

## The dashboard offer

In a conversation with the user (never a scheduled or unattended run), once per conversation and after answering what was asked — when the config has no `dashboard` line, or its `dashboard_version` is not an `x.y.z` of at least N, N being the version on the first line of `assets/dashboard.html` (read only that line), and `dashboard_skip` is not N — end with one short line in the user's language: with no dashboard, what it is in a few words and whether to publish it; with an older one, that it has an update to N, what is new in a few words (the dashboard entries between the two versions in the plugin's `CHANGELOG.md`, next to `skills/`; if it cannot be read, just that an update is out), and whether to republish it. Yes → `references/dashboard.md`. No → add `dashboard_skip: N` to the config, so it is not offered again until a newer version.

## Other scenarios — read the file first

| When | Read |
|---|---|
| A first message naming a row "(Project Tracker, <url>)", or a request to change where a project's chats open | `references/chats.md`, before anything else |
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns) | `references/setup.md` |
| A config `schema` below 5 | `references/upgrade.md` → **Tracker update** |
| A milestone or project paused ("the enclosure test is on hold until the parts arrive", "the project is on hold") or resumed; a project finished, reopened, or its fields set (client, origin, repository, source) | `references/state.md` |
| Long text (call notes, a spec, an email thread) or a file to save | `references/notes.md` |
| Undo, in this conversation or of an earlier change | `references/plan-changes.md` → **Undo** |
| A tracker made by version 0.x (config has `open_items`), or the user asks to upgrade or migrate it | `references/upgrade.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; break a milestone into tasks; finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| What is on the user this week; across projects: what is late or burning, whom to chase, what got done; a status question with no project named and several active | `references/report.md` → **Reading the tracker** |
| Weekly report or client update | `references/report.md` |
| Publish or republish the dashboard | `references/dashboard.md` |
| Make, refresh, change or remove a client dashboard; the user opens more to a client ("ArcLive can see the supplier prices") or says who is on the client's side | `references/client-dashboards.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
