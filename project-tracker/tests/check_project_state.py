#!/usr/bin/env python3
"""A project's state is the project's own (assets/core.js → projectState), on its card and wherever it is said.

`Due in 5 d` and `3 d late` come only from the project's own `Target end`. An item inside never speaks as the project: one late makes
the project `Behind schedule`, without naming it; one due soon changes nothing — the card's and the page's own lines say it. On a project
with no end date nothing reads as a deadline of its own.

Run from anywhere: python3 project-tracker/tests/check_project_state.py
"""
import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8"), w = {};
new Function("window", "document", "navigator", src)(w, { addEventListener() {}, documentElement: {} }, { userAgent: "" });
const PT = w.PT;
console.log(JSON.stringify(JSON.parse(process.argv[2]).map(c => {
  const p = { url: "https://app.notion.com/p/p0", name: "P", status: "Active", target: PT.dnum(c.target) };
  const s = PT.projectState(p, PT.buildPlan(p, c.ms, c.tasks), 0, false);
  return s.text;
})));
"""


def d(n):
    return (date.today() + timedelta(days=n)).isoformat() if n is not None else ""


def ms(name, status, start, end):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "date:Dates:start": d(start), "date:Dates:end": d(end), "Order": 1}


def tk(name, status, start, end, m=None):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "Milestone": json.dumps([m["url"]] if m else []),
            "date:Dates:start": d(start), "date:Dates:end": d(end), "Waiting on": "", "Order": 1}


M = ms("Build", "In progress", -10, 5)
CASES = [  # (what, target end in days from today or None, milestones, tasks, the state)
    ("no end date, a task due in 2 d: not the project's due", None, [], [tk("Copy", "Planned", -1, 2)], "On track"),
    ("ends in 30 d, a milestone due in 5 d: not the project's due", 30, [M], [], "On track"),
    ("ends in 3 d, a task due in 2 d: the project's own due", 3, [], [tk("Copy", "Planned", -1, 2)], "Due in 3 d"),
    ("ends in 4 d, nothing inside due within the week: the project's own due", 4, [], [tk("Copy", "Planned", -1, 12)], "Due in 4 d"),
    ("ends today, no plan yet: the project's own due", 0, [], [], "Due today"),
    ("ends in 4 d, all done: done, not due", 4, [], [tk("Copy", "Done", -10, -1)], "All done"),
    ("ends in 20 d, nothing late: on track", 20, [], [tk("Copy", "In progress", -3, 12)], "On track"),
    ("no end date, a task 3 d late: behind schedule, never the project's own lateness", None, [], [tk("Copy", "In progress", -9, -3)], "Behind schedule"),
    ("ends in 30 d, a milestone late: behind schedule", 30, [ms("Spec", "In progress", -20, -2)], [tk("Copy", "In progress", -9, 5)], "Behind schedule"),
    ("ended 4 d ago with work still open: the project's own lateness", -4, [], [tk("Copy", "In progress", -9, -3)], "4 d late"),
    ("ended 4 d ago, all done: done, not late", -4, [], [tk("Copy", "Done", -9, -5)], "All done"),
    ("no end date, nothing late or dated: no dates", None, [], [tk("Copy", "Planned", None, None)], "No dates"),
]


def main():
    cases = [{"target": d(t), "ms": m, "tasks": k} for _, t, m, k, _ in CASES]
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"{what}: got {o}, expected {want}" for (what, _, _, _, want), o in zip(CASES, out) if o != want]
    for b in bad:
        print("projectState:", b)
    if bad:
        sys.exit(1)
    print(f"projectState: {len(CASES)} cases ok")


if __name__ == "__main__":
    main()
