#!/usr/bin/env python3
"""Where a milestone's or task's bar runs on the timeline, and which part of it is red (assets/core.js → dEnd, lateFrom, fades, tlTint, spanOf).

A done item's bar ends at its finish — before its end date when it finished early, after it when late — and a done item is done, never
late, wherever its state shows. An open one ends at its end date, or today once past it. The days past the end date are red, the rest
keeps its own state's colour; a paused item is never late. A start with no end date runs for the set span (30 days) and fades while open;
done, it ends at its finish. A done item without dates sits at its finish. A milestone's card covers its own bar and every task's.

Run from anywhere: python3 project-tracker/tests/check_timeline_bars.py
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
const PT = w.PT, c = JSON.parse(process.argv[2]), t = PT.todayNum();
console.log(JSON.stringify(c.map(x => {
  const p = { url: "https://app.notion.com/p/p0", name: "P", status: x[0] };
  const d = PT.buildPlan(p, [x[1]], x[2] || []), m = d.ms[0], rel = n => n == null ? null : n - t, sp = PT.spanOf(m);
  return [m.state, rel(m.at), m.at == null ? null : rel(PT.dEnd(m)), rel(PT.lateFrom(m)), PT.fades(m), PT.tlTint(m), sp ? [rel(sp.start), rel(sp.end)] : null];
})));
"""


def d(n):
    return (date.today() + timedelta(days=n)).isoformat() if n is not None else ""


def ms(status, start, end=None, finished=None):
    return {"url": "https://app.notion.com/p/m", "Name": "M", "Status": status, "date:Dates:start": d(start), "date:Dates:end": d(end),
            "date:Finished:start": d(finished), "Order": 1}


def tk(status, start, end=None, finished=None, n=1):
    return {"url": "https://app.notion.com/p/t%d" % n, "Name": "T%d" % n, "Status": status, "Milestone": json.dumps(["https://app.notion.com/p/m"]),
            "date:Dates:start": d(start), "date:Dates:end": d(end), "date:Finished:start": d(finished), "Waiting on": "", "Order": n}


CASES = [  # (what, project status, milestone row, its task rows, [state, placed at, bar end, first red day, fades, timeline tint, card span])
    ("done early: ends at its finish, no red", "Active", ms("Done", -20, -5, -8), [], ["done", -20, -8, None, False, "done", [-20, -8]]),
    ("done late: done, not late; ends at its finish, red past its end", "Active", ms("Done", -20, -10, -4), [], ["done", -20, -4, -9, False, "done", [-20, -4]]),
    ("done with a start only: ends at its finish", "Active", ms("Done", -20, None, -3), [], ["done", -20, -3, None, False, "done", [-20, -3]]),
    ("done without dates: sits at its finish", "Active", ms("Done", None, None, -6), [], ["done", -6, -6, None, False, "done", [-6, -6]]),
    ("open, late: late, but its own colour; ends today, red past its end", "Active", ms("In progress", -20, -6), [], ["late", -20, 0, -5, False, "prog", [-20, 0]]),
    ("open, on time: ends at its end date", "Active", ms("In progress", -5, 9), [], ["prog", -5, 9, None, False, "prog", [-5, 9]]),
    ("a start only, open: the set span, fading, never late", "Active", ms("In progress", -40), [], ["prog", -40, -11, None, True, "prog", [-40, -11]]),
    ("planned and past its end: no colour of its own, red past its end", "Active", ms("Planned", -10, -2), [], ["late", -10, 0, -1, False, "", [-10, 0]]),
    ("paused past its end: never late, ends at its end date", "Paused", ms("In progress", -10, -2), [], ["paused", -10, -2, None, False, "paused", [-10, -2]]),
    ("the card covers a task done before its own start", "Active", ms("Done", None, None, -2), [tk("Done", None, None, -7)], ["done", -2, -2, None, False, "done", [-7, -2]]),
    ("the card covers a task planned past its end", "Active", ms("In progress", -5, 5), [tk("Planned", 3, 12)], ["prog", -5, 5, None, False, "prog", [-5, 12]]),
    ("no dates anywhere: no card span (a placeholder instead)", "Active", ms("In progress", None), [tk("In progress", None)], ["prog", None, None, None, False, "prog", None]),
]


def main():
    out = subprocess.run(["node", "-e", RUN, str(CORE), json.dumps([[c[1], c[2], c[3]] for c in CASES])], capture_output=True, text=True)
    if out.returncode:
        print(out.stderr)
        sys.exit(1)
    bad = 0
    for (what, _, _, _, want), got in zip(CASES, json.loads(out.stdout)):
        if got != want:
            bad += 1
            print("FAIL %s: want %s, got %s" % (what, want, got))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
