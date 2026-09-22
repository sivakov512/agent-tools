---
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [update, dates]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today.'
---
Sleep modes on the energy meter slip by one week because the vendor samples are late. Northwind agreed to the new dates. Shift everything after it by the same week — I confirm, apply it without asking.
