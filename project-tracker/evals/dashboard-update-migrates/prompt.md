---
max_turns: 160
timeout_seconds: 2400
allowed_tools: [Skill, Read, Glob, Grep, Write]
runs: 1
tags: [dashboard, setup, upgrade, update]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from.'
---
Update my project dashboard to the latest version.
