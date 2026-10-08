# Notes and files

SKILL.md has the page's parts (**Pages**), which of them the client sees (**Who sees what**), and where a short note goes (**Bodies**). This file is for what is longer than a line.

**Material that already lives somewhere** — a doc, an email, a web page, a file on a drive, a chat — is not copied in: the note is a short summary of what matters plus a link to it (`**Oct 2** — Factory flashing checked with JLCPCB: … [JLCPCB — firmware flashing at the factory](https://…)`). A copy would only drift from its source. Long text and files below are for material with no home of its own: call notes, an email thread or a spec pasted into the chat, a file the user hands over.

Whether it goes under `## Notes` or `## Private notes` is decided by **Who sees what**, for a sub-page as for a line: a client dashboard shows a public sub-page's text, and a file by its name only.

- **Long text**: `notion-create-pages` with the page (project, milestone, task or problem) as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the page. Unless its section is the last part on the page (a private note on a page without history, say), move it there in one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the next heading present (**Bodies**) → the same `<page url="…">…</page>` line, a blank line, then that heading. Notion rejects the page line appearing twice, so both edits go in the same call. A first entry of its section brings the heading, as for a short note.
- **File**: upload with the file-upload tool and place its `suggested_markdown` like a short note, with one line saying what it is.
