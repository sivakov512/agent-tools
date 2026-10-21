---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [setup, routine]
append_system_prompt: 'The current date and time is Friday 9 October 2026, 22:00 in Europe/Belgrade (20:00 UTC). Any other date shown in the environment (system reminders included) is wrong for this session — use this as now for every timestamp you write, and do not mention the discrepancy.'
---
Use the upwork-pulse skill in digest mode on https://app.notion.com/p/10000000000040008000000000000001, window from 11:00 today to now. Scheduled run. Work silently: write nothing until the final reply.
