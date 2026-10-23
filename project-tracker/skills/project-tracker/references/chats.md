# Chats and Code sessions from the dashboard

Every project, milestone, task and problem on the dashboard has two threads, side by side: a **chat** (Cowork, on the Mac or the phone), its link kept in the row's `Chat`, and a **Code session** (Claude Code on the Mac, working in the project's folder), its link kept in the row's `Code session`. The dashboard starts either one with a first message that names the row and the thread: `<ID> <name>[ — <project>] (Project Tracker, <page url>). [Code session[, repository <Repository>]. ]Chat title: "<the same ID, name and project>". Load it with the project-tracker skill.` — the words `Code session` say that this session is the row's Code session, and the app titles a session by a guess of its own, which the user would otherwise rename by hand, so the session names itself (step 1); a row's chat and Code session carry the same title, since the app already shows which is which. Later clicks open the thread saved in the row; one started over carries `Its old chat is gone: this is its chat from now on.` (`Its old Code session is gone: this is its Code session from now on.`) before what follows the page URL. Either thread is that row's: keep its context, and handle whatever the user says in it with the usual scenarios and rules — they may well change other rows of the project. The row is where its records go by default, not always: SKILL.md → **Every record goes where it belongs**.

Started by a first message that names a row "(Project Tracker, <url>)", or by a request to change where a project's chats or Code sessions open.

**Inputs:** the first message — the row's ID, name and page URL (its kind is its data source), whether it says `Code session`, its `Chat title`, whether the old thread is gone; this session's own link (and, for a Code session, the folder it was opened in).

## The first message

1. **Claim the row first**, before loading anything — before a due Tracker update too (SKILL.md → **Finding things**), which then runs before step 2 — so a second click lands here. The message says which thread this is, and so which column it claims — never the other one, which belongs to the row's other thread:
   - a chat → `Chat`, with this session's own link `https://claude.ai/code/session_<id>` — the session id is in the session's context (Cowork gives it, e.g. in the line it asks to end commits with);
   - a Code session (the message says `Code session`) → `Code session`, with the `link` that `get_session` with `session_id: "self"` returns (`claude://claude.ai/epitaxy/local_<id>`), written as returned, since the dashboard opens it as it is.

   Never guess a link. Fetch the page by the URL in the message, then:
   - **Not a row of this tracker** — its parent data source is not one of the config's `projects`, `milestones`, `tasks`, `problems` IDs (find the root as SKILL.md → **Finding things** says), or it is deleted, or the tracker is 0.x or newer than the skill (SKILL.md → **Finding things**) → say so in one line and stop.
   - The column empty → write this link to it (`update_properties`).
   - The column holds another session's link → this row has its thread: one line with that link ("this already has a chat — continue there: <link>"; "this row already has a Code session — continue there: <link>") and stop; write nothing. When the first message says the old one is gone, or the user says so in this session → write this link over it, without asking.
   - No link of its own (no session id in the context, no `get_session`) → load and answer anyway, and say in one line that the dashboard will not reopen this session.

   **A Code session also fills its project's `Code folder`** when it is empty — part of the claim, before the reply. Read the project's `Code folder` and `Repository` from its row (the page itself for a project, else a fetch of the row's `Project`); write in the same write when the row is the project, else on the project's row — but only with a folder that holds that project's code, since every later Code session of the project opens there and a wrong one sends them all to another repository:
   - the folder is the one this session was opened in, `get_session` `self` → `originCwd`; without it, the working directory with a trailing `/.claude/worktrees/<name>` cut off — the repository's main checkout, never a `.claude/worktrees/…` path, which the app cleans up;
   - it is written only when its git remote (`git -C <folder> remote get-url origin`) names the project's `Repository`: the same host and path, whatever the form (`git@host:owner/repo.git`, `https://host/owner/repo`), letter case aside;
   - a remote that names another repository, a folder that is not a git repository or cannot be checked, or a project with no `Repository` → write nothing there, and end the first reply with one question: where this project's code lives on this Mac (the answer is set as **Code folder** below says).

   A `Code folder` that holds a path stays as it is.

   **The session's name** is the message's `Chat title: "…"`: set it with the tool that renames this session, at any point of this first reply — in the desktop app `set_session_title` with `session_id: "self"`. No such tool (a chat on the web) or a refusal (the user named the session already) → leave it. Either way not a word about the name in the reply: done, skipped or failed.
2. **Load it with its surroundings**, in as few turns as the calls allow: the row (properties and its page: description, notes, private notes, history); its project's `Summary` (already read in step 1 for a Code session); for a project — its `Schedule`, `Tasks` and `Problems` views; for a milestone — its tasks and problems; for a task — its milestone and its problems; for a problem — the milestone or task it is on.
3. **Reply** in one or two lines, in the user's language: the row and its state (status, dates, lateness by the rule, what it waits on). No overview, no suggestions: the session is for the user's own questions, and what to do next is theirs to say. The **Overdue check** applies as usual.

The claim, `Code folder`, the session's name and this reply are an exception to SKILL.md's "never change something silently": those writes and the name are not reported (unless one failed) and need no was → now line. The dashboard offer (SKILL.md → **The dashboard offer**) is skipped in this first reply; it may come later in the session.

## Where a project's threads open

**Claude project.** Each tracker project has its own claude.ai project for its chats: the Projects field `Claude project`, holding the project's link `https://claude.ai/project/<id>`, empty = none. Never its name: a rename in claude.ai never reaches the field, and nothing the skill or the dashboard can call reads the current name, so a stored one goes stale; refer to it by its link. A value of the older form `<name> — <id>` is read by the id in it, and the Tracker update rewrites it (`references/upgrade.md`, 7 → 8). The dashboard starts every chat of that project — the project's own and its milestones', tasks' and problems' — inside it on the phone and the web, and shows it on the project page; the desktop app's link cannot name a project, so there new chats open outside projects.

- **The id** is the project's claude.ai UUID, the one in a link to it (`claude.ai/project/<id>`). A session sees it only in a link the user gives, or — for the project this conversation is in — in a project-scoped path in its tools' instructions (such as a memory scope `/projects/<id>/`); never guessed. A name alone cannot be resolved: ask for the project's link.
- **Set when the project is created** (`references/new-project.md` §4), only if the config has a `dashboard` line: asked in the confirmation, with this conversation's project as the default when there is one. An OK that skips the question takes the default offered; "none" → empty.
- **Changed when the user asks** — "open its chats in <link>", "in this project" (this conversation's project), "no project" → `update_properties`, `Claude project`; a record of a fact, no preview, with the usual was → now reply.

**Code folder.** The Projects field `Code folder` is the absolute path on the Mac where the project's Code sessions open (the dashboard passes it to the app, which asks the user to confirm it); empty = the app asks for a folder. It is written as inline code (`` `/Users/me/Development/example.dev/meter` ``), and read as the path alone, whatever form it comes back in (SKILL.md → **A text value may come back as a link**): written plain, Notion links a domain-like part of it, and a linked path names a folder that does not exist. Filled by the project's first Code session opened in the project's own repository (step 1), or set when the user says where the code is — their word is the check ("its code is in ~/Development/wx" → `/Users/<user>/Development/wx`, `~` written out as this Mac's home folder; "no folder" → empty) — `update_properties`, a record of a fact, no preview, with the usual was → now reply. Code sessions exist only on the Mac: the dashboard on a phone shows none.

## Output

The claimed column — `Chat` or `Code session` — holding this session's link, an empty `Code folder` filled by a Code session, the session named after its `Chat title`, and a reply of a line or two on the row; or `Claude project` or `Code folder` set as asked.

## Off limits

In the first reply: any write but the claimed column and an empty `Code folder`, a word about the session's name, an overview, suggestions and the dashboard offer; a question other than where the project's code lives. A chat writing `Code session`, or a Code session writing `Chat`. A claimed column that holds another session's link, unless the old one is said to be gone; a `Code folder` that holds a path, unless the user changes it. A guessed session or project id; a `.claude/worktrees/…` path as `Code folder`, or a folder whose git remote is not the project's `Repository`.
