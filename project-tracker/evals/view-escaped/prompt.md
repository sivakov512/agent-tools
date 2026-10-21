---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [tasks, negative]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from.'
---
Energy meter: I sent the lab request for TSK-10 to the same people TSK-9 waits on — it waits on them now. Update the tracker.
