---
max_turns: 20
timeout_seconds: 400
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [setup]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from.'
---
Set up the project tracker in Notion.
