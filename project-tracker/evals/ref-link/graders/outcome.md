---
type: 'llm'
focus: 'last_message'
---
The user wrote only "Link PB-1 to TK-6." In this tracker PB-1 is the Energy meter risk "Holiday shutdown window" (Open, milestone Hardware, no task yet) and TK-6 is the task "First prototype working on the custom board" — not "Board designed, first boards ordered" (TK-5), the task the risk's text would suggest.

- Reports that the risk Holiday shutdown window is now linked to the task First prototype working on the custom board.
- The line that reports this change starts with the ID `PB-1` (plain, bold or in code), before the risk's name; naming `TK-6` with the task is fine.
- Does not link it to any other task, does not report a change to any other row (another task, milestone, problem or the project), and does not ask which rows the IDs are or ask the user to confirm.

Judge only these claims. Different wording, ordering and extra harmless detail are fine — for example a history line added to the risk's own page, its milestone staying the same, or saying the status callout or a client dashboard needed no change. Answer FAIL only if one of the claims above is clearly false.
