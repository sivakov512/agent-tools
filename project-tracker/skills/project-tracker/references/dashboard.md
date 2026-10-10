# Dashboard — publish and update

`assets/dashboard.html` is the user's live, read-only overview of the tracker — pills, timeline, a card per project, Your move, Waiting on others, Risks, Recently completed, and a page per project sliding in from the right. It reads Notion with the viewer's own connector; the chat stays the only way to change anything, because the rules (dates move only by agreement, history lines, was → now) live in SKILL.md. It is for the user alone; a client gets a client dashboard (`references/client-dashboards.md`), which runs the same code (`assets/app.js`, `assets/core.js`, `assets/core.css`) on a snapshot.

## Publish

1. A working folder `project-dashboard/` in the scratch or working directory — the Artifact tool takes files only from there, not from the skill's own directory; copy with a shell (`cp`) where there is one, else Read each file and Write it there unchanged — long, but the only way, so it is done, not asked about. Into it: `assets/dashboard.html` as `index.html`, with `__ROOT_PAGE__` replaced by the root page ID and nothing else changed (keep the first line, `<!-- dashboard-version: N -->`); and `assets/app.js`, `assets/core.js`, `assets/core.css` as they are. The page is finished, designed and checked: no design pass, no preview loop, nothing to test.
2. Publish it as an artifact with the Notion connector: `file_path` the folder's `index.html`, `files: {"app.js": …, "core.js": …, "core.css": …}`, each the folder's copy (the page loads them by these names; without them it stays blank), `capabilities: {mcp: {servers: [{server: "Notion", tools: ["notion-fetch", "notion-query-data-sources", "notion-get-file-download-urls"]}]}}`, title `Project Tracker`, icon `chart`, description "Live overview of the project tracker in Notion". It reads data only when opened, so say the user should open it once and allow the Notion connector. The server is the connector's display name in claude.ai; if the user's Notion connector is named differently, use that name.
3. Add two lines to the config toggle (`update_content` inside the toggle, after the last ID line): `dashboard: \`<artifact url>\`` and `dashboard_version: N` — N from the asset's first line.

**Updating** an existing dashboard: the tracker's `schema` comes first — below the skill's (`setup.md` → **Tracker update**), run the update before publishing, since the new page reads what the update adds. Then read the artifact first (`action: "read"` with the `dashboard` URL — the surface refuses a publish over an artifact this conversation has not read), then rebuild the working folder from the assets as in step 1 and publish it to that URL with the same capabilities and all three shared files (they change with the page), and set `dashboard_version` in the config to the asset's N (add the line if it is missing). The link stays the same. No artifact tool on this surface → the folder is the result: tell the user where it is, and that it needs a page able to call their Notion connector (a claude.ai artifact with the `mcp` capability) to show data.

## Versions

The asset's first line, `<!-- dashboard-version: N -->`, carries the plugin's version (`x.y.z`), stamped by the release on every release (the line is marked `x-release-please-version`). No hand edits: a release that did not change the page still offers it, and updating then republishes the same page. The config's `dashboard_version` is the version the user's dashboard was last published from; SKILL.md says how a missing or old-style value compares.

The offer itself — when it is due and what it says — is in SKILL.md (**Dashboard updates**); a yes comes here: **Publish**, or **Updating** for an existing dashboard (it keeps the link and sets `dashboard_version` to N).

A change to the page itself — a new section, a different look — is a change to the plugin, not to the tracker: say so, and that it ships with a plugin release; the page shows only what the tracker holds.

