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
const c = JSON.parse(process.argv[2]);
function plan(x) { const p = { url: "https://app.notion.com/p/p0", name: "P", status: "Active", target: PT.dnum(x.target) }; return [p, PT.buildPlan(p, x.ms, x.tasks)]; }
console.log(JSON.stringify({
  state: c.state.map(x => { const [p, d] = plan(x); return PT.projectState(p, d, 0, false).text; }),
  trouble: c.trouble.map(x => { const [p, d] = plan(x); const s = PT.projectState(p, x.err ? { err: { code: "timeout" } } : d, x.blockers, false); return [s.text, !!s.trouble]; }),
  dates: c.dates.map(x => { const [p, d] = plan(x); const r = PT.projectDates(p, d.ms.length ? d.ms : d.tasks); return [r.text, !!r.bad]; })
}));
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
    ("every milestone done, a task outside any still in progress: open work, never all done", None, [ms("Spec", "Done", -20, -10)],
     [tk("Invoice", "In progress", -2, 5)], "On track"),
    ("every milestone done, a task outside any waiting with no dates: open work", None, [ms("Spec", "Done", -20, -10)],
     [tk("Invoice", "Waiting", None, None)], "No dates"),
    ("every milestone and task done: all done", None, [ms("Spec", "Done", -20, -10)], [tk("Invoice", "Done", -9, -8)], "All done"),
]
TROUBLE = [  # (what, target, milestones, tasks, blockers, plan failed to load, [state, a red edge on its card])
    ("blocked: trouble", 30, [M], [], 1, False, ["Blocked", True]),
    ("behind schedule: trouble", 30, [ms("Spec", "In progress", -20, -2)], [], 0, False, ["Behind schedule", True]),
    ("past its own end: trouble", -4, [], [tk("Copy", "In progress", -9, 3)], 0, False, ["4 d late", True]),
    ("its plan did not load: red, but a failed read, not trouble in the project", 30, [M], [], 0, True, ["Not loaded", False]),
    ("due soon: no edge", 3, [M], [], 0, False, ["Due in 3 d", False]),
]
DATES = [  # (what, target, milestones, tasks, [the head's dates, said as wrong])
    ("the plan's first start to its end (50 days: two months, both dates whole)", 30, [ms("Spec", "In progress", -20, 5)], [], ["%s – %s", False]),
    ("no end: from its start", None, [ms("Spec", "In progress", -20, 5)], [], ["from %s", False]),
    ("an end before the plan starts: both, marked, never hidden", -30, [ms("Spec", "In progress", -20, 5)], [], ["%s – %s", True]),
]


def fmt(n):  # a date as the page writes it: Oct 5, with the year when it is not this one
    x = date.today() + timedelta(days=n)
    return x.strftime("%b ") + str(x.day) + ("" if x.year == date.today().year else ", " + str(x.year))


def main():
    cases = {"state": [{"target": d(t), "ms": m, "tasks": k} for _, t, m, k, _ in CASES],
             "trouble": [{"target": d(t), "ms": m, "tasks": k, "blockers": b, "err": e} for _, t, m, k, b, e, _ in TROUBLE],
             "dates": [{"target": d(t), "ms": m, "tasks": k} for _, t, m, k, _ in DATES]}
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"{what}: got {o}, expected {want}" for (what, _, _, _, want), o in zip(CASES, out["state"]) if o != want]
    bad += [f"{what}: got {o}, expected {want}" for (what, *_, want), o in zip(TROUBLE, out["trouble"]) if o != want]
    for (what, t, m, _, want), o in zip(DATES, out["dates"]):
        start = min(x["date:Dates:start"] for x in m)
        n = (date.fromisoformat(start) - date.today()).days
        text = want[0] % ((fmt(n), fmt(t)) if want[0].count("%s") == 2 else (fmt(n),))
        if o != [text, want[1]]:
            bad.append(f"{what}: got {o}, expected {[text, want[1]]}")
    for b in bad:
        print("projectState:", b)
    if bad:
        sys.exit(1)
    print(f"projectState: {len(CASES) + len(TROUBLE) + len(DATES)} cases ok")


if __name__ == "__main__":
    main()
