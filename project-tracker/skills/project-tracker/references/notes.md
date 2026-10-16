# Long text and files

SKILL.md decides what is kept (**What is worth writing**), where (**Every record goes where it belongs**), whether it is private (**Who sees what**) and how a short note is written (**Pages**, **Bodies**). This file is the mechanics for what is longer than a line.

Started by long text or a file to save (SKILL.md → **Notes and files**).

**Inputs:** the text or file, and the page and part SKILL.md chose for it.

- **Long text** — call notes, a spec or an email thread the user pasted, with no home of its own: a sub-page, so the source is kept as given. `notion-create-pages` with the page (project, milestone, task or problem) as parent, title `<subject>`, with `Mon D — ` in front only for dated material (call notes, an email thread); it lands as a `<page …>` line at the end of the page. Unless its part is the last on the page (a private note on a page without history, say), move it there in one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the next heading present (**Bodies**) → the same `<page url="…">…</page>` line, a blank line, then that heading. Notion rejects the page line appearing twice, so both edits go in the same call. A first entry of its part brings the heading, as for a short note. A client dashboard shows a public sub-page's text.
- **File**: choose its place first — once uploaded, a file block cannot be moved or removed with these tools, only by hand in Notion. Then upload with the file-upload tool and place its `suggested_markdown` like a short note, with one line saying what it is. A client dashboard shows a file by its name only. The upload sends the file to `api.notion.com`; where the surface blocks that host, say so and ask the user to allow it, rather than leaving the file out or pasting its text instead.

## Output

A sub-page or a file block in its part, named in the reply by where it is and what it holds.

## Off limits

Uploading a file before its place is settled; pasting a file's text, or leaving it out, where the upload is blocked.
