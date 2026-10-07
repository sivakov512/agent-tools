# Notes and files

SKILL.md (**Notes and files**) has what goes into the project's `Notes` tab, what goes onto a milestone's, task's or problem's own page, and the short-note form for the tab.

## In the project's Notes tab

- **Long text** (call notes, a spec, an email thread): `notion-create-pages` with the project page as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the project page, so move it into the tab with one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the tab's last line → that line plus the same `<page url="…">…</page>` line. Notion rejects the page line appearing twice, so both edits go in the same call.
- **File**: upload with the file-upload tool and add its `suggested_markdown` like a short note, with one line saying what it is.

## On a row's page

A milestone's, task's or problem's page holds its notes first, then its history. A note is a paragraph — `**Oct 7** — text`, or the long text and files below — and never a list item: a list line starting with a date is history (`- **Oct 7** — …`), and the dashboard tells the two apart by exactly that, showing them as Notes and History.

- **Short note**: `update_content` with `old_str` = the page's first history line, `new_str` = the note, a blank line, then that line. A page with no history yet → `insert_content` at the end.
- **Long text**: `notion-create-pages` with the row's page as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the page. With history on the page, move it above the history in one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the first history line → the same `<page url="…">…</page>` line, a blank line, then that history line. Without history it already sits right.
- **File**: upload with the file-upload tool and place its `suggested_markdown` like a short note, with one line saying what it is.
