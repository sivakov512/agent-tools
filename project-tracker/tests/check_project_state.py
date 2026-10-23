#!/usr/bin/env python3
"""A project's state says a due date or lateness as whose it is (assets/core.js → projectState).

`Due in 5 d` and `3 d late` are the project's own, so they come only from the project's `Target end`. A milestone or task inside it is
said as that item — `Task due in 2 d`, `Milestone due today`, `Task 3 d late` — and the state carries the item, so the project page can
name it; on a project with no end date nothing reads as the project's own. For a due the nearest wins, on the same day the project's
end; for lateness the project's own first, else the worst item.

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
  return [s.text, s.item ? s.item.name : null, s.more || 0];
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
CASES = [  # (what, target end in days from today or None, milestones, tasks, [state text, the item it names, how many more are due])
    ("no end date, a task due in 2 d: said as the task's, never the project's", None, [], [tk("Copy", "Planned", -1, 2)], ["Task due in 2 d", "Copy", 0]),
    ("no end date, a task due today", None, [], [tk("Copy", "In progress", -3, 0)], ["Task due today", "Copy", 0]),
    ("no end date, two tasks due this week: the nearest, and one more", None, [], [tk("Photos", "Waiting", -5, 6), tk("Copy", "Planned", -1, 2)], ["Task due in 2 d", "Copy", 1]),
    ("ends in 30 d, a milestone due in 5 d: the milestone's", 30, [M], [], ["Milestone due in 5 d", "Build", 0]),
    ("ends in 3 d, a task due in 2 d: the task's, it comes first", 3, [], [tk("Copy", "Planned", -1, 2)], ["Task due in 2 d", "Copy", 0]),
    ("ends in 2 d with its last task: the project's own due", 2, [], [tk("Copy", "Planned", -1, 2)], ["Due in 2 d", None, 0]),
    ("ends in 4 d, no item ends within the week: the project's own due", 4, [], [tk("Copy", "Planned", -1, 12)], ["Due in 4 d", None, 0]),
    ("ends today, no plan yet: the project's own due", 0, [], [], ["Due today", None, 0]),
    ("ends in 4 d, all done: done, not due", 4, [], [tk("Copy", "Done", -10, -1)], ["All done", None, 0]),
    ("ends in 20 d, nothing due within the week: on track", 20, [], [tk("Copy", "In progress", -3, 12)], ["On track", None, 0]),
    ("no end date, a task 3 d late: said as the task's, never the project's", None, [], [tk("Copy", "In progress", -9, -3)], ["Task 3 d late", "Copy", 0]),
    ("ends in 30 d, a milestone 2 d late and a task 5 d late: the worst, and one more", 30, [ms("Spec", "In progress", -20, -2)],
     [tk("Copy", "In progress", -9, -5)], ["Task 5 d late", "Copy", 1]),
    ("ended 4 d ago with work still open: the project's own lateness", -4, [], [tk("Copy", "In progress", -9, -3)], ["4 d late", None, 0]),
    ("ended 4 d ago, all done: done, not late", -4, [], [tk("Copy", "Done", -9, -5)], ["All done", None, 0]),
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
