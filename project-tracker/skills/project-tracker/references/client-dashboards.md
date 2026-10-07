# Client dashboards — make, keep current, remove

A client dashboard is a page the user gives a client: one project, or several projects of one client. It is the user's own dashboard (`references/dashboard.md`) — pills, the timeline, a card per project, the project page sliding in from the right with where it stands and the plan, lateness, risks, Recently completed — with one change on the right: a single list of open items by whose side they are on (the client's, ours, third parties'), in place of Your move and Waiting on others.

**Structure only.** It shows how the work is going and nothing anyone wrote: names, statuses, dates and lateness of projects, milestones, tasks and problems, problem types, and who is waited on. Never any free text — no `Summary`, no problem `Note`, no page content (histories, notes, status callouts), no Notion links, chats, origin, source, repository or Claude project. The user writes those for themselves and must never have to think about who reads them; leaving them out of the data is what keeps them private, not care in wording. Names do show, so they stay neutral, as everywhere in the tracker.

It is a snapshot, not live: `assets/client.html` runs the dashboard's own code (`assets/app.js`, with `assets/core.js` and `assets/core.css`) on a `data.js` that the skill writes and republishes after every change to what it covers. The client needs no Notion access and no connector; lateness is computed in the browser against the viewer's today, so it stays right between updates.

## Where the link lives

In the Projects field `Client dashboard` (URL) of every project it covers — one project's row, or the same link on each of several projects' rows. The field is the dashboard's record: a change to a project with a link refreshes that dashboard, and the dashboard covers exactly the projects that hold its link.

One dashboard per project: asked for one on a project that already has a link, give that link (and offer to change what it covers) instead of making a second. A milestone gets no dashboard of its own — its project's dashboard shows it. A tracker below `schema: 3` has no such field: the update in `references/setup.md` comes first.

## Make one — "сделай клиентский дэш для Valokuu", "a dashboard for ArcLive with both projects"

1. **What it covers.** The project, or the projects named. Several projects must share a `Client` (so must a project added later); if the user names a client, offer its active projects and ask which. Nothing is published before the scope is clear.
2. **A working folder** `client-dashboard-<short name>/` in the scratch or working directory — the Artifact tool takes files only from there, not from the skill's own directory; copy with a shell (`cp`) where there is one. Into it: `assets/client.html` as `index.html`, with `__TITLE__` replaced by the page's title — the project's name, or the client's name for several projects, followed by ` — status` (`Valokuu toothbrushing timer — status`), nothing else changed; `assets/core.js`, `assets/core.css` and `assets/app.js` as they are; and `data.js` (below), built from fresh reads.
3. **Publish** with the Artifact tool: `file_path` the folder's `index.html`; `files: {"core.js": …, "core.css": …, "app.js": …, "data.js": …}`, each the folder's copy; icon `chart`; description `Project status for <client>`; no `capabilities` (it reads nothing live).
4. **Store the link** in `Client dashboard` of every covered project (this changes nothing the page shows: no refresh).
5. **Tell the user**, in a few lines: the link; that it is private until they share it from the page's Share menu; that it updates itself after every change to its projects; that "remove the client dashboard" takes it down; and every `Waiting on` the data puts with third parties that might be the client's (**Side**, below), so they can say otherwise.

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
| project | root Projects `Active` (or `Closed`) | `url`, `Name`, `Client`, `Status`, `date:Target end:start` |
| milestones | the project page's `Schedule` view | `url`, `Name`, `Status`, `date:Dates:start`, `date:Dates:end`, `date:Finished:start`, `Order` |
| tasks | the project page's `Tasks` table view | the milestone keys, plus `Milestone`, `Waiting on`, `Side` |
| problems | root Problems `Open` and `Recently resolved`, this project's rows | `url`, `Name`, `Type`, `Status`, `Waiting on`, `date:Opened:start`, `date:Resolved on:start`, `Milestone`, `Task`, `Side` |

- `url` and the relations (`Milestone`, `Task`) become bare page ids — 32 hex characters, no dashes, no `https://app.notion.com/p/`; relations stay JSON arrays (`"[\"3000…0110\"]"`). Empty values and Dropped rows are left out.
- Several projects: in the order the user named them.
- **`Side`**, on every task and problem with `Waiting on`: `client` when `Waiting on` is the project's `Client`, or a name in a `Client side:` note in the project's Notes tab (the project page, fetched for its views anyway); otherwise `third` (a laboratory, a supplier, a freelancer — and anyone not named so yet). The same rule on every refresh, so a side never flips on its own. The user's word ("Gilad is on the client's side") is saved as a note in the project's Notes tab — `**Oct 7** — Client side: Gilad` — and refreshes the dashboard. On the page, blockers and questions nobody else has to act on show as "On our side", risks apart.

## Keeping it current

SKILL.md (**Every change**, step 3) says which changes refresh a dashboard. Refresh once per reply, after all the writes and before the reply:

1. Read the artifact (`action: "read"` with the link — a publish over an artifact this conversation has not read is refused). It saves the page to a local file.
2. Write `data.js` from fresh reads of every project whose row holds the same link (from `Active` and `Closed`; a Removed project drops out).
3. The saved page's first line, `<!-- client-dashboard-version: N -->`, the same as `assets/client.html`'s → publish to that `url` with `file_path` the saved page and `files: {"data.js": …}` only; the shared files already there are kept. A different or missing version → rebuild the whole folder as in **Make one** and publish all four files, so the page moves to the plugin's current one. The reply gets one closing line, `Client dashboard updated.` A refresh that fails is not a tracker write and does not stop anything: one line saying the dashboard still shows the previous state and why; the next change, or "update the client dashboard", tries again.

A conversation that only reads refreshes nothing. "Update the client dashboard" refreshes it on request.

**A project removed** (`references/plan-changes.md`) keeps its link, so a restore brings it back to the page. When it was the dashboard's last project still shown, ask whether to take the dashboard down (**Remove**) instead of publishing an empty page.

## Change what it covers, or remove it

- **Add or drop a project** ("add Hub support to the ArcLive dashboard"): set or clear its `Client dashboard`, then refresh. Dropping the last one is removing it.
- **Remove** ("удали клиентский дэш Valokuu", "take the client dashboard down"): the link stops working for everyone who has it, so first say so and ask (one line with the link). On yes: delete the artifact (Artifact `action: "delete"` with the link), then clear `Client dashboard` on every project that holds it. No artifact tool → clear the field and tell the user to delete the page from claude.ai.
