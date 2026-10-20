# Dashboard — publish and update

`assets/dashboard.html` is the user's live view of the pipeline: leads, Your move (replies, invitations, offers, overdue milestones), contracts, proposals, connects and balance. It reads Notion and Upwork with the viewer's own connectors, asks Claude (`sample`) for chat summaries and keeps them, with the chats the user parks, in the artifact's own store (`db`); it has no server side. It writes to Notion only on a click: Applied / Skip / Restore (`Status`, `Decided on` and the skip fields of a card), Lock / Unlock (`Locked`), the Settings switches (`auto_drafts`, `auto_skip` in the config), and Write / Rewrite (the job's proposal row set to `State` Writing, created when there is none, the card's `Locked` ticked, then the drafts task started with `fire_trigger` — `references/drafts.md` §1). It never writes to Upwork. Its Claude chat links start the chats `references/chat.md` → *A job's chat* describes.

Who publishes or updates it, and when, is *When* below. Inputs: `assets/dashboard.html` and the config's values for its placeholders (*Publish*). Output: the published page, its URL and version in the config.

## When

The asset's first line is `<!-- dashboard-version: N -->`, N being the plugin's version (`x.y.z`), stamped by the release; read only that line for the check. The config's `dashboard_version` is the version the user's dashboard was last published from (no line = 1; a whole number, from before versions followed the plugin, is older than any `x.y.z`).

- **Below N → republished without asking** (*Update* below): a newer plugin's dashboard is part of the update the user installed, and an old page can misread data the new skill writes. Scheduled runs have no Artifact tool, so they leave it: the hourly run writes `skill_version` (`references/hourly.md` §6), and the page, finding its own version below that, marks its status outdated and, in the status details, gives the command `/upwork-pulse:upwork-pulse update` with a copy button — the slash form loads this skill, which opening a chat or a plain message may not. That command is the request for the update (SKILL.md → modes table): the pipeline update first when `schema` is behind, then *Update*, then one line that the dashboard was updated and, from the plugin's `CHANGELOG.md` (at the plugin root, next to `skills/`) between the two versions, what is new on it in a few words. A conversation about something else that finds the page older does the same after answering. A session that cannot publish says so (*No Artifact tool*); a publish that fails is not retried in the same conversation.
- **No `dashboard` line** (set up before the dashboard existed, or the user removed it): in a conversation only, once per conversation and unless the config has a `dashboard_skip` line, end with one short line in `language` — what the dashboard is and whether to publish it now. Yes → *Publish*; no → `dashboard_skip: none`. Automatic runs never publish a dashboard the config has none of.
- **Setup** publishes it (`references/setup.md` §7); a pipeline update republishes it first (`references/update.md`).

## Publish

1. Copy `assets/dashboard.html` to a working file and replace every placeholder, nothing else (keep the first line):

   | Placeholder | Value |
   |---|---|
   | `__ROOT_PAGE__` | the root page id (the page reads the config there on every load) |
   | `__UPWORK_ORG__` | config `upwork_org` |
   | `__TIMEZONE__` | config `timezone` |
   | `__VIEW_INBOX__`, `__VIEW_APPLIED__`, `__VIEW_SKIPPED__` | config `jobs_inbox`, `jobs_applied`, `jobs_skipped` |
   | `__VIEW_PROPOSALS_OPEN__`, `__VIEW_PROPOSALS_SENT__` | config `proposals_open`, `proposals_sent` |
   | `__VIEW_RUNS__`, `__VIEW_QUESTIONS__` | config `runs_latest`, `questions_open` |
   | `__QUESTIONS_URL__` | config `questions_open` without its `?v=…` part (the Questions database) |

   Where a shell with Node is available, check that the page's script still parses (`node --check` on the contents of the last `<script>` block): a page whose script fails shows "Connecting…" forever and no error.
2. Publish it with the Artifact tool (load the artifact-capabilities skill first where the surface has it), title `Upwork Pulse`, icon `pulse`, with exactly these capabilities:

   ```json
   {"mcp": {"servers": [
     {"server": "Notion", "tools": ["notion-query-data-sources", "notion-fetch", "notion-update-page", "notion-create-pages"]},
     {"server": "Upwork", "tools": ["upwork__get_freelancer_dashboard", "upwork__get_freelancer_financials", "upwork__get_messages", "upwork__list_freelancer_proposals", "upwork__list_milestones", "upwork__list_contracts", "upwork__find_jobs"]},
     {"server": "Claude Code Remote", "tools": ["fire_trigger"]}]},
    "sample": {}, "db": {}}
   ```

   `find_jobs` tells how an on-hold proposal's job ended, `list_contracts` gives a contract's job, `fire_trigger` starts the drafts task, `sample` writes the chat summaries, and `db` keeps each chat's summary and park in the artifact, the same on every device (it makes the page private to the user's organization; it is the user's own page anyway). Say that the user opens it once and allows the connectors and Claude.
3. Write the URL into the config as `dashboard` and the asset's N as `dashboard_version` (add the lines if missing).

## Update

The same link, so the user allows nothing again — a new artifact for an existing dashboard would ask for every connector anew; avoid it.

1. Read the artifact first: `action: "read"` with the `dashboard` URL (the surface refuses a publish over an artifact this conversation has not read), then the full page it saves, every line, as the read result says (the Read tool in chunks, by offset and limit) — the surface counts the page as read only then. It is a few thousand lines once per release: the price of the update, never a reason to put it off.
2. *Publish* step 1, then publish to that URL with the capabilities of step 2 in full: a publish without them keeps the set the page was first published with, and a tool a newer page calls would be refused.
3. `dashboard_version` = N.

Only a publish that fails after the read waits for the next conversation.

## No Artifact tool

Still do *Publish* step 1: write the filled file into the working directory (`upwork-dashboard.html`), tell the user where it is and that a claude.ai artifact with the `mcp` capability (or any page that can call their Notion and Upwork connectors) can host it.

Off limits here: any change to the page beyond its placeholders (*Publish*); a new artifact for a dashboard the config already has (*Update*); a dashboard from an automatic run when the config has no `dashboard` line (*When*).
