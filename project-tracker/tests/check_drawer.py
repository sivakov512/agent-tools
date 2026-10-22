#!/usr/bin/env python3
"""The project page's top bar names the item the reader is working on (assets/core.js → focusStep, focusChain), and a fold keeps
the folded item's header where the reader looks (foldScroll).

focusStep is a small state machine: the state ({k, picked, end}), an event (pick, free, scroll, layout), the page's blocks as drawn and
the view with its reading line → the next state. The cases below run event sequences over a fictional page laid out here: the blocks
in document order, each with the block it is drawn in, open or not, and its box; a scroll shifts every box. They are the situations the
user named: a slight scroll after a click, a short page, everything expanded, two expanded milestones, a task under Open items and the
same task in the Plan, folding a parent of the focused item, a refresh, another project, a phone.

Run from anywhere: python3 project-tracker/tests/check_drawer.py
"""
import json
import subprocess
import sys
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  // What the reader is working on in the project page"), src.indexOf("  // ---------- the timeline ----------"));
const f = new Function(fn + "; return { focusStep: focusStep, focusChain: focusChain, foldScroll: foldScroll };")();
const c = JSON.parse(process.argv[2]);
console.log(JSON.stringify({
  runs: c.runs.map(steps => { let st = { k: null, picked: false, end: null }; return steps.map(s => { st = f.focusStep(st, s.ev, s.blocks, s.view); return [st.k, st.picked, f.focusChain(s.blocks, st.k).map(i => s.blocks[i].k)]; }); }),
  fold: c.fold.map(x => f.foldScroll(x)),
}));
"""

# The page: the drawer's head and sections as gaps; Open items (w:t25 a task waiting on someone — the Plan's t25 —, p1 a problem);
# the Plan (m10 with its tasks t13 and t25, m11 with t30); Notes below. Each item: its key, its body's height when open, its children.
HEAD = 50
PAGE = [("gap", 250), ("w:t25", 400, []), ("p1", 300, []), ("gap", 100),
        ("m10", 200, [("t13", 350, []), ("t25", 350, [])]), ("m11", 200, [("t30", 350, [])]), ("gap", 800)]
DESK = {"top": 0, "bottom": 900, "line": 300}
PHONE = {"top": 0, "bottom": 600, "line": 200}


def layout(opened, scroll, folded=()):
    """The blocks as the page draws them with `opened` open, scrolled down by `scroll`: a closed block's children and a folded
    section's blocks have no height."""
    out = []

    def put(items, y, parent, shown):
        for it in items:
            if it[0] == "gap":
                y += it[1] if shown else 0
                continue
            k, body, kids = it
            sh = shown and k not in folded
            i = len(out)
            out.append({"k": k, "parent": parent, "open": k in opened, "top": y - scroll, "bottom": 0})
            y2 = y + (HEAD if sh else 0)
            if k in opened:
                y2 = put(kids, y2 + (body if sh else 0), i, sh)
            else:
                put(kids, y2, i, False)
            out[i]["bottom"] = y2 - scroll
            y = y2
        return y

    put(PAGE, 0, -1, True)
    return out


def step(ev, scroll, opened, k=None, folded=(), view=DESK, drop=()):
    blocks = [b for b in layout(set(opened), scroll, folded) if b["k"] not in drop]
    return {"ev": {"type": ev, "k": k}, "blocks": blocks, "view": view}


M = {"m10"}
MT = {"m10", "t13"}
ALL = {"w:t25", "p1", "m10", "t13", "t25", "m11", "t30"}
# Each run: (what, steps, expected after each step as (focus, picked) or (focus, picked, chain)).
RUNS = [
    ("the top of a page with nothing open at the line: the project",
     [step("layout", 0, M)], [(None, False)]),
    ("following the line through a milestone and its task, with slack so a small scroll never flips it",
     [step("scroll", s, MT) for s in (200, 420, 390, 360, 420, 790, 810, 830, 900)],
     [("m10", False), ("t13", False, ["m10", "t13"]), ("t13", False), ("m10", False), ("t13", False), ("t13", False),
      ("t13", False), ("m10", False), (None, False)]),
    ("a click makes the item the focus; it stays through small scrolls and while read, until its end passes the line",
     [step("pick", 0, MT, "t13"), step("scroll", 100, MT), step("scroll", 50, MT), step("scroll", 700, MT), step("scroll", 820, MT)],
     [("t13", True, ["m10", "t13"]), ("t13", True), ("t13", True), ("t13", True), ("m10", False)]),
    ("a clicked item low on the screen keeps the focus though the line is above it, until it leaves the screen below",
     [step("pick", 1700, ALL, "t30"), step("scroll", 1650, ALL), step("scroll", 1600, ALL), step("scroll", 1540, ALL)],
     [("t30", True, ["m11", "t30"]), ("t30", True), ("t30", True), ("t25", False, ["m10", "t25"])]),
    ("a clicked short item above the line stays until it leaves the screen above",
     [step("pick", 400, {"p1"}, "p1"), step("scroll", 420, {"p1"}), step("scroll", 640, {"p1"}), step("scroll", 660, {"p1"})],
     [("p1", True), ("p1", True), ("p1", True), (None, False)]),
    ("everything expanded: a click is never needed twice — reading on past the clicked item, the line takes over",
     [step("pick", 900, ALL, "t13"), step("scroll", 1500, ALL), step("scroll", 1700, ALL)],
     [("t13", True), ("t25", False, ["m10", "t25"]), ("t25", False)]),
    ("folding the focused item: the line again",
     [step("pick", 420, MT, "t13"), step("layout", 420, M)], [("t13", True), ("m10", False)]),
    ("folding a milestone with its focused task inside: the line again, not the hidden task",
     [step("pick", 420, MT, "t13"), step("layout", 420, {"t13"})], [("t13", True), (None, False)]),
    ("folding the section the focused item is in: the line again",
     [step("pick", 420, MT, "t13"), step("layout", 420, MT, folded=("m10", "t13", "t25"))], [("t13", True), (None, False)]),
    ("a task under Open items is that task alone; scrolling on into the Plan's same task names it there, under its milestone",
     [step("pick", 0, {"w:t25", "m10", "t25"}, "w:t25"), step("scroll", 300, {"w:t25", "m10", "t25"}), step("scroll", 450, {"w:t25", "m10", "t25"}),
      step("scroll", 1000, {"w:t25", "m10", "t25"})],
     [("w:t25", True, ["w:t25"]), ("w:t25", True), (None, False), ("t25", False, ["m10", "t25"])]),
    ("two expanded milestones: the clicked one until it is read past, then the next one at the line",
     [step("pick", 300, {"m10", "m11"}, "m10"), step("scroll", 450, {"m10", "m11"}), step("scroll", 520, {"m10", "m11"})],
     [("m10", True), ("m10", True), ("m11", False)]),
    ("two expanded milestones, following: the first keeps the bar for the slack past its end, then the second",
     [step("scroll", s, {"m10", "m11"}) for s in (450, 510, 530)],
     [("m10", False), ("m10", False), ("m11", False)]),
    ("a refresh keeps a clicked item; one that is gone after it hands over to the line",
     [step("pick", 420, MT, "t13"), step("layout", 420, MT), step("layout", 420, MT, drop=("t13",))],
     [("t13", True), ("t13", True), ("m10", False)]),
    ("a click outside any item, or another project, hands the bar back to the line",
     [step("pick", 420, MT, "t13"), step("free", 420, MT), step("free", 0, M)],
     [("t13", True), ("t13", False), (None, False)]),
    ("an item picked while off screen is not the focus: the line names what is there",
     [step("pick", 0, ALL, "t30")], [("w:t25", False)]),
    ("Expand all, or a fold elsewhere, keeps a clicked item",
     [step("pick", 420, MT, "t13"), step("layout", 420, ALL)], [("t13", True)]),
    ("a phone: the same rules on a shorter screen, the line a third down",
     [step("pick", 600, MT, "t13", view=PHONE), step("scroll", 800, MT, view=PHONE), step("scroll", 920, MT, view=PHONE)],
     [("t13", True), ("t13", True), ("m10", False)]),
]

FOLD = [  # (what, state, expected): the header in view stays; scrolled away above, it comes to the view's top at once
    ("header in view: the page stays, no room needed", {"top": 1000, "view": 800, "height": 5000, "pad": 0, "head": 200, "shrink": 600}, {"top": 1000, "pad": 0, "now": False}),
    ("header in view near the page's end: room below so it stays", {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 200, "shrink": 600}, {"top": 4200, "pad": 600, "now": False}),
    ("header scrolled away above: to the view's top, at once", {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": -700, "shrink": 900}, {"top": 2300, "pad": 0, "now": True}),
    ("header above, near the end: to the top, with room below", {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": -300, "shrink": 1500}, {"top": 3900, "pad": 1200, "now": True}),
    ("room left by an earlier fold is not counted as page", {"top": 4200, "view": 800, "height": 5300, "pad": 300, "head": 100, "shrink": 200}, {"top": 4200, "pad": 200, "now": False}),
]


def main():
    cases = {"runs": [steps for _, steps, _ in RUNS], "fold": [s for _, s, _ in FOLD]}
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = []
    for (what, _, want), got in zip(RUNS, out["runs"]):
        for n, (w, g) in enumerate(zip(want, got)):
            if list(w) != g[:len(w)]:
                bad.append(f"focusStep, {what}, step {n + 1}: {g}, expected {list(w)}")
    bad += [f"foldScroll, {what}: {got}, expected {want}" for (what, _, want), got in zip(FOLD, out["fold"]) if got != want]
    for x in bad:
        print(x)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
