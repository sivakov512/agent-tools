---
max_turns: 60
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [drafts, proposal]
append_system_prompt: 'The current date and time is Friday 9 October 2026, 14:05 in Europe/Belgrade (12:05 UTC). Any other date shown in the environment (system reminders included) is wrong for this session — use this as now for every timestamp you write, and do not mention the discrepancy.'
---
Use the upwork-pulse skill in drafts mode on https://app.notion.com/p/10000000000040008000000000000001. Scheduled run; the jobs come with the run.

<routine-fire-payload>
```
jobs: 2101000000000000105
```
</routine-fire-payload>
