# Chats from the dashboard

The dashboard has a **Claude chat** button on a project and on each of its milestones, tasks and problems. The first click starts a chat whose first message names the row: `<Project / Milestone / Task / Problem>: <name>[ — <project>] (Project Tracker, <page url>). Load it.` — kind and name first, so the app titles the chat by them. Later clicks on that row open the same chat, through the row's `Chat`; the ▾ beside the button starts it over with `Its old chat is gone: this is its chat from now on.` before the last sentence. The chat is that row's thread: keep its context, and handle whatever the user says in it with the usual scenarios and rules — they may well change other rows of the project.

## The first message

1. **Claim the row first**, before loading anything — before a due Tracker update too (SKILL.md → **Finding things**), which then runs before step 2 — so a second click lands here. This session's own link is `https://claude.ai/code/session_<id>` — the session id is in the session's context (Cowork gives it, e.g. in the line it asks to end commits with); never guess it. Fetch the page by the URL in the message, then:
   - **Not a row of this tracker** — its parent data source is not one of the config's `projects`, `milestones`, `tasks`, `problems` IDs (find the root as SKILL.md → **Finding things** says), or it is deleted, or the tracker is 0.x → say so in one line and stop.
   - **No `Chat` property** → a pre-release 1.0 tracker: load and answer as below, write nothing, and say in one line that setup adds the column (`setup.md` step 2).
   - `Chat` empty → write this link to it (`update_properties`, `Chat`).
   - `Chat` holds another session's link → this row has its chat: one line with that link ("this already has a chat — continue there: <link>") and stop; write nothing. When the first message says the old chat is gone, or the user says so in this chat → write this link over it, without asking.
   - No link of its own in the session's context → load and answer anyway, and say in one line that the dashboard will not reopen this chat.
2. **Load it with its surroundings**, in as few turns as the calls allow: the row (properties and history); its project's callout and `Summary`; for a project — its `Schedule`, `Tasks` and `Problems` views; for a milestone — its tasks and problems; for a task — its milestone and its problems; for a problem — the milestone or task it is on.
3. **Reply** in one or two lines, in the user's language: the row and its state (status, dates, lateness by the rule, what it waits on). No overview, no suggestions: the chat is for the user's own questions, and what to do next is theirs to say. The **Overdue check** applies as usual.

The claim and this reply are an exception to SKILL.md's "never change something silently": the `Chat` write is not reported (unless it failed) and needs no was → now line. The dashboard-update offer (SKILL.md → **Dashboard updates**) is skipped in this first reply; it may come later in the chat.

## Claude project

Each tracker project has its own claude.ai project for its chats: the Projects field `Claude project`, written `<name> — <project id>`, empty = none. The dashboard starts every chat of that project — the project's own and its milestones', tasks' and problems' — inside it on the phone and the web, and shows it on the project page; the desktop app's link cannot name a project, so there new chats open outside projects.

- **The id** is the project's claude.ai UUID, the one in a link to it (`claude.ai/project/<id>`). A session sees it only in a link the user gives, or — for the project this conversation is in — in a project-scoped path in its tools' instructions (such as a memory scope `/projects/<id>/`), with the name its context gives; never guessed. A name alone cannot be resolved: ask for the project's link. A link without a known name → write the id alone; the dashboard then calls it "Claude project".
- **Set when the project is created** (`new-project.md` → Confirm), only if the config has a `dashboard` line: asked in the confirmation, with this conversation's project as the default when there is one. An OK that skips the question takes the default offered; "none" → empty.
- **Changed when the user asks** — "open its chats in <link>", "in this project" (this conversation's project), "no project" → `update_properties`, `Claude project`; a record of a fact, no preview, with the usual was → now reply.
