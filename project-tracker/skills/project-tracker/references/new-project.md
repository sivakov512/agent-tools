# New project

From a plan, estimate or email the user pastes or points to ("my last report in Sent", "the estimate in this PDF", "the Google Doc"), or from a platform contract — then `contracts.md` replaces steps 2–3 below; everything else is as here.

## 1. Get the source

Pasted → use it. Pointed to → fetch it with whatever tools the session has (mail, files, drive, web); if several candidates match, list them briefly (date, subject) and ask which. The **source date** is the date the source was written: an email's sent date, a document's date, or a date written in the text. Pasted text that carries no date was just written: its source date is today.

## 2. Extract

Only what the source says — no risks or milestones of your own. Follow the rules literally so the same source always gives the same rows.

- **Project** — name (the product or deliverable), client.
- **Phases** — the source's section headings without dates or durations, in sentence case ("SITE INSTALLATION — until June 5" → `Site installation`). No headings → one phase, `General`. Select option names cannot contain commas; drop them.
- **Milestones** — one per listed plan item, named with the source's wording minus the date. A phase with no listed items is one milestone named after the phase. Work the source reports as already done becomes one Done milestone at the start of the first phase, named with the source's phrase for the result, with `Finished` = the source date and `Dates` from a week before it to the source date — the source rarely says when it started, and a week keeps it visible on the Gantt; it is marked as a rule-derived date in the confirmation. The first milestone not done is In progress, later ones Planned.
- **Issues**, by what the source says:
  - someone is asked to do something → Blocker if work is stuck without it, else Task; `Waiting on` = that person;
  - something requested from or pending with a third party → Task, Waiting; `Waiting on` = that party, or the project's `Client` value if none is named;
  - an undecided either/or → Question; `Waiting on` = who decides, by default the `Client` value;
  - "missing X would cost N", "N is an assumption until Y" → Risk, Open; consequence in `Note`; linked to the milestone it threatens;
  - "I will do X once Y" → Task, Open, linked to the milestone it serves.

  Short noun-phrase names from the source. Commercial terms, IP clauses, billing rules and background are not issues.

## 3. Dates

Exact dates as given. Fixed readings of vague ones: "mid-<month>" = the 15th; a bare month as an end = its last day, as a start = the 1st; a range plus a duration ("February to March, about a month") = starts at the range start, ends start + duration.

Starts: a milestone starts where the previous one in its phase ends; the first milestone of the first phase starts on the source date; the first of a later phase starts where the previous phase ends. Work described as running alongside something starts with it. A phase that "starts once X is done" starts at X's end, even if its heading gives a vaguer start.

A milestone with no date in the source and none following from these rules is asked about in step 4, never invented. Dates that came from a rule rather than the literal text are marked in the list ("Mar 15 — from 'mid-March'") so the user can correct them.

## 4. Confirm

Show: which source you used (email subject and date, or document name), the project and client, milestones with dates by phase, and issues. Ask for missing dates in the same message. Wait for OK — this creates many rows, and a wrong assumption means a cleanup.

## 5. Create

First check `Active` for a project of this name. If one exists, an earlier attempt was interrupted: do not create a second. Fetch it; whatever of the page exists, finish it (below); then compare its `Plan` and `Open items` views with the confirmed list — in a new conversation, extract from the source again and confirm first — and create only what is missing.

Otherwise, in this order — the page comes before the rows, so an interrupted attempt can always be resumed through the project's own views:

1. The Projects row: `Status` Active, `Target end` = end of the last milestone, `Source` = the source's URL if it is a shared web document, else empty; `Repository` only if the user gave one.
2. The project page's views and tabs (below).
3. If `Phase` needs new options: `notion-update-data-source` on the milestones data source with `ALTER COLUMN "Phase" SET SELECT(...)` listing all existing options plus the new ones — the statement replaces the whole list.
4. Milestones (new rows, `Project` = the row) with their `Dates` — the dates in the source are the ones the client was told, so they are the commitment from the start.
5. Issues, `Opened` = today.
6. The status callout at the start of the page (`insert_content`, `position: {"type": "start"}`), now that the counts are known.
7. A source without a URL (pasted text, an email, a local file) goes into the `Notes` tab as a sub-page `Mon D — Source: <subject or short description>`, as for long notes in SKILL.md, so the original plan stays with the project.

Reply with what was created, and remind the user to switch the `Plan` timeline to **Quarter** and turn on full width once — the API cannot set either; Notion remembers them.

## Project page

The project page **is the Projects row** — build into the row's body (`page_id` = row id). A separate page made with `notion-create-pages` would appear under the root and in the sidebar, while the Projects table opened an empty row.

Views — `notion-create-view` with `parent_page_id` = the project page, in this order (they are appended to the page as `<database …>` lines):

```
Plan                 timeline  data source <milestones>  FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Paused", "Done"); TIMELINE BY "Dates"; SORT BY "Dates" ASC; SHOW "Name", "Status", "Late, days"
Schedule             table     data source <milestones>  FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Paused", "Done"); SORT BY "Dates" ASC; SHOW "Name", "Status", "Dates", "Finished", "Late, days"
Open items           table     data source <open_items>  FILTER "Project" = "<page id>"; FILTER "Status" IN ("Open", "Waiting"); SORT BY "Type" ASC; SHOW "Name", "Type", "Status", "Waiting on", "Milestone"
```

Tabs — fetch the page, then `update_content` with `old_str` = the three `<database …>` lines, `new_str` = the same lines, unchanged, wrapped like this (an existing view's url moves it; it does not copy):

```
<tabs>
	<tab>
		Plan
		<database url="<plan block url>" inline="true" data-source-url="collection://<milestones>"></database>
	</tab>
	<tab>
		Schedule
		<database url="<schedule block url>" inline="true" data-source-url="collection://<milestones>"></database>
	</tab>
	<tab>
		Open items
		<database url="<open items block url>" inline="true" data-source-url="collection://<open_items>"></database>
	</tab>
	<tab>
		Notes
		Notes, files, docs and client correspondence for this project. Newest at the bottom. {color="gray"}
	</tab>
</tabs>
```

Verify by fetch: the page's ancestor path goes through the Projects database; the body is the callout (once it is added), then one `<tabs>` block with the four tabs — Plan, Schedule, Open items, Notes — no `icon=`, nothing after it. If a block came out in the wrong order, one `update_content` over both blocks puts them back. If the page already had some of this, keep it and add only what is missing — never a second callout, view or tabs block.

Filters on formula columns are dropped by the API, so `Schedule` lists every live milestone; `Late, days` is the column to scan.
