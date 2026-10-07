---
type: 'llm'
focus: 'mock_calls'
---
Judge the rows the agent created with notion-create-pages (data sources: milestones `…0002`, tasks `…0004`, problems `…0003`).

- Milestones: Firmware on the dev kit, Hardware, and a field-test milestone (Feb 1 → Mar 1, 2027). The dated plan items (Battery life measured on the dev kit, Sleep current under 10 µA, Board designed and ordered, First boards brought up) are tasks under their milestones, not milestones.
- The finished LoRa link bring-up is a Done task of the first milestone (or a Done milestone) with `Finished` set.
- The enclosure quote is a Waiting task with `Waiting on` Acme; the pilot farm is a Planned task (not a problem); the power analyzer waits on Ivan (as a Waiting task or a Blocker).
- Problems: the patched-gateway decision is a Question waiting on Greenleaf; the holiday-shutdown board order is a Risk. No problem has the Type "Task".

Judge only these claims. Different names that keep the meaning are fine. Answer FAIL only if one of the claims above is clearly false.
