---
name: project-tracker
description: Keeps client project plans in Notion current from plain chat, in whatever language the user writes. Use whenever the user reports progress ("finished X", "readings are coming through"), a delay, blocker, risk or open question or that one is resolved; asks how a project is going ("how is X going?"), what is on them this week, what is due or whom to chase; wants a weekly report; wants a note, call, email, file, receipt or invoice saved to a project ("note for myself: …"); pauses, finishes, resumes or removes a project, milestone or task; changes, reorders, corrects ("it wasn't fixed, it came back") or undoes the plan or a record; wants a project synced with its contract; wants a new project from a plan, email, file or an Upwork contract; wants the tracker set up or upgraded, or a status page to share with a client; opens a chat or Code session from the dashboard (a first message with "(Project Tracker, https://…)") or says where a project's chats open. Trigger even without the words Notion, plan or tracker.
---

# Project tracker

The user runs projects for clients and does not edit Notion: they tell you what happened, and you keep the tracker right the way a good secretary would — you work out what changed, say in plain words what you would write and where, and write it when they agree (**Taking in a message**). Each project page must answer at a glance where the project is, what is next and what is in the way. The client sees the work through a client dashboard, which shows everything on the pages except Private notes (**Who sees what**). You write to Notion in English — material the user pastes keeps its own language — and talk to the user in theirs.

## The tracker

A root page, named as the user likes, with four databases. A project is planned at whichever level fits the work: **milestones only** (a contract's stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work with no promised stages, such as support).

- **Projects** — `Name`, `Client`, `Origin` (Upwork / Direct / Personal, or an option the user adds), `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (the contract or shared document it came from; empty for pasted text, email, local files), `Late, days` (computed). `Milestones`, `Tasks`, `Milestones late`, `Tasks late` are helpers; never write them. `Views` (hidden): the project page's view links, `Tasks <url>; Schedule <url>; Problems <url>`, written only by `references/new-project.md` and the Tracker update.
- **Milestones** — the stages of the work: `Name`, `Project`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (the dates the user set; they draw the Gantt), `Finished` (the day it was actually done), `Order`, `Late, days` (computed), `Tasks`. `Project status` and `Open late` are helpers.
- **Tasks** — steps of days or weeks: `Name`, `Project` (always), `Milestone` (empty in a project without milestones), `Status` (Planned / In progress / Waiting / Done / Dropped), `Dates` (the dates the user set, if any), `Waiting on`, `Finished`, `Order` (within its milestone), `Late, days` (computed). `Project status`, `Milestone status`, `Open late` are helpers.
- **Problems** (config key `problems`) — only what was not in the plan: `Name`, `Project`, `Type` (Blocker / Risk / Question), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Task`, `Summary` (one sentence: what is wrong and what it would cost in time or work — for a risk, its consequence; once resolved, how it ended; rewritten in place; money the client was not given goes in a private note), `Opened`, `Resolved on`.
- On all four: `Ref` — the row's ID, numbered by Notion, never written (`PRJ-2`, `MLS-12`, `TSK-34`, `PRB-5`; the prefixes are the config's `ref_prefixes`, in the order projects, milestones, tasks, problems). To the user a row is always its ID with its name (`TSK-3 Prototype run cost estimate`), once per item in a list and at its first mention in prose: the ID is there so they can name the row back. A row not created yet has no ID: a preview names it by its name alone, never with a number that looks like one (`MLS 1`, `TSK-2`). `Chat` and `Code session` (the row's Claude chat and Claude Code session), and on Projects `Claude project` and `Code folder`, are written only as `references/chats.md` says; `Client dashboard` as `references/client-dashboards.md` says.

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page holds the config toggle, then the views you read: Projects `Active` (Active, Paused) and `Closed`; Milestones `Next up` (open) and `Done`; Tasks `All` (open), `Waiting on` and `Done`; Problems `Open` (Open, Waiting) and `Recently resolved` (the past month). Together they hold every open and done row, so a question across projects never walks the projects one by one. A **project page is the project's row in Projects**: the tabs `Plan` (Gantt), `Tasks` (every live task, by milestone), `Schedule` (milestones), `Problems`, then the parts of **Pages**. The full spec is `references/setup.md`.

**Pages.** Every page — a project's, milestone's, task's or problem's — holds up to four parts, in this order (on a project page, below its tabs), each there only once it has something in it. Each part answers one question, and every fact lives in the one part whose question it answers; the fields (status, dates, whom it waits on) say where it stands right now and are never restated in the text.

1. **Description** — under no heading. *How is this item now?* Its scope and "done when"; a checklist of its steps (`- [ ] …`, ticked when done); what it consists of now — parts with their numbers, values, pinout, connections, settings, where its material lives — as lists or tables. Edited in place, always the current state: no dates, no "changed from …", no story of how it got here. A short reason beside a value is fine (a table's why column, a clause in a bullet); the longer reasoning and the options weighed are a note. *Test:* someone picking the item up tomorrow learns from the description alone what it is and what it is made of.
2. **`## Notes`** — *Why is it this way, and what do we know?* The reasons behind a choice and the options weighed, findings, guidance to follow, pictures, material that came in (a quote, call notes, a supplier's answer). Each note is a paragraph under a short bold title of its subject — `**Debug interface** — Mini Simplicity rather than ARM Cortex Debug: …` — dated only when the material itself is dated (`**Cell Pack quote, Oct 16** — …`, `**Call with Mark, Oct 9** — …`), one note per document or event. A subject note is edited in place when what it says changes, not followed by a second one: when it changed is the history's job. A note never restates the description or a history line. Long text as sub-pages, files. *Test:* deleting the note would lose a reason, a finding or material that the description and the history do not hold.
3. **`## Private notes`** — the same, for what only the user may see (**Who sees what**).
4. **`## History`** — *What happened, and when?* Dated list lines `- **Mar 4** — …`, oldest first, one sentence each: started, done, a result, a decision, a handover, a delay, a reminder, a change to the plan. A fact that fits the line stays in it unless the description holds it — `- **Oct 16** — 32 kHz crystal changed to HCI FC31M2 (C2848222).`, but `- **Oct 10** — 32 kHz crystal changed.` when the part sits in the parts list. What needs more than a line — reasons, options, how it works — is a note or the description, and the line names it in a few words (`- **Oct 10** — Debug interface chosen: Mini Simplicity.`). No state ("still waiting"), nothing that comes next: such a line goes stale, and the plan's order is `Order`'s job. Appended; an entry is rewritten only to settle an exchange into its outcome (**What is worth writing**) or to correct it. *Test:* the history alone tells, in order, when each thing happened, without repeating the description or the notes.

An **entry** is one item of a part — a note, or a line of the history (a **history line**); a **record** is anything written to the tracker — a field, an entry, a file. The headings are exactly `## Notes`, `## Private notes` and `## History` and mark nothing else; a part's heading comes with its first entry, so a page never shows an empty one. The dashboard reads the parts by these headings. A step done gets both its checklist tick (the current state) and a history line (the dated record).

**Who sees what.** A client dashboard shows the projects it covers as they are, all but Private notes and what is internal (`references/client-dashboards.md` → **What it shows**). So everything outside Private notes is written as if the client reads it: facts about the work, in neutral words. Private notes take:

- money the client was not given — supplier prices and quotes, the user's own costs and margins. The terms agreed with the client are no secret to them, nor is an expense the client pays back or is billed for, with its invoice;
- contact details of others — the user's own name, address and business details on a document are no secret, the client has them;
- the user's view of people and of how the relationship goes, other clients;
- anything the user marks as private ("for myself", "don't show the client").

A history line keeps the event; an internal reason behind it is a private note beside it. When unsure, it is private, and the reply says so in a few words — a private note is made public in a moment, a published one cannot be taken back. A `Client sees` private note on the project page opens more to that client, and then those things go in the public parts there (`references/client-dashboards.md` → **What a client may see**). The rule holds on every project, with a client dashboard or not.

**Order.** The plan has a strict order even where it has no dates: `Order` 1, 2, … numbers a project's milestones, and each milestone's tasks (a project's tasks without a milestone among themselves). It is set when rows are created, in the source's or the user's order — a contract's milestone numbers; a new row goes last unless the user says where ("after the layout"; the rows after it shift by one). A reorder the user asks for: `references/plan-changes.md` → **Reorder**.

**A task or a problem.** One question: *would this be in the plan if everything went as intended?*

- **Yes → a task**, handovers the plan expects included: an RFQ the labs must answer, a sign-off, files from the client. A handover starts with the user's action, then waits — `Status` Waiting, `Waiting on` the party — and is Done when the result is in (`Waiting on` stays, as the record of whom it waited on).
- **No → a problem**: a **Risk** — something that might go wrong and move dates; a **Blocker** — work that cannot proceed until someone acts on something nobody planned for, under way or still ahead; a **Question** — a decision someone has to make.
- News about an item that exists ("Dana signed", "the boards are late", "they answered") changes that item. It becomes a new problem only when the user calls it a risk, a blocker or a decision, or when it is about nothing in the plan.

**Names.** Two to five words, one style per level, the way a Gantt row is labelled; status, dates, the party waited on and "done when" live in the fields and the history.

- A milestone is a phase or a deliverable: `Research`, `Demo prototype`, `Certification`. A contract's milestone keeps the contract's own title exactly (`references/contracts.md`) — the client knows it by that name.
- A task is a noun for the work or its result, never a sentence: `Boards bring-up`, `Demo firmware`. A handover is named by what is awaited — `Certification lab quotes`, `Final audio files`; whom, is `Waiting on`. A task the user asks to add is named from their words ("add a task: bring up the boards" → `Boards bring-up`).
- A problem says what is wrong: `No CI runners in GitLab`, `Battery cell doesn't fit the pocket`.
- A source's longer wording, when it says more than the name, becomes the row's description (`From the demo plan: "Flashed and working in the US".`).

**How big a task is.** A task deserves its own line in a weekly report: days or weeks of work, or a handover worth chasing. Anything smaller — "flashed the dev board", "wrote the driver" — is progress: a history line on the task or milestone it belongs to, never a new row. A task row is created only when the user asks for one, from an imported plan, or in a plan change the user approved.

**Dates are the user's.** `Dates` are the dates the user set; whom they were given to and whether anyone agreed is the user's business. They change only on the user's word, each change a history line `old → new` — moving them silently would erase the lateness they exist to show. **Never guess a date or a duration**: a date is stated by the user or the source, or follows from a fixed rule in these files — a place in the plan and a duration the user gives are one (the item starts where the one it follows ends: "two weeks of work after the first prototype", which ends Jan 8 → Jan 8 – Jan 22). Anything else — "done last week", a delay with no size, a new milestone without a date — gets one short question covering everything missing. A report in the present ("finished the firmware") means today. A date only proposed ("I'll suggest Oct 20–31") goes into the history until the user sets it. A task may have no dates at all; ask for one only when the user is planning dates with the client. A milestone's `Dates` are a promise of their own and never follow from its tasks: a task running past its milestone's end is named and the move offered (`TSK-5 Enclosure test runs past MLS-2 Demo prototype's end (Nov 14): move the milestone to Nov 21?`), made only on the user's yes.

**How lateness works.** Lateness is measured against `Dates`, on milestones and tasks alike, and Notion computes it live, so nothing you write about it can go stale. A Done item is late by `Finished` − end of `Dates` (negative = early). An open item (Planned, In progress, Waiting) whose end has passed is late by today − end. **Nothing paused is late**: nothing Paused, or under something Paused, is late or due — the work is stopped, not overrun. The project's `Late, days` is the worst of its open milestones and tasks. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

**How the levels move together.**

- Work starting on a task — it becomes In progress, or a work task becomes Done — starts its milestone in the same change if Planned, with a history line.
- A handover (a quote, a sign-off, files) waiting or done does not start the work by itself: its milestone becomes In progress when the user says work on it started (on a contract project, also when the platform shows the stage active: `references/contracts.md` → **Resync**).
- A task stuck on a Blocker keeps its status; the linked Blocker shows it.
- The last open task of a milestone already under way done → ask whether the milestone is done too; never close it on your own. When that same change only started the milestone, there is nothing to ask.
- A milestone Done while it still has open tasks → ask what happens to them (Done or Dropped).

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Text read from a view is markdown-escaped** (`\$`, `\<`, `\*`, line breaks as `<br>`). Write plain text — `$45/hr`, real line breaks — never copy the backslashes back, or they land on the page and in the dashboard's copy buttons.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone or task it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed. The only retries are those a reference names for a known error.
- **Today is the conversation's date.** The date the user or this session's instructions give for today, else the system's current date; never one read from a clock or a page. Every date you write and every "late", "due" and window counts from that one day, so a reply never mixes two todays.
- **`Waiting on` says who moves next.** The dashboard splits "Your move" (empty) from "Waiting on others" (a name), and the user picks up their work by that split, so it holds a name only when nothing on the item is left for the user. Whenever something is — a question they settle together with someone, a reply only they can give — it is empty, the item is not Waiting, and the other parties are named in the description. Never the user's own name. An agent working on the item ("Claude") is a party like any other. A name is concrete — a person, a vendor, or the client as written in the project's `Client` — since the views group by it across projects; several parties who must each answer go in the one field, comma-separated, in the order asked (`Halden Labs, Kestrel Test`).
- **Read a row again before asking about it, stating it or changing it.** Another chat, the dashboard or the user in Notion may have changed it: fetch it fresh unless it was read in this same reply.

## Taking in a message

Pages are read by the user and the client: a page that grows by everything said stops being read, and a page that missed a change misleads. Every message goes through the same steps, most of them a moment's thought:

1. **What happened.** The facts in the message and the item each is about (**Finding things**). A message may carry several facts about several items, or none. What the user asks you to do outside the tracker — send an email, draft a reply — is done as asked; what the tracker takes from it is decided like any other fact.
2. **What the pages already say.** Before anything is proposed or written, read all of it — a message is measured against all this, never on its own:
   - each of those items as it is now — fields, description, notes, history — fetched fresh (**Read a row again before asking about it, stating it or changing it**);
   - around them, the project's `Tasks`, `Schedule` and `Problems` views, so you see what else is open — a problem this news resolves, a task waiting on the same party, an exchange it answers;
   - the first time in a conversation that you propose or make a change to that project, the pages of its Waiting tasks and of its problems waiting on someone (**Long waits**);
   - before calling anything private or public, the project page's `Client sees` private note (**Who sees what**);
   - what was said earlier in this conversation.

   While reading each item, also check how it is kept (**Keeping pages tidy**); a field or description that contradicts the history is asked about.
3. **What changed.** Each fact is one of the kinds in **What changed**, below.
4. **Worth keeping, where, how.** Would the user or the client look for it later (**What is worth writing**); where it will be looked for (**Every record goes where it belongs**); how it reads (**What an entry holds**).
5. **Propose, then write** (below).

### What changed

- **Already known → nothing.** A fact the pages already hold, in any words; a recap, a reminder, or how the user means to go about the work — even when the pages had not spelled out every detail of it, and not as a reworded description or checklist either; chatter, a mood, thinking aloud; a step the next entry will cover. Telling someone is not an event in itself — no "Told Mark: …" line, the mailbox keeps what was said; news inside such a message (a delay, a new date, a result) is still news.
- **The current state → changed in place.** What is true now — status, whom it waits on, what the item is, what is left (its checklist) — lives in the fields and the description: after every message the fields say who holds the ball (Waiting on the party who has to answer, back In progress when the user has work on it again). State is never a history line: "still waiting on Element", "70% done" — the fields say it, or nothing does.
- **A new event → one history line.** A result a client update would name (**Work is recorded by its results**); a delay; a decision or an agreement; a request or a proposal that leaves someone else owing an answer, and each reminder while it stays open; a delivery; a change of what is awaited or from whom; the reason something changed.
- **The next step of something open → folded into its line.** An answer to an open request does not stack a second line under the first (**An exchange settles into its outcome**). Steps the user reports one after another about one thing (ordered, then paid) are one line saying where it ended up.
- **A correction → fixed in place.** The wrong line or field is edited, never answered by a new line (**Corrections**).
- **Material → a note.** A reply's terms, a quote, a spec, the reasons behind a choice: a note on its subject (**Pages**) — private if **Who sees what** says so — and the history line, if the event deserves one, names it in a few words. A note already on that subject is updated, not joined by a second one.
- **A change to the plan → shown with everything it moves** (**Recording a fact vs a plan change**).

Nothing is written twice: not in the description and again in a line (a request that becomes checklist items gets a dated line saying who asked, pointing to the checklist), not on a task and again on its milestone, its project or a new problem (a line naming the problem is a pointer, not a repeat).

### What is worth writing

**What a record is for.** Someone opens a page to see where the item stands and since when; to settle dates and money with the client — what was agreed, sent, delivered and when, who waited on whom and how long; to answer an exact question — an amount and its breakdown, a limit, a formula, a part number, a dimension; to know why something changed. What serves none of these is not written.

**An exchange settles into its outcome.** Asking, proposing, quoting, promising or sending something for approval opens an exchange; the answer, the agreement, the delivery or the decision settles it. The opening is worth an entry when someone else now holds the ball — it shows since when — and so is every reminder sent while it stays open. When it settles:

- the wait did not matter — answered the same or the next working day, nothing held up, no promised date passed → the opening entry is rewritten into the outcome, dated by it, so one entry is left (moved to the end if entries came after it) (`- **Oct 3** — Board 1.2 mm thick instead of 1.6, agreed with Dana.`). Only the opening entry is rewritten — an entry for something else done meanwhile stays as it is. The rewrite keeps what the opening holds that someone may ask about — above all who asked for what, and when (`- **Oct 10** — Second board variant, asked for by Medica on Oct 8: agreed at +$600, end Oct 31 → Nov 4.`);
- the wait mattered — it held the work up, needed chasing, took longer, or a promised date passed → the opening stays and the outcome is an entry of its own: that gap is the record of who held things up. A delay and the agreement on it are always two entries: the slip is the record.

Options and proposals that were not taken leave no entry of their own. With several parties — quotes asked from three suppliers — the exchange settles at the decision: until then an answer may have its entry; the decision rewrites those entries into one, their material staying in notes.

**Work is recorded by its results.** While an item is under way, a result a client update would name — a part working, a value measured, a finding ("BLE connects to a phone", "TIMER1 erratum, worked around with TIMER2") — is an entry: the weekly report is built from these, so they stay when the item is done. The checks and sub-steps on the way ("power rails OK", "70% routed") are not.

**What an entry holds.**

- **The facts, exact**: amounts with their breakdown, limits, formulas, part numbers, dimensions, dates, names. Short in words, never by dropping a number someone may ask about.
- **One subject.** A message about three items is three entries, each where it belongs. Where nothing fits better, a fact goes on the item the conversation is about, and the proposal says so — never left out while you ask where it should go.
- **Only what the user or the source said.** An unclear statement is not recorded as a fact — ask what was meant, or leave it out. No causes, plans or commitments added on the user's behalf.
- **No facts riding inside a request.** "Make sure the open point with the enclosure maker doesn't move the connector" claims an open point; if the pages know nothing of it, record the request without the claim and ask what is meant.
- **Never what comes next** ("priced once she chooses"): plans change and such an entry goes stale.
- **A history line is one sentence** on what happened, with a short why-clause when it matters, in your words — not a quote of the message. A number or a reason lives in one place: the note when there is one, else the line.
- **A note is a short summary**, never a transcript. Material that already lives somewhere (a doc, an email in the user's mailbox, a link) is summarised with the link. A sub-page keeps text as given only when it has no other home — call notes, a spec or an email thread the user pasted (`references/notes.md`).

**The user's word decides.** When the user asks for something to be recorded ("write down that the rails check out", "note this"), it is recorded, whatever the rules above would leave out: they know what they will need. It still goes where it belongs and is written as an entry holds.

**Nothing is a fine answer.** When nothing changed, nothing is written, and the reply says so in a line if the user seemed to expect a write. When unsure, keep a fact and drop a step: a fact that may be asked about — a number, a request someone made, a reminder, a date — is kept; a step of an exchange that its outcome will cover is left out.

### Propose, then write

The one home for when a change is written; the references say what to write.

By default the reply puts to the user what you would write — the change list of **Every change** → step 4, ending with one short question in their language ("Write it?") — and you write it once they agree: they see the call before it is in Notion, where a wrong one costs a second to catch instead of a page to clean up. Everything in it but the quoted entries is in the user's language; the entries are in English, as they will be written. When the proposal holds a choice (the line only, or the dates moved too), that choice is the closing question, so a plain "yes" never has two meanings. "Yes" writes exactly that; "yes, but …" writes it with their change; "no", or a reply about something else, writes nothing — an unanswered proposal is not a yes; it is brought up once more with the next proposal, then dropped with a line saying it was not written.

**Written at once, then reported:**

- **An instruction that settles the change** — what to change and where are both clear from the user's words, or from the row the chat is about: "mark TSK-3 done", "add a task to Brightbrush: …", "in TSK-7 record that …", "make that note private", "swap these two milestones", a correction ("no, that was yesterday"), an undo. A general go-ahead — "update the tracker", "do what's needed" — is a yes to what you would have proposed; the rules still decide what that is. "Record that …" with no place leaves where and how to you, which is exactly the call the user wants to see: propose it like any news.
- **The Tracker update** (**Finding things**) and clearing an old shape when you write to a project (`references/upgrade.md` → **Old shapes**).

**Recording a fact vs a plan change.** A date or state the user states — an item finished, a task waiting on someone, a corrected date, a problem resolved, a pause, the one task the user asked to add or drop — is taken as stated: proposed, or written on an instruction, with no question about it. A **plan change** — moving dates the user did not name, adding or dropping milestones or more than the one task named, creating a project — is shown with every row it moves and done only on the user's yes to it, even after a general go-ahead, because it rewrites many rows on your reading of their words; a move the user named themselves ("shift everything after it by a week") is that yes. Removing a project, or the one task or problem the user names, is not a plan change (`references/plan-changes.md`). The Tracker update and clearing an old shape are neither: they change the structure, not the plan, however many rows they touch.

**A doubt is not an instruction.** A doubt about how to record something ("not sure where this goes") is answered and proposed, and written once the user agrees — unless they left it to you ("sort it out"); then decide, do it, and say why that way is the better one.

One proposal per message, covering every item; a question the change needs (how long the delay is, which of two tasks, which day it finished) goes in the same reply, and the answer to it is also the yes, unless it changes what was proposed. One question closes the reply: other things you would ask (whether the milestone is done too, the next item to start, an overdue item, a long wait, a tidy-up) are folded into it ("Write it? And tidy TSK-7?") or wait for the next reply; the dashboard offer stays its own last line.

### Keeping pages tidy

Pages written by older rules, or by a slip, drift: the same thing in two parts (a note repeating a history line, a description and a note saying the same), dated notes that are really history lines, history lines carrying details that also live in the description or a note, notes that repeat the description, what the item consists of now left in a note. When you see this on an item you are proposing or making a change to, add a short tidy-up after the changes — on that item only, what to merge, move, rewrite or drop, as `references/tidy.md` → **What a tidy-up does** says (`Tidy-up for TSK-7: the Oct 10 note and history line say the same — keep the line, turn the note into "**Debug interface** — …"`) — and name it in the closing question. It is always a proposal, never folded into a go-ahead for the news; one item per reply, only in replies that change something — never on a status question or a dashboard chat's first reply: pages get tidier as the work goes, never in a sweep the user has to read through, unless they ask for one (`references/tidy.md`). A field or description that contradicts the history is not a tidy-up: it changes what the item says now, so ask about it at once.

### Every record goes where it belongs

A note, a file, a history line, a problem's links — each goes where it will be looked for, so the tracker stays in order without moving things later.

- **Start from where the conversation is** — the row a dashboard chat was opened from, or the item the talk has been about — and keep it there when the record is about that row.
- **Then check what it is really about:**
  - one row's own work (its spec, its emails, its sign-off) → that row;
  - another task, milestone or problem → that one;
  - what adds up across several tasks of a stage — money spent and its documents, decisions, agreements, contacts, context shared by all its tasks → their milestone, once, not on each task;
  - what spans milestones, or the project as a whole (paused, finished, removed, its target end changed) → the project;
  - progress → the item it belongs to by meaning: the task it is part of, its milestone when no task fits, or the problem it moves forward; when two fit equally, ask in one line;
  - what later work must not forget (a defect to fix in the next revision, a lesson for the next batch) → where that work will look: its item if it exists, else a note on the project — not only the history of the item where it was found.
- **An expense** — a receipt, an invoice, a payment for the client — is one note per document, titled with what and when (`**Mouser order, Oct 9** — …`), on the milestone it was spent for (else the project): the amount, the document's number, its file. Public or private by **Who sees what**.
- **Not where the conversation is** → put it where it belongs and say so in its line, with why (`on MLS-6 Demo prototype, not the task: the demo's expenses are kept there`).
- **The user named the place** and you see a clearly better one → ask first, in one line.
- **A file** goes where a rule above puts it, said in the reply; when its place is a judgment call, ask first — once uploaded it cannot be moved by these tools.

## Finding things

**The root page** is recognised by its config toggle, not by its title: a toggle at the top titled `⚙️ Config — read by the project-tracker skill…`, in whichever form the fetch gives (**Page text**: `<toggle>` with the title as its first line, `<b>Config</b>` and `<code>project-tracker</code>`, or `<details>` with `<summary>⚙️ **Config** — …</summary>`). Its lines list `projects`, `milestones`, `tasks`, `problems` (data source IDs) and `projects_views`, `milestones_views`, `tasks_views`, `problems_views` (the root views' links, by name). Use them if you have them from earlier in the conversation. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose toggle title *begins* with `⚙️ Config — read by the project-tracker skill`, markup aside (other tools write similar blocks, and a backup tracker carries a changed title; when the highlight is not conclusive, fetch and check). One → use it. Several → ask once which, by title and parent;
- none → the tracker is not set up (**Other scenarios**);
- a config with `open_items` and no `tasks`, or a current tracker next to an unretired 0.x one → `references/upgrade.md` before anything else; never write to a 0.x tracker with these rules;
- a `schema` above 8 → a newer plugin built this tracker and these rules would misread it: write nothing, and say in one line that the plugin needs updating;
- a current config whose `schema` is below 8, or that has no `schema` line → `references/upgrade.md` → **Tracker update** first, without asking, then the request, whatever it is — a status question too. It runs whole, every step through the last `schema` line, in this same reply — a question that only reads is no reason to wait or to stop half-way — and is never put to the user as a proposal or saved for later: a half-updated tracker is read wrong by every rule here, the update records nothing about their affairs, and installing the newer plugin was their go for it.

The `schema` is checked the first time the config is read in a conversation, before anything else: every rule here assumes the current structure.

**An ID** the user writes — `TSK-34`, `tsk34`, `PRB 5` — names exactly one row, never a guess: the prefix says the database (`ref_prefixes`; an older prefix, `references/upgrade.md` → **Old shapes**) and the number is its `Ref`, which views give as the bare number. Match it in that database's root views, `Done` and `Recently resolved` included, paging until it is found or the views end. A number found nowhere, or one without a prefix, is asked about. Several IDs in one message name exactly those rows.

A project: the `Active` view, by meaning ("the rain gauge" → "Weather station", "the masts" → "Weather station" whose repository is `wx_mast`); a Done one in `Closed`; a Removed one only when the user names it or asks to bring it back. A milestone, task or open problem: the project's `Schedule` / `Tasks` / `Problems` views; a Resolved problem ("it came back, not fixed"): the root `Recently resolved` (the past month), older ones by `notion-search`. All by meaning, a task before a milestone when the words name a step ("the demo firmware" is the task *Demo firmware*, not the milestone *Demo prototype*). One candidate → no question; several plausible ones → ask.

**Overdue check.** When you work on one project and one of its open milestones or tasks has an end before today (**Nothing paused is late**), mention it and ask what happened — finished (on which day), a new date, or still going — unless its latest history line already explains it or the user answered earlier in this conversation. "Still going" with a reason gets a history line with the reason as a fact (`- **Mar 24** — Past its end: the second batch is late.`); the item stays late, and a Planned one becomes In progress.

**Long waits.** Every reply that proposes or makes a change to a project checks its waits, from their pages (**Taking in a message** step 2): a Waiting task, or a problem waiting on someone, whose latest history line (a problem without one: `Opened`) is more than 7 days old. They are named together in one line of the closing question, each with whom and since when (`TSK-10 Lab quotes waits on Halden Labs since Oct 5, 15 days: chase?`), with the overdue check's exceptions, nothing paused, and each at most once per conversation: the user who passed over it has seen it. A wait shows in the views only when asked, and the user asks inside other work, so a week without a word is when a secretary would remind them. A chase the user then reports is a reminder: a history line.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** `data: {mode: "view", view_url: "https://app.notion.com/p/<database or block id>?v=<view id>", page_size: 40}`, ids without dashes. A root view's URL is in the config's `<database>_views` line, by name; a project's `Tasks`, `Schedule` and `Problems` are in its `Views` (its row in `Active` or `Closed`). Where one is missing, or a query refuses it, fetch to find it: a root view from its database (the `<database url=…>` on the root page), which lists `<view url="view://<id>">`; a project's from its page, where each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">`, then that block, which lists its views — about 10k characters only to learn an id that never changes, which is why the links are stored. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

- **40 rows a read.** A view returns every property of every row — about 1k characters each — and a result above about 50k characters is cut off.
- **Paging.** While a result has `has_more`, query again with `start_cursor` set to its `next_cursor`, until the request has the rows it needs or the view ends: a first page alone silently drops the rest.
- **`Done` and `Recently resolved`** are sorted newest first (by `Finished`, by `Resolved on`), and `Done` holds everything ever finished: read them only until the first row older than the period the request needs.
- **A view's URL, once read** — stored or fetched — is reused for the rest of the conversation, like the config's IDs; the rows are still queried fresh.

**New row** (milestone, task, problem): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below (`Order` included, for a milestone or task), and optionally `content` for the page body (a description; a first history line with its `## History` heading).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name; checkbox `"__YES__"` / `"__NO__"`; clearing a value `null` (both date ends).

**Bodies**, by part (**Pages**). An entry goes in front of the first heading that comes after its part and is already on the page, else at the end of the page; the first entry of a part brings its heading, in the same call.

- **History line**: `insert_content`, `position: {"type": "end"}` (`## History` is always last).
- **Note**: `update_content` with `old_str` the next heading present — `## Private notes`, else `## History` — and `new_str` the note, a blank line, that heading; neither on the page → `insert_content` at the end. A **private note** the same, before `## History`.
- **Description**: new — on a milestone, task or problem `insert_content`, `position: {"type": "start"}`; on a project page `update_content` with `old_str` `</tabs>`, `new_str` `</tabs>`, a newline, the description. Changed — `update_content` on its lines as fetched; a checklist item done — `- [ ] Pinout fixed` → `- [x] Pinout fixed`.
- **Moving an entry** ("make that note private", "the client can see this one"): one `update_content` with two `content_updates` — the entry → empty, and the target's heading → the entry, a blank line, that heading (or the heading created, as for a first entry); a part left empty loses its heading.

**Page text.** Since Oct 20, 2026 a fetch returns pages in Notion's current format: `<toggle>` (its title the first line, its children after a blank line) where it showed `<details>`/`<summary>`, `<b>` and `<code>` where it showed `**` and backticks, blank lines between blocks, nesting by two spaces instead of tabs, pipe tables, `<p />` for an empty block, and Markdown escapes such as `ref\_prefixes: …` or `09\:30`. Read either form: a value is the same with escapes and markup set aside (`schema: <code>5</code>` and ``schema: `5` `` are both 5). Writing:
- `old_str` is copied from the fetch exactly — tags, escapes and blank lines included; a string retyped in the other form matches nothing.
- All of `new_str` — a line it carries over unchanged as an anchor too (`old_str` `schema: 8\n</toggle>` as fetched → `new_str` `schema: 8`, a blank line, the added line, `</toggle>`; never a fetched `<code>` copied back) — and new content are written as `notion://docs/notion-flavored-markdown-spec` says (fetch it once if unsure): Markdown (`**bold**`, backticks) and Notion's own tags only. Notion saves any other tag as literal text — `<details>`, `<summary>` and `<code>` among them.
- A container (`<toggle>`, `<callout>`, `<tab>`) holds its title right after the opening tag and its children after a blank line, each block a paragraph of its own; no tab indentation. A line added to the config toggle is one such paragraph, before `</toggle>` or after the line it follows.
- Block tags (`<toggle>`, `<callout>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`).

After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons.

**No status callout** on a project page: where it stands is computed live, and a text summary would go stale. A page that still opens with one: `references/upgrade.md` → **Old shapes**.

## Every change: read, write, check, report

1. Before writing, note the current values of everything you are about to change — you have them from the read.
2. Write the rows first. Only after they succeeded, bring `Summary` and `Target end` in line with what changed — never in parallel, so a failed write never leaves the page describing a change that did not happen.
3. **Client dashboard.** If the project's `Client dashboard` holds a link (from its `Active` or `Closed` row, or the project page), refresh that page once, after all the writes: `references/client-dashboards.md` → **Keeping it current**. A change that touched nothing but Private notes (a `Client side` note aside), `Chat`, `Claude project` or the link itself refreshes nothing.
4. **Reply to the message, not only about the records.** Whatever the message was about — a doubt, a choice they were weighing, something they want your view on — gets its answer first, plainly, with the reason in a sentence or two, and all of it, not just the part that turned into a write: a list of what was done cannot tell them whether it was the right call. Then the changes, grouped by item — proposed, or done on an instruction — as plain text, never in a code block: the item's ID and name in bold on a line of its own, then one bullet per change, labelled in the user's language — fields as was → now, what goes in quoted exactly as it will be written, in «» or "" (a history entry, a field value, a short note; a rewritten entry as old → new). A long note, a sub-page, a table or a file is named by where it goes and what it holds, never pasted. A tidy-up follows the changes as its own short block. After a yes, the reply is one line that it is written, plus only what came out differently (a write that failed, a change they asked for). For example:

   **TSK-95 Boards bring-up**
   - status: In progress → Done, finished Oct 8 (due Oct 9)
   - history: "Oct 8 — All five rev B boards brought up, without the accelerometer."

   **PRJ-13 Bike radar**
   - note: "For rev C: the accelerometer footprint is rotated 90°." — on the project, so rev C finds it

   **MLS-6 Demo prototype**
   - private note: the Cell Pack quote — prices at 1k, 3k and 5k, MOQ, lead time

   Write it?

   Besides the answer to the message, the list is the whole reply: the user reads it between other work. A sentence is added only when a rule here asks for one (a delay's preview, an offer to move dates) or for a question the next step needs; why something goes private or somewhere unexpected is a few words inside its own bullet. Nothing about what was left out, what stays as it is or what you will do later — where a level stands after the change is part of it (`MLS-1 Firmware on the dev board: still In progress, 2 tasks left`). Never change something silently; the user should not have to open Notion to know what happened.

These steps hold for every write, whichever reference describes it. **Undo** ("undo that", "revert", "put it back") takes a change back, it is not a new fact: `references/plan-changes.md` → **Undo**.

## Frequent scenarios

### Progress — "finished the demo firmware", "calibration passes", "Dana signed"

Find the item (a task first when the words name a step or a handover, else the milestone). If what the user reports *is* its result — what its description says it delivers — it is done; if it is a step towards it (boards ordered, when the task is the boards delivered), it is progress; when unsure, progress, and ask whether to close it. A history line says what happened; a checklist item for it is ticked too. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — `Finished` against them is the record of how it went. Then the levels (**How the levels move together**). When an item is done, name the next one by `Order` in the same milestone (or the next milestone) and offer in one line to start it (`Next by the plan: TSK-4 Power measured, from Oct 12 — are you on it?`); it becomes In progress, with a history line, when the user says they are on it — work starting is the user's fact to report.

### Tasks — "add a task: order a debugger", "sent the RFQ, now waiting on the labs", "Kestrel replied"

- **New** ("add a task" is an instruction): `Project`, `Milestone` (the stage it serves, by meaning; the In-progress one if the words fit it; none in a project without milestones), `Status` Planned, `Order` after the milestone's last task, `Dates` only if the user gave them or they follow from what was said (**Dates are the user's**). First history line `- **Oct 6** — Added.` plus the reason if given. One plausible milestone → no question; several → ask.
- **Waiting**: the user did their part and someone else has to act → `Status` Waiting, `Waiting on` the party (**`Waiting on` says who moves next**), a history line with what was sent. Back to In progress when the user has work on it again; Done when the result is in, the answer settling the exchange (**What is worth writing**). A later message about it gets a history line when it changes what is awaited or from whom ("they asked for the block diagram too"); material from it (a spec, the terms of a reply) is a note on the task.
- **Dates only proposed** ("suggested Oct 20–31 for the enclosure"): no `Dates`, a history line with the proposal; when the user sets them, the proposal settles into that.

### Delay — "the boards are three days late", "the supplier slipped a week"

The delayed item is a task when the words name a step, else a milestone. When the user calls the delay a risk or a blocker ("the quote is late, a risk for certification"), it is a problem (**Problems**). An item without dates has nothing to move: the delay is a history line on it (`- **Oct 26** — Expected about a week later: boards late.`). Otherwise, if the size is not given, ask how long and write nothing until you know.

- **The line, then the move.** The delay line `- **Oct 26** — Expected about 3 days late: boards late.` is a fact (**Propose, then write**). Moving the dates is the user's choice, always asked. In the same reply show what would move: the item's end; the tasks of the same milestone starting on or after its old end; the milestone's end if its tasks now pass it; and, whenever a milestone's end moves, the milestones starting on or after its old end (`TSK-12 Boards bring-up: Nov 5 → Nov 8; MLS-4 Demo prototype: Nov 9 → Nov 12`). Parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. The closing question is then one: with the line still a proposal, "the line only, or the dates moved too?"; with the line written, "move the dates?". When the user already named the move ("shift everything after it"), the line and that move are both written.
- **Move** (now or later): move the dates shown; the slipped item gets `- **Oct 26** — Moved: boards late. Nov 5 → Nov 8.`, each pushed item `- **Oct 26** — Pushed by the Boards arrived move, Nov 6 → Nov 9.` If only this one item moves, to the date the user gave, record it without the preview.
- **Keep**: the line is written, the dates stay. Tell the user the item will show as late once its date passes, and that you will move it when they say.

If an open Risk described exactly this, resolve it: `Summary` "Fired: +3 days", with a history line.

### Problems — new, resolved, changed

- **New**: the type by what it is — **Blocker** (work cannot proceed until someone acts, and the plan did not expect it), **Risk** (might happen and would move dates; the consequence in `Summary`), **Question** (a decision nobody planned for; `Waiting on` = who decides, empty when the user decides too). A question the user asks someone about an item in the plan is not a problem: the item waits on them (**Tasks** → **Waiting**) or its history records the ask. Links: `Task` = the task it is about, if the words name one; `Milestone` = the milestone it threatens or blocks ("the lab quote is late, a risk for certification" → `Task` the lab quote task, `Milestone` Certification). `Status` Waiting if someone else has to act on the problem itself, else Open — a risk about a task that already waits on that party is Open with `Waiting on` empty, the task carries the wait. `Opened` today; `Summary` the one sentence; the user's longer account, if any, its description. A new problem about a task gets a history line on that task, naming the problem rather than repeating it (`- **Oct 5** — Blocked: see the problem "Battery cell doesn't fit the pocket".`); no milestone history line — problems show on the page. Linking an existing problem to a task later changes the problem alone.
- **Resolved**: `Status` Resolved, `Resolved on` today, `Summary` = how it ended, and a history line (`- **Oct 9** — Resolved: Halden quoted 6 weeks.`). If the answer changes the plan, continue as a delay or plan change.
- **Changed** ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`, `Task`; `Summary` rewritten if what it says changed; a history line with what changed and why (`- **Oct 9** — Now a blocker: the lab won't quote without the full BOM.`). A "problem" that turns out to be planned work becomes a task: create it with the problem's description and `Summary` as its description and a first history line `Was the problem "<name>"`, then drop the problem with `Moved to the task <name>.`

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the item a line belongs to, the milestone a task belongs to, an item reopened (a reopened milestone or task loses its `Finished`, a reopened problem its `Resolved on`). Edit the wrong history line in place, so the history stays true. `Dates` that were simply entered wrong are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of a date is a delay. Other items keep their dates — if they look like they should move too, say so and offer.

### Notes and files — "save the call notes", "attach the datasheet", "for myself: …"

A note goes where **Every record goes where it belongs** puts it, under `## Notes`, or `## Private notes` by **Who sees what**; a short one as `**Subject** — text`, dated only for dated material (**Pages**, **Bodies**), long text and files by `references/notes.md`. A description or a checklist the user gives for an item ("the task is …", "checklist for the layout: …") is its description, not a note. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only, and mention what it seems to imply.

## The dashboard offer

In a conversation with the user (never a scheduled or unattended run), once per conversation and after answering what was asked: when the config has no `dashboard` line, or its `dashboard_version` is not an `x.y.z` of at least N — N being the version on the first line of `assets/dashboard.html` (read only that line) — and `dashboard_skip` is not N, end with one short line offering it, as `references/dashboard.md` → **The offer** words it.

## Other scenarios — read the file first

| When | Read |
|---|---|
| A first message naming a row "(Project Tracker, <url>)" — a chat's or a Code session's —, or a request to change where a project's chats or Code sessions open | `references/chats.md`, before anything else |
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns) | `references/setup.md` |
| A config `schema` below 8, or no `schema` line | `references/upgrade.md` → **Tracker update** |
| A milestone or project paused ("the enclosure test is on hold until the parts arrive", "the project is on hold") or resumed; a project finished, reopened, or its fields set (client, origin, repository, source) | `references/state.md` |
| Long text (call notes, a spec, an email thread) or a file to save | `references/notes.md` |
| Undo, in this conversation or of an earlier change | `references/plan-changes.md` → **Undo** |
| Tidy a task, a milestone with its tasks, or a whole project ("tidy TSK-7") | `references/tidy.md` |
| A tracker made by version 0.x (config has `open_items`), or the user asks to upgrade or migrate it | `references/upgrade.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; break a milestone into tasks; reorder the plan ("bring-up comes after firmware"); finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| A question the tracker answers: how a project is going ("how are the masts?"), what is on the user, what is due, late or burning, whom to chase, what got done; a weekly report or client update | `references/report.md` |
| Publish or republish the dashboard | `references/dashboard.md` |
| Make, refresh, change or remove a client dashboard; the user opens more to a client ("Northwind can see the supplier prices") or says who is on the client's side | `references/client-dashboards.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
