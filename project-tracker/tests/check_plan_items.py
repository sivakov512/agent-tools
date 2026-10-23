#!/usr/bin/env python3
"""A plan's rows become its items by one set of rules (assets/core.js → buildPlan, planPhrase, focusItem, whoOf).

A milestone is paused by its own status or its project's, a task by its project's or its milestone's, and a paused item is never late. A
plan row's phrase says when a done item finished against its end (`done Oct 5, on time`, `4 d early`, `3 d late`), how long is left, or
that it has no dates. The item in focus — the milestone the project page opens and the project's state reads — is a planned one past its
end, else one under way (late first, then not paused), else the next planned one. A card names the client, then the origin, once when
they are the same.

Run from anywhere: python3 project-tracker/tests/check_plan_items.py
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
const PT = w.PT, c = JSON.parse(process.argv[2]);
function plan(x) { const p = { url: "https://app.notion.com/p/p0", name: "P", status: x.project || "Active" }; return PT.buildPlan(p, x.ms, x.tasks); }
console.log(JSON.stringify({
  items: c.items.map(x => { const d = plan(x); return d.ms.concat(d.tasks).map(i => [i.name, i.state, i.paused, i.late]); }),
  phrases: c.phrases.map(x => { const d = plan(x); return d.ms.concat(d.tasks).map(i => PT.planPhrase(i)[0]); }),
  focus: c.focus.map(x => { const d = plan(x), f = PT.focusItem(d.ms, d.tasks); return f ? f.name : null; }),
  who: c.who.map(p => PT.whoOf(p))
}));
"""


def d(n):
    return (date.today() + timedelta(days=n)).isoformat() if n is not None else ""


def fmt(n):  # a date as the page writes it: Oct 5, with the year when it is not this one
    x = date.today() + timedelta(days=n)
    return x.strftime("%b ") + str(x.day) + ("" if x.year == date.today().year else ", " + str(x.year))


def ms(name, status, start, end, order, finished=None):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "date:Dates:start": d(start), "date:Dates:end": d(end),
            "date:Finished:start": d(finished), "Order": order}


def tk(name, status, start, end, m=None, order=1, finished=None):
    return {"url": "https://app.notion.com/p/" + name, "Name": name, "Status": status, "Milestone": json.dumps([m["url"]] if m else []),
            "date:Dates:start": d(start), "date:Dates:end": d(end), "date:Finished:start": d(finished), "Waiting on": "", "Order": order}


P = ms("Pilot", "Paused", -20, -5, 1)
R = ms("Run", "In progress", -20, -5, 2)
ITEMS = [  # (what, project status, milestones, tasks, [name, state, paused, late] per milestone, then per task)
    ("a paused milestone and its late task are never late; a late milestone under way is", "Active", [P, R],
     [tk("Board", "In progress", -9, -2, P), tk("Case", "In progress", -9, -2, R)],
     [["Pilot", "paused", True, None], ["Run", "late", False, 5], ["Board", "paused", True, None], ["Case", "late", False, 2]]),
    ("a paused project pauses everything open in it, not what is done", "Paused", [ms("Spec", "In progress", -9, -1, 1)],
     [tk("Draft", "Done", -9, -3, None, 1, -4), tk("Send", "Planned", -2, -1)],
     [["Spec", "paused", True, None], ["Draft", "done", False, -1], ["Send", "paused", True, None]]),
]
PHRASES = [  # (what, milestones, tasks, the plan row's phrase per milestone, then per task)
    ("done against its end: on time, early, late", [ms("A", "Done", -20, -10, 1, -10), ms("B", "Done", -20, -10, 2, -14), ms("C", "Done", -20, -10, 3, -7)], [],
     ["done %s, on time" % fmt(-10), "done %s, 4 d early" % fmt(-14), "done %s, 3 d late" % fmt(-7)]),
    ("left, no dates, no end", [ms("Now", "In progress", -3, 10, 1), ms("Later", "Planned", None, None, 2), ms("Open", "In progress", -3, None, 3)],
     [tk("Loose", "Planned", None, None)], ["10 d left", "no dates yet", "started %s · no end date" % fmt(-3), "no dates"]),
]
FOCUS = [  # (what, milestones, tasks, the item in focus)
    ("a planned milestone past its end comes before the one under way", [ms("Late plan", "Planned", -10, -2, 2), ms("Going", "In progress", -5, 5, 1)], [], "Late plan"),
    ("under way: the late one first, then one not paused", [ms("Held", "Paused", -9, 9, 1), ms("Going", "In progress", -5, 5, 2), ms("Behind", "In progress", -9, -1, 3)], [], "Behind"),
    ("nothing under way: the next planned one", [ms("Done", "Done", -20, -10, 1, -10), ms("Next", "Planned", 3, 9, 2)], [], "Next"),
    ("no milestones: the loose tasks take their place", [], [tk("Copy", "In progress", -1, 4)], "Copy"),
    ("all done: none", [ms("Done", "Done", -20, -10, 1, -10)], [], None),
]
WHO = [  # (what, project, the card's line)
    ("client and origin", {"client": "Kestrel Labs", "origin": "Direct"}, "Kestrel Labs · Direct"),
    ("the origin is the client: once", {"client": "Upwork", "origin": "upwork"}, "Upwork"),
    ("no client: the origin", {"client": "", "origin": "Personal"}, "Personal"),
    ("no origin: the client", {"client": "Kestrel Labs", "origin": ""}, "Kestrel Labs"),
]


def main():
    case = {"items": [{"project": c[1], "ms": c[2], "tasks": c[3]} for c in ITEMS], "phrases": [{"ms": c[1], "tasks": c[2]} for c in PHRASES],
            "focus": [{"ms": c[1], "tasks": c[2]} for c in FOCUS], "who": [c[1] for c in WHO]}
    r = subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(case)], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr)
    got = json.loads(r.stdout)
    bad = [f"{what}: {g} != {want}" for (what, *_, want), g in zip(ITEMS, got["items"]) if g != want]
    bad += [f"{what}: {g} != {want}" for (what, _, _, want), g in zip(PHRASES, got["phrases"]) if g != want]
    bad += [f"{what}: {g!r} != {want!r}" for (what, _, _, want), g in zip(FOCUS, got["focus"]) if g != want]
    bad += [f"{what}: {g!r} != {want!r}" for (what, _, want), g in zip(WHO, got["who"]) if g != want]
    if bad:
        sys.exit("\n".join(bad))
    print(f"plan items: {len(ITEMS) + len(PHRASES) + len(FOCUS) + len(WHO)} cases ok")


main()
