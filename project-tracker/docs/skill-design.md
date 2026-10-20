# Skill design

How the `project-tracker` skill is put together and the criteria every change is checked against — for whoever edits `skills/project-tracker/`. Read `docs/skill-development.md` at the repository root first: this file adds only what is particular to this plugin. The pages in `assets/` have their own spec, `docs/dashboard-design.md`. The skill does not read either file at run time.

The skill keeps a freelancer's client projects in Notion current from plain chat. The user does not edit Notion: they say what happened, the skill works out what it changes, proposes the records and writes them on a yes. A project page answers at a glance where the project is, what is next and what is in the way; the client sees the work through a client dashboard.

## What the skill must do

These hold in every mode. The eval suite (`evals/README.md`) checks each; a change that breaks one is a bug, not a trade-off. Cases in *italics* are gaps: the guarantee has no case yet.

1. **Propose, then write.** News without an instruction is put to the user in plain words — what would be written, where — and written only on their yes; an instruction that names the change ("mark TK-3 done"), a correction, an undo or a general go-ahead ("update the tracker") writes at once. A change to the plan (dates the user did not name, milestones, several tasks, a new project) is always shown with every row it moves and waits for a yes to it, even after a go-ahead. — `propose-first`, `task-done`, `task-add`, `plan-add`, `new-text-preview`, `new-text-create`, `delay-sized`, `delay-confirmed`, `reorder`, `note-placement-asked`, `remove-project`.
2. **Dates are the user's.** `Dates` change only on the user's word, each change a history line `old → new`; nothing is moved silently, since that would erase the lateness they show. A date or a duration is never guessed: what the user or the source did not state is asked in one question. A task running past its milestone's end never moves that end: the reply offers the move. — `delay-unsized`, `delay-sized`, `delay-unagreed`, `delay-confirmed`, `task-delay`, `milestone-end-offered`, `reorder`, `correction`, `new-from-file`.
3. **Each page part answers one question.** A page holds up to four parts — the description (how is it now), `## Notes` (why, and what we know), `## Private notes`, `## History` (what happened, when) — each with the test SKILL.md → **Pages** gives; a fact lives in the one part whose question it answers, the fields are never restated in text, and a heading appears with its first entry. A step done is a checklist tick and a history line. — `description-checklist`, `checklist-tick`, `private-note`, `note-only`, `new-text-create`, `schema-update`; *a note on a subject edited in place rather than followed by a second one*.
4. **The history keeps outcomes, not every message.** What the pages already hold writes nothing; an exchange that settled without a wait that mattered is one entry, rewritten into its outcome; a wait that mattered keeps both entries; a state is never a history line; nothing is written twice. — `exchange-settles`, `progress`, `delay-confirmed`, `task-waiting-done`, `task-handover-done`; *a message that repeats what the pages hold writes nothing*.
5. **The client sees only what is meant for them.** Everything outside `## Private notes` is written as if the client reads it; supplier prices, the user's costs, others' contacts and the user's views of people are private by default, and when unsure it is private. A client dashboard's data carries the public parts and the listed fields only — never private notes, links into Notion, chats or internal fields. — `private-note`, `note-placement`, `client-dashboard-create`, `client-dashboard-refresh`; *a supplier price told in an ordinary update goes private unasked*; *a `Client sees` note opens more*.
6. **Every record goes where it will be looked for**, and the reply says where when that is not the item the conversation is about. — `note-placement`, `note-placement-asked`, `risk-on-task`, `problem-new`.
7. **The plan's model holds.** A task is what the plan expects, a problem what it did not; a step smaller than a task is progress on its item, not a new row; the levels move together (a task under way starts its milestone; a milestone is never closed on its own); `Order` keeps the plan's order without dates; `Waiting on` names whoever moves next, and is empty while anything on the item is left for the user. — `problem-new`, `risk-on-task`, `checklist-tick`, `progress`, `task-done`, `task-waiting-change`, `waiting-shared`, `waiting-agent`, `reorder`, `pause`, `project-paused`.
8. **A row named by its ID is exactly that row**, never a guess; an ID that names nothing is asked about. Replies name every row by its ID and name. — `ref-lookup`, `ref-link`, `ref-unknown`.
9. **The data is never put at risk.** Notion is read through views and page fetches only, never SQL or rows mode; pages are changed a line at a time, never `replace_content`; markup is sent raw, never escaped; text read from a view is written back plain, without its markdown escapes; tabs carry no icons; a write that errors stops the work. — guards on every case, `view-escaped`; *a write that errors*.
10. **The structure is brought up first.** A tracker below the skill's `schema` is updated in place, without asking, before the request — safely re-runnable, the new number written last; a 0.x tracker is never written to and the upgrade is offered; a tracker newer than the skill is never written to, and the reply says the plugin needs updating. — `schema-update`, `ref-prefix-taken`, `dashboard-update-migrates`, `upgrade-detect`, `schema-newer`; *the 0.x copy itself*.
11. **Replies answer the message.** Whatever the message asked — a question, a doubt, a choice — is answered first; the user's language in what is said, English in Notion; plain text, never a code block; the changes grouped by item, ending in one question. — `ref-lookup`, `ref-link`, `propose-first`, `status`; *a doubt answered before the records*; *a reply in Russian*; *no code block in a reply*.
12. **Reading writes nothing.** A status question, my week, the overview and the weekly report only read; a report states only what the tracker records. — `status`, `my-week`, `overview`, `report`, `report-email`, `unrelated`.
13. **A new project comes only from its source**, by fixed rules, so the same source gives the same rows; nothing is created before the user confirms the list, and an interrupted run is finished, not repeated. A contract project has one milestone per contract stage, under the stage's own title, and no money. — `new-text-preview`, `new-text-create`, `new-from-email`, `new-from-file`, `new-from-upwork`, `resync-upwork`.
14. **Setup is safe to repeat.** One root page, found by its config toggle and named as the user chooses; each step adds only what is missing. — `setup`, `setup-ask`, `setup-partial`.
15. **A client dashboard stays current.** After every change to a project it covers it is republished once, after the writes; taking it down is asked first. — `client-dashboard-create`, `client-dashboard-refresh`, `client-dashboard-remove`.
16. **A dashboard chat is its row's thread.** The first message claims the row before anything else (one chat per row), the chat names itself without a word about it, and the first reply is a line or two on the row. — `dashboard-chat`, `dashboard-chat-taken`, `dashboard-chat-new`, `claude-project-set`.
17. **Nothing is lost by a removal or an undo.** Removing asks drop or delete and deletes only on a yes; an undo restores what was there, and an earlier change is reconstructed and shown first. — `remove-project`, `undo-later`, `correction-reopen`; *an undo within the conversation*.

## Decisions

Choices the user made or confirmed. A request that goes against one is raised with the user before anything changes.

- **The user does not edit Notion; the chat is the only way to change the tracker.** The dashboards are read-only, so every change passes the rules (dates by the user's word, history lines, a reply that says what changed).
- **The skill proposes records first, like a secretary.** The user sees the call before it is in Notion, where a wrong one costs a second to catch instead of a page to clean up. An instruction or a general go-ahead is the yes.
- **Notion in English, the chat in the user's language.** The client reads the pages; material the user pastes keeps its own language.
- **Three levels — projects, milestones, tasks — and problems apart.** A project is planned at whichever level fits: milestones only (a contract), milestones with tasks, tasks only (support). Problems hold only what the plan did not expect.
- **One `Dates` per item, and they are the user's.** Whom they were given to is not the tracker's business; lateness is measured against them by Notion formulas, so nothing written about it goes stale.
- **A milestone's end is moved only on the user's yes.** A task running past it never moves it by itself: the reply names it and offers the move ("TK-5 runs past MS-2's end (Nov 14): move the milestone to Nov 21?"). A milestone's dates are a promise of their own, and a silent move would hide that the task overran it.
- **No status text on a project page.** Where a project stands is computed live by the dashboard and the views; a summary on the page would go stale with the first change it missed.
- **Pages in four parts, notes by subject.** A note is edited in place when what it says changes; it is dated only when the material is dated; the history says when things changed.
- **The history keeps outcomes, not every message.** A page that grows by everything said stops being read.
- **Everything but Private notes is public**, private when unsure: a private note is made public in a moment, a published one cannot be taken back.
- **`Waiting on` says who moves next.** Empty whenever anything on the item is left for the user, a name only when nothing is; never the user's own name; an agent working on the item is a party like any other; several parties in one field, in the order asked. The dashboard splits "Your move" from "Waiting on others" by it, and the user picks up work by that split.
- **Every row has an ID** (`TK-34`), numbered by Notion, so the user can name a row back; replies lead with it.
- **Tidy-ups are offered one item at a time**, only in replies that change something, and a sweep only on request — pages get tidier as the work goes, never in a list the user has to read through.
- **A client dashboard is a snapshot**, republished after every change to its projects, so the client needs no Notion access.
- **The user's dashboard is offered, not pushed**: once per conversation, after the answer, never in an unattended run; "no" is remembered until a newer version.
- **A contract project mirrors the contract's stages** under their exact titles and leaves money, terms and platform metadata out.
- **A 0.x tracker is copied to a new one, not converted in place**; the old page stays as the backup.
- **A newer plugin updates the tracker's structure without asking**: installing it was the go, and nothing in the skill works on the old structure.
- **A tracker newer than the plugin is left as it is**: the skill writes nothing and says the plugin needs updating, since its rules would misread a structure they do not know.
- **A place in the plan and a duration give the dates** ("two weeks after the first prototype" → Jan 8 – Jan 22): they follow from a fixed rule, so they are not a guess, and the new item is still shown first like any plan change.
- **A resync starts a stage the platform shows active**, even when its only open task is a handover still waiting: the resync mirrors the contract, and the client sees the stage active there. It is the one exception to how the levels move together; the waiting task stays Waiting.
- **A report is one summary of what matters, the same for any reader**: an email to the client adds a greeting and a sign-off, and the reader changes only what is private. It states only what the tracker records, so it carries no request, reason or offer of its own.
- **A report covers the period the user names** ("this week", "two weeks", "since Oct 1"), else the last 7 days: one rule for whatever looks back, so no report counts its days differently.
- **Removing asks drop or delete**: a dropped row keeps the plan's history, a deleted one goes to Notion's trash.
- **Each tracker project may have its own claude.ai project** for its dashboard chats, set when the project is made.

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; the data model and its words; page parts; who sees what; the plan's rules (order, task or problem, names, task size, dates, lateness, levels); the rules that protect the data; taking in a message — what changed, what is worth writing, where it goes, propose then write, tidy-ups; finding things; Notion call shapes; every change and the reply; the frequent scenarios (progress, tasks, delay, problems, corrections, notes, status); the dashboard offer; the routing table |
| `references/chats.md` | a chat opened from the dashboard: claiming the row, naming the chat, the first reply; `Claude project` |
| `references/client-dashboards.md` | client dashboards: what a client may see, making one, `data.js`, keeping it current, changing and removing it |
| `references/contracts.md` | a project from a platform contract (Upwork), and resync |
| `references/dashboard.md` | publishing and republishing the user's dashboard |
| `references/new-project.md` | a new project from a source: extract, dates, confirm, create, the project page's views and tabs |
| `references/notes.md` | long text as sub-pages, and files |
| `references/plan-changes.md` | plan changes, removing and restoring, undo |
| `references/report.md` | my week, the overview, the weekly report |
| `references/setup.md` | setting the tracker up or finishing it |
| `references/state.md` | pausing (the rule and its line) and resuming; a project's state and fields |
| `references/upgrade.md` | everything only older trackers need: the Tracker update (the schema steps, the columns older trackers lack), the old shapes still met on pages, a tracker made by 0.x copied to a new one |
| `assets/` | `dashboard.html`, `client.html` and their shared `app.js`, `core.js`, `core.css` — specified in `docs/dashboard-design.md` |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why.

- **The dashboard is offered, not updated by itself** (§6.7): publishing it needs the user's grant of the Notion connector on the page, and the user may have said no to this version. Client dashboards, which read nothing live, are brought to the current page on their next refresh.
- **The dashboard offer reads the plugin's `CHANGELOG.md`**, outside the skill folder (§2, a skill ships alone), to say in a few words what is new. Where the skill was uploaded alone the file is missing and the offer only says that an update is out; nothing else depends on it.
- **§3.9, compatibility in one place**: besides `references/upgrade.md`, the modes that meet an old shape on a live page — `SKILL.md` (a status callout), `references/client-dashboards.md` (a `data.js` without pages), `references/plan-changes.md` (old removal lines), `references/setup.md` (databases of an older version) — carry a one-line pointer to `references/upgrade.md` → **Old shapes**, since those pages are never converted and the mode must recognise them.
- **§6.5, nothing read again that the page knows for good**: the dashboard reads a paused milestone's page again on every load, for its pause line. The page must stay live, and it could skip the read only when Notion shows the row unchanged — but the view rows carry no last-edited time to compare (the databases have no such column), so it reads.
- **§4.4, propose then write**: the Tracker update, clearing an old shape, a client dashboard's refresh and a dashboard chat's claim of its row (`Chat`) go ahead without asking (*Decisions*): they keep the structure and the published pages working and record nothing about the user's affairs.

## Checking a change

Beyond `docs/skill-development.md` §7:

- **Known gaps** (§7.4): `schema-update` is not yet proven 3/3. Each step's number is now written as that step ends (`schema: 2` → `5` in order, its regex graders 3/3), but in that check two runs had their judge graders skipped by the cost ceiling, and the third failed `update-order` (judge 0/3) for a cause not yet read from a trace.

- `--scaffold` on every run: `new-from-file` and `client-dashboard-refresh` need their `scaffold.sh` (`evals/README.md`).
- The page markup (tabs, views, layouts) is only checked structurally by the mocks: after changing it, run the skill once against a scratch page in a real workspace and look at it.
- A change to the structure is a new schema step in the Tracker update, with its own case on an older mock workspace (as `schema-update` and `ref-prefix-taken`).
