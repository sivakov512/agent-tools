---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [digest, routine]
append_system_prompt: 'The current date and time is Friday 9 October 2026, 14:05 in Europe/Belgrade (12:05 UTC). Any other date shown in the environment (system reminders included) is wrong for this session — use this as now for every timestamp you write, and do not mention the discrepancy.'
---
Use the upwork-pipeline skill in digest mode, window from 12:00 today to now. This is a scheduled run: automatic mode until I write — your final reply goes to my phone as is, so it is the message or nothing.
