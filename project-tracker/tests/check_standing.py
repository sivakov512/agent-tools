#!/usr/bin/env python3
"""Where a project stands names everything that is late or blocked (assets/core.js → standing), the same on its card and its page.

Every late milestone, every late task (under its milestone, or on a line of its own when it has none), every blocker, then what is under
way and what comes next. Lines with something late come first, then blockers, then the rest; next last. The card shows the first lines
of the same list, so nothing late can hide behind a milestone the card happens not to show.

Run from anywhere: python3 project-tracker/tests/check_standing.py
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
  const p = { url: "https://app.notion.com/p/p0", name: "P", status: "Active" }, d = PT.buildPlan(p, c.ms, c.tasks);
  return PT.standing(d.ms, d.tasks, c.blockers.map(n => ({ kind: "problem", type: "Blocker", status: "Open", name: n, url: "b-" + n }))).map(l => [l.label, l.item.name, l.subs.map(k => k.name)].concat(l.label === "Behind" && l.cls !== "crit" ? ["not red"] : []));
})));
"""


def d(n):
    return (date.today() + timedelta(days=n)).isoformat() if n is not None else ""


def ms(name, status, start, end, order):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "date:Dates:start": d(start), "date:Dates:end": d(end), "Order": order}


def tk(name, status, start, end, m=None, order=1):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "Milestone": json.dumps([m["url"]] if m else []),
            "date:Dates:start": d(start), "date:Dates:end": d(end), "Waiting on": "", "Order": order}


A = ms("Build", "In progress", -20, 10, 1)
B = ms("Certify", "In progress", -10, 40, 2)
C = ms("Ship", "Planned", 41, 60, 3)
L = ms("Spec", "In progress", -30, -5, 1)
CASES = [  # (what, milestones, tasks, blockers, [label, item, its tasks] per line)
    ("one milestone under way: it, its current task, then next", [A, C], [tk("Board", "In progress", -5, 5, A)], [],
     [["Now", "Build", ["Board"]], ["Next", "Ship", []]]),
    ("a late task in a second milestone under way comes first, under its milestone", [A, B, C],
     [tk("Board", "In progress", -5, 5, A), tk("Paperwork", "In progress", -9, -2, B)], [],
     [["Now", "Certify", ["Paperwork"]], ["Now", "Build", ["Board"]], ["Next", "Ship", []]]),
    ("a late task with no milestone in a project with milestones: a line of its own", [A], [tk("Invoice", "Planned", -9, -3)], [],
     [["Late", "Invoice", []], ["Now", "Build", []]]),
    ("a late milestone with two late tasks: both, and no other task (its current one is the first late one)", [L],
     [tk("One", "In progress", -20, -8, L, 1), tk("Two", "Planned", -10, -6, L, 2), tk("Three", "Planned", 1, 5, L, 3)], [],
     [["Late", "Spec", ["One", "Two"]]]),
    ("a blocker after what is late, before what is under way", [A, L], [], ["Cell"],
     [["Late", "Spec", []], ["Blocked", "Cell", []], ["Now", "Build", []]]),
    ("no milestones: tasks take their place", [], [tk("Copy", "In progress", -3, 4), tk("Photos", "Planned", -9, -1, order=2), tk("Site", "Planned", 5, 9, order=3)], [],
     [["Late", "Photos", []], ["Now", "Copy", []], ["Next", "Site", []]]),
    ("every milestone done, a task outside any in progress and one waiting: each on a line of its own, never nothing", [ms("Spec", "Done", -20, -10, 1)],
     [tk("Invoice", "In progress", -2, 5, order=1), tk("Approval", "Waiting", None, None, order=2)], [], [["Now", "Invoice", []], ["Waiting", "Approval", []]]),
    ("every milestone done, a planned task outside any: it is next", [ms("Spec", "Done", -20, -10, 1)], [tk("Handover", "Planned", 3, 6)], [],
     [["Next", "Handover", []]]),
    ("a milestone not started holding a late task: Behind, first, the late task under it", [A, C], [tk("Board", "In progress", -5, 5, A), tk("Quote", "Planned", -6, -2, C)], [],
     [["Behind", "Ship", ["Quote"]], ["Now", "Build", ["Board"]]]),
]


def main():
    cases = [{"ms": m, "tasks": k, "blockers": b} for _, m, k, b, _ in CASES]
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"{what}: got {o}, expected {want}" for (what, _, _, _, want), o in zip(CASES, out) if o != want]
    for b in bad:
        print("standing:", b)
    if bad:
        sys.exit(1)
    print(f"standing: {len(CASES)} cases ok")


if __name__ == "__main__":
    main()
