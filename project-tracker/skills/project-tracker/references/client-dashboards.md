# Client dashboards — make, keep current, remove

A client dashboard is a page the user gives a client: one project, or several projects of one client. It is the user's own dashboard (`references/dashboard.md`) run on a snapshot of those projects, with one change: a single list of open items by whose side they are on (the client's, ours, third parties'), in place of Your move and Waiting on others.

**What it shows.** The work as it is, so the client sees not only that a task is under way but what is happening in it: names and IDs (`TK-34`, to name a row when talking to the user), statuses, dates and lateness of projects, milestones, tasks and problems; problem types, who is waited on, `Summary` (a project's and a problem's); and every page's public parts (SKILL.md → **Pages**) — the description, `## Notes` (a public sub-page with its text, a file by its name only) and `## History`. Never `## Private notes`, the status callout, links into Notion (a mention of a row the page shows opens that row on the page; any other mention is its plain title), chats, `Claude project`, origin, source or repository. What keeps the private part private is that it is left out of the data — anyone with the link can read the file — and SKILL.md → **Who sees what** decides what is written where.

It is a snapshot, not live: `assets/client.html` runs the dashboard's own code (`assets/app.js`, with `assets/core.js` and `assets/core.css`) on a `data.js` that the skill writes and republishes after every change to what it covers. The client needs no Notion access and no connector; lateness is computed in the browser against the viewer's today, so it stays right between updates.

## What a client may see — "ArcLive can see the supplier prices"

SKILL.md (**Who sees what**) keeps prices, costs, others' contacts and the user's views private by default. The user may open more to one client ("ArcLive can see the supplier prices and the lab correspondence"): save it as a private note on the project page — `**Oct 8** — Client sees: supplier prices and quotes; correspondence with the labs, contacts included.` — and on that project write those things in the public parts from then on. One such note per project, updated in place when the user opens more or takes it back. What is already private stays there until the user asks to move it (SKILL.md → **Bodies**, **Moving an entry**). Read the project page's `Client sees:` note before writing a public part on that project.

## Where the link lives

In the Projects field `Client dashboard` (URL) of every project it covers — one project's row, or the same link on each of several projects' rows. The field is the dashboard's record: a change to a project with a link refreshes that dashboard, and the dashboard covers exactly the projects that hold its link.

One dashboard per project: asked for one on a project that already has a link, give that link (and offer to change what it covers) instead of making a second. A milestone gets no dashboard of its own — its project's dashboard shows it.

## Make one — "сделай клиентский дэш для Valokuu", "a dashboard for ArcLive with both projects"

1. **What it covers.** The project, or the projects named. Several projects must share a `Client` (so must a project added later); if the user names a client, offer its active projects and ask which. Nothing is published before the scope is clear.
2. **What becomes visible.** Fetch every page it covers (each project page, and the pages of its live and Done milestones, tasks and problems) and check the public parts against **Who sees what**: entries written before that rule, or typed into Notion by hand, may hold prices, contacts or opinions; a `Client sees:` private note on the project page says what this client may see. List each doubtful one in a line — the page, the entry's first words, why — and propose moving it to `## Private notes`; when nothing is doubtful, say so in one line. Move what the user agrees to (SKILL.md → **Bodies**, **Moving an entry**) before going on. This check runs once, here; afterwards the rule itself keeps the public parts clean.
3. **A working folder** `client-dashboard-<short name>/` in the scratch or working directory — the Artifact tool takes files only from there, not from the skill's own directory; copy with a shell (`cp`) where there is one, else Read each file and Write it there unchanged — long, but the only way, so it is done, not asked about. Into it: `assets/client.html` as `index.html`, with `__TITLE__` replaced by the page's title — the project's name, or the client's name for several projects, followed by ` — status` (`Valokuu toothbrushing timer — status`), nothing else changed; `assets/core.js`, `assets/core.css` and `assets/app.js` as they are; and `data.js` (below), built from fresh reads.
4. **Publish** with the Artifact tool: `file_path` the folder's `index.html`; `files: {"core.js": …, "core.css": …, "app.js": …, "data.js": …}`, each the folder's copy; icon `chart`; description `Project status for <client>`; no `capabilities` (it reads nothing live).
5. **Store the link** in `Client dashboard` of every covered project (this changes nothing the page shows: no refresh).
6. **Tell the user**, in a few lines: the link; that it is private until they share it from the page's Share menu; that it updates itself after every change to its projects; that "remove the client dashboard" takes it down; and every `Waiting on` the data puts with third parties that might be the client's (**Side**, below), so they can say otherwise; and that everything outside Private notes on these projects is visible to the client from now on.

No artifact tool on this surface → the folder is the result: say where it is and that any static host serves it as is; no link is stored, and nothing is kept current.

Undo of making one ("undo that", "I didn't want it") is **Remove**, below, with its question.

## The data — `data.js`

One line of JavaScript around JSON: `window.PT_DATA = {…};`.

```
{
  "updated": "<now, ISO 8601 with offset>",
  "title": "<client>",                      // several projects only
  "projects": [
    { "project": {row}, "milestones": [rows], "tasks": [rows], "problems": [rows] }
  ]
}
```

Rows are copied as the views return them, keeping only these keys — anything else, above all any text someone wrote, stays out, since whoever has the link can read the file:

| Rows | From | Keys kept |
|---|---|---|
| project | root Projects `Active` (or `Closed`) | `url`, `Ref`, `Name`, `Client`, `Status`, `Summary`, `date:Target end:start`, `page` |
| milestones | the project page's `Schedule` view | `url`, `Ref`, `Name`, `Status`, `date:Dates:start`, `date:Dates:end`, `date:Finished:start`, `Order`, `page` |
| tasks | the project page's `Tasks` table view | the milestone keys, plus `Milestone`, `Waiting on`, `Side` |
| problems | root Problems `Open` and `Recently resolved`, this project's rows | `url`, `Ref`, `Name`, `Type`, `Status`, `Summary`, `Waiting on`, `date:Opened:start`, `date:Resolved on:start`, `Milestone`, `Task`, `Side`, `page` |

- `url` and the relations (`Milestone`, `Task`) become bare page ids — 32 hex characters, no dashes, no `https://app.notion.com/p/`; relations stay JSON arrays (`"[\"3000…0110\"]"`). Empty values and Dropped rows are left out.
- **`Ref`** goes in with its prefix (`"TK-34"`, the prefix from the config's `ref_prefixes`), since the view gives only the number.
- **`page`**: the page's public parts as fetched — the description, `## Notes` and `## History` with their headings; for a project, only what follows its `</tabs>`. `## Private notes` is cut out whole, from its heading to the next one. A `<mention-page …>Title</mention-page>` becomes `Title`; a file keeps its name and loses its source. A public sub-page (`<page url="…">Title</page>` under `## Notes`) is fetched and its body goes into `"subpages": {"<page id>": "<body>"}` at the top level, cleaned the same way. An empty page leaves the key out.
- Several projects: in the order the user named them.
- **`Side`**, on every task and problem with `Waiting on`: `client` when `Waiting on` is the project's `Client`, or a name in a `Client side:` private note on the project page (fetched for its views anyway); otherwise `third` (a laboratory, a supplier, a freelancer — and anyone not named so yet). The same rule on every refresh, so a side never flips on its own. The user's word ("Gilad is on the client's side") is saved as a private note on the project page — `**Oct 7** — Client side: Gilad` — and refreshes the dashboard. On the page, blockers and questions nobody else has to act on show as "On our side", risks apart.

## Keeping it current

SKILL.md (**Every change**, step 3) says which changes refresh a dashboard. Refresh once per reply, after all the writes and before the reply:

1. Read the artifact (`action: "read"` with the link — a publish over an artifact this conversation has not read is refused). It saves the page to a local file.
2. Write `data.js` from fresh reads of every project whose row holds the same link (from `Active` and `Closed`; a Removed project drops out): its rows from the views, and `page` (and `subpages`) fetched fresh for every page written in this conversation; the other pages keep their `page` from the published `data.js` (Artifact `action: "read"`, `path: "data.js"`), so a refresh does not refetch every page. "Update the client dashboard" refetches them all — the way to pick up edits made in Notion by hand. A published `data.js` without any `page` key was made when the dashboard showed no page content: before this first refresh with pages, run **Make one** step 2 on every covered page and refresh only after the user has answered — until then it keeps showing the previous state, and the reply says so.
3. The saved page's first line, `<!-- client-dashboard-version: N -->`, the same as `assets/client.html`'s → publish to that `url` with `file_path` the saved page and `files: {"data.js": …}` only; the shared files already there are kept. A different or missing version → rebuild the whole folder as in **Make one** and publish all four files, so the page moves to the plugin's current one. The reply gets one closing line, `Client dashboard updated.` A refresh that fails is not a tracker write and does not stop anything: one line saying the dashboard still shows the previous state and why; the next change, or "update the client dashboard", tries again.

A conversation that only reads refreshes nothing. "Update the client dashboard" refreshes it on request.

**A project removed** (`references/plan-changes.md`) keeps its link, so a restore brings it back to the page. When it was the dashboard's last project still shown, ask whether to take the dashboard down (**Remove**) instead of publishing an empty page.

## Change what it covers, or remove it

- **Add or drop a project** ("add Hub support to the ArcLive dashboard"): set or clear its `Client dashboard`, then refresh. Dropping the last one is removing it.
- **Remove** ("удали клиентский дэш Valokuu", "take the client dashboard down"): the link stops working for everyone who has it, so first say so and ask (one line with the link). On yes: delete the artifact (Artifact `action: "delete"` with the link), then clear `Client dashboard` on every project that holds it. No artifact tool → clear the field and tell the user to delete the page from claude.ai.
