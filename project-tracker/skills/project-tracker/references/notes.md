# Long notes and files

SKILL.md (**Notes and files**) has what goes into the `Notes` tab and the short-note form. Longer material:

- **Long text** (call notes, a spec, an email thread): `notion-create-pages` with the project page as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the project page, so move it into the tab with one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the tab's last line → that line plus the same `<page url="…">…</page>` line. Notion rejects the page line appearing twice, so both edits go in the same call.
- **File**: upload with the file-upload tool and add its `suggested_markdown` like a short note, with one line saying what it is.
