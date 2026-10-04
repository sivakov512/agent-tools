# Dashboard — publish, update, and what it is for

`assets/dashboard.html` is a calm, read-only overview of the tracker: it reads Notion with the viewer's own connector and computes everything else in the browser. Notion stays the source of truth and the client-facing page; the chat stays the only way to change anything, because the rules in SKILL.md (dates move only by agreement, history lines, was → now) live there. The dashboard is for the user alone.

## Who uses it, when — the scenarios

The user runs a few projects at once — Upwork contracts, direct clients, their own. The page is built from these moments; anything that serves none of them does not belong on it.

| # | Moment | Question | Answered by |
|---|---|---|---|
| 1 | Morning glance, 10 s | Is anything on fire, what is on me? | the **pills** in the header, **Your move** |
| 2 | How is each project, overall | State, what is happening now, how far along, when it ends | a **card** per project |
| 3 | Sitting down to work on a project / before a client call | Where did I stop, what is next, what is open, what did we agree? | the **project page** that opens from the card: Now / Next / Blocked, open items, the plan with each milestone's history, notes |
| 4 | Chasing | Whom do I write to, how long have they had it? | **Waiting on others** |
| 5 | Taking new work | Where are projects in time, where do they collide? | **Timeline** |
| 6 | Friday | What got done? | **Recently completed** |

## Criteria it is checked against

- **Opened, read in seconds.** One screen on a laptop for a normal load (up to ~4 projects): pills in the header; the timeline (the overview of everything) and the project cards under it (each project in more detail) on the left; Your move, Waiting on others, Recently completed on the right. No menus or tabs. Phones stack: pills, Your move, timeline, cards, Waiting, Recently completed.
- **Calm.** One typeface; colour only where something needs attention (red: blocked or overdue; amber: due soon, within 7 days); one coloured signal per item; few boxes, no boxes inside boxes on the overview; short phrases in plain words, the words other trackers use (Overdue, Due soon, Recently completed).
- **Details one click away, never in Notion.** A card, a project name, a bar or any list item opens that project as a page sliding in from the right, scrolled to the item that was clicked and with it open. Items there open in place (a milestone shows its facts, issues and History from its page; an issue its note and page; notes their sub-pages). Every opened thing links to Notion for sharing or editing. ↑ / ↓ (and the arrows in the drawer's bar) step to the previous / next project; Esc closes.
- Every project's state is said the same way everywhere: `Blocked`, `3 d late`, `Due in 5 d`, `On track`, `No dates`, `Paused`.
- Nothing moves on its own: placeholders of the same size until the first full set of data, then updates in place (scroll, open items, fetched page text kept; a refresh never blanks).
- Honest when part of it fails: a pill shows `?` or `n+` for counts built on data that did not load, the card says what did not load, and no count is stated as zero for data that was not read.
- Nothing is hidden because it is zero: the three pills are always there, grey at zero.
- Light and dark; phone to wide desktop.
- **Same family as the Upwork Pulse dashboard**, so the user's tools look like one set. Shared, and changed in both pages together: system font (no web fonts), 14px base; teal accent and green-grey neutrals; 10px cards with a thin border and no shadow; a section's title sits above its card with the count right after the title and ⓘ (if any) right after that, controls pushed right; header pills (a fixed set, coloured only when not zero); segmented tabs; list rows with a 3px rounded mark inset 10px from the edge, text from 22px, a line between rows, 14.5px titles and 13px secondary text; group labels as grey uppercase bands; a `Live · updated hh:mm` line with a Refresh button; the drawer — 680px, tinted head with a 26px title, plaques fully tinted with a border (never a coloured side stripe), foldable sections with an icon, Back to top, ↑ / ↓. Page width may differ: the tracker is 1440px for the timeline, Pulse 1180px.

## Structure

- **Header**: name, origin filter (only when there is more than one kind), three pills — `blocked` · `overdue` · `due soon` — always shown, coloured when not zero, a click scrolls to Your move; updated time, refresh, Notion. How many things are on the user and whom they wait on are the counts next to Your move and Waiting on others, not pills.
- **Project cards**, sorted failed → blocked → late → nearest due, paused last: name, client · origin, state pill; the milestone in focus (Now / Overdue / Next / Paused) with its timing; a blocker if any; a strip of all milestones; milestones done, end date, how many items are on the user and waiting.
- **Timeline** (above the cards, so it stays in view however many projects there are): a row per project, bars for milestones with today marked, zoom 3 / 6 months / all, Today, drag or scroll in time, legend behind ⓘ. Open milestones without agreed dates are outlined placeholders from today.
- **Your move**: only what asks for an action now — Blocked → Overdue → Due soon → On you (tasks and questions) → Needs agreed dates. Risks are not a move: they live on the project card's count and in the project page under Risks to keep in mind.
- **Waiting on others**: by party, oldest first, with ages.
- **Recently completed** (collapsed): milestones finished and items resolved in the last 7 days.
- **Project page** (slides in from the right), built of visibly separate blocks so the eye finds each one: a tinted head (client · origin, name, state, summary); the status note as its own tinted, bordered card headed Status; a Where it stands box (Now / Overdue / Next / Blocked, each a tag and a line; click jumps to the item); three number tiles (ends; milestones done with a strip; open items — the last two are buttons that unfold and scroll to their section) and links; then sections with an icon, a title and a count, each in its own panel and foldable from its header (all open on every visit; an item opened from elsewhere unfolds its section) — Open items grouped as Blocking / On you / Waiting on others / Risks to keep in mind with a type tag on each; Milestones grouped by phase with done-of-total per phase, each milestone with dates and a short phrase (`8 d left`, `done Sep 21, on time`, `starts in 8 d`); Notes. A round Back to top button appears once the page is scrolled down.

**Origin** is derived, since the tracker has no field for it: `Source` on upwork.com → Upwork; empty `Client` → Personal; anything else → Direct. A select property `Origin` on Projects, if the user adds one, wins over the rule.

Rules the page keeps:

- **Lateness by the same rule as the Notion formula** (SKILL.md, *How lateness works*), computed from the dates on every load against the viewer's local today. A paused milestone, or any milestone of a paused project, is never late. Open milestones without agreed dates are drawn as dashed placeholders from today and listed under Needs agreed dates, never as due or late.
- **Read-only.** No writes to Notion, no buttons that pretend to change state; the footer says changes go through the chat.
- **Views and page fetches only**, never SQL — same reason as in SKILL.md. The page discovers everything from the root page: config IDs → databases → views by name → each project page's `Schedule` view. Page text (history, notes, issue pages) is fetched when a row opens and kept for the session. Only the root page ID is filled in at publish.
- **Freshness and failures.** "Updated hh:mm" comes from the connector cache time. What did not load is marked on the pills and named on its card, a failed project keeps its card and timeline row and goes first, each failure shows the fix for its error code, and "nothing late" is never claimed for data that was not read.

## Publish

1. Copy `assets/dashboard.html` to a working file and replace `__ROOT_PAGE__` with the root page ID. Nothing else changes; keep the first line, `<!-- dashboard-version: N -->`. Where a shell with Node is available, check that the last `<script>` block parses (`node --check`) — a script that fails leaves the page on "Connecting…".
2. Publish it as an artifact with the Notion connector: `capabilities: {mcp: {servers: [{server: "Notion", tools: ["notion-fetch", "notion-query-data-sources"]}]}}`, title `Project Tracker`. The server is the connector's display name in claude.ai; if the user's Notion connector is named differently, use that name.
3. Add two lines to the config toggle (`update_content` inside the toggle, after the last ID line): `dashboard: \`<artifact url>\`` and `dashboard_version: N` — N from the asset's first line.

**Updating** an existing dashboard: read the artifact first (`action: "read"` with the `dashboard` URL — the surface refuses a publish over an artifact this conversation has not read), then publish a freshly filled copy of the asset to that URL with the same capabilities, and set `dashboard_version` in the config to the asset's N (add the line if it is missing). The link stays the same. No artifact tool on this surface → write the filled file into the working directory as `project-dashboard.html`, tell the user where it is, and that it needs a page able to call their Notion connector (a claude.ai artifact with the `mcp` capability) to show data.

## Versions

The asset's first line carries the plugin's version, stamped by the release on every release (the line is marked `x-release-please-version`); SKILL.md (*Dashboard updates*) compares it with the config's `dashboard_version` and offers the user an update. No hand edits: a release that did not change the page still offers it, and updating then republishes the same page.

The page shows only what the tracker holds. If the user wants a new section, first check it against the table above: which moment it serves, and whether the data is already in Notion.
