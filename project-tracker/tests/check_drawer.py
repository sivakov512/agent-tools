#!/usr/bin/env python3
"""The project page's top bar names what the reader is in, as the page draws it (assets/core.js → focusChain), and a fold keeps the
folded item's header where the reader looks (foldScroll).

focusChain gets the page's blocks (items that open in place) in document order — the block each is drawn in, whether it is open, its box
on screen — the view and its focus line, and the block the reader just opened; it returns the chain the bar shows, outermost first.
The cases are the layouts the user hit: a task opened under Open items is not its milestone's, a task inside an opened milestone in the
Plan is milestone › task, a block inside a folded milestone or section is not drawn, nothing at the line is the project.

Run from anywhere: python3 project-tracker/tests/check_drawer.py
"""
import json
import subprocess
import sys
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function focusChain("), src.indexOf("  // ---------- the timeline ----------"));
const f = new Function(fn + "; return { focusChain: focusChain, foldScroll: foldScroll };")();
const c = JSON.parse(process.argv[2]);
console.log(JSON.stringify({
  chain: c.chain.map(x => f.focusChain(x.blocks, x.view, x.pin)),
  fold: c.fold.map(x => f.foldScroll(x)),
}));
"""
VIEW = {"top": 0, "bottom": 900, "line": 300}


def b(parent, open_, top, bottom):
    return {"parent": parent, "open": open_, "top": top, "bottom": bottom}


# A drawer: Open items (0: a task waiting on someone, 1: a problem), then the Plan (2: a milestone, 3–4: its tasks, 5: another milestone).
def layout(**k):
    blocks = [
        b(-1, k.get("w", False), 100, 600 if k.get("w") else 150),     # 0 Open items: TSK-25, whose milestone is 2
        b(-1, k.get("p", False), 600, 650),                             # 1 Open items: a problem
        b(-1, k.get("m", True), 650, 2000 if k.get("m", True) else 700),  # 2 Plan: MLS-10
        b(2, k.get("t1", False), 900, 1300 if k.get("t1") else 950),    # 3 its TSK-13
        b(2, k.get("t2", False), 1300, 1350),                           # 4 its TSK-25
        b(-1, False, 2000, 2050),                                       # 5 Plan: MLS-11
    ]
    for i, d in k.get("boxes", {}).items():
        blocks[i]["top"], blocks[i]["bottom"] = d
    return blocks


def at(scroll, blocks):  # the same page scrolled down by `scroll`
    return [dict(x, top=x["top"] - scroll, bottom=x["bottom"] - scroll) for x in blocks]


CHAIN = [
    ("nothing opened at the line: the project", layout(m=False), -1, []),
    ("a task opened under Open items is that task, never its milestone", layout(w=True), -1, [0]),
    ("an opened milestone at the line, its tasks closed", at(500, layout()), -1, [2]),
    ("a task opened inside its opened milestone: milestone › task", at(700, layout(t1=True)), -1, [2, 3]),
    ("the line in the milestone's details above its tasks", at(400, layout(t1=True)), -1, [2]),
    ("the line past the opened task, still in the milestone", at(1050, layout(t1=True)), -1, [2]),
    ("the line past the milestone's end: the project", at(1720, layout(t1=True)), -1, []),
    ("a task left open inside a folded milestone is not drawn", at(700, layout(m=False, t1=True, boxes={3: (900, 1300)})), -1, []),
    ("a block in a folded section has no box", at(700, layout(t1=True, boxes={2: (650, 650), 3: (650, 650)})), -1, []),
    ("the block just opened is named while in view, though below the line", at(200, layout(t1=True)), 3, [2, 3]),
    ("the block just opened, scrolled out of view: the line again", at(2400, layout(t1=True)), 3, []),
    ("the block just opened, folded again: the line again", at(500, layout()), 3, [2]),
    ("the block just opened, inside a milestone folded since: the line", layout(m=False, t1=True, boxes={3: (900, 1300)}), 3, []),
    ("the task under Open items just opened, with the plan's milestone at the line", at(400, layout(w=True)), 0, [0]),
]

FOLD = [  # (what, state, expected): the header in view stays; scrolled away above, it comes to the view's top at once
    ("header in view: the page stays, no room needed", {"top": 1000, "view": 800, "height": 5000, "pad": 0, "head": 200, "shrink": 600}, {"top": 1000, "pad": 0, "now": False}),
    ("header in view near the page's end: room below so it stays", {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 200, "shrink": 600}, {"top": 4200, "pad": 600, "now": False}),
    ("header scrolled away above: to the view's top, at once", {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": -700, "shrink": 900}, {"top": 2300, "pad": 0, "now": True}),
    ("header above, near the end: to the top, with room below", {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": -300, "shrink": 1500}, {"top": 3900, "pad": 1200, "now": True}),
    ("room left by an earlier fold is not counted as page", {"top": 4200, "view": 800, "height": 5300, "pad": 300, "head": 100, "shrink": 200}, {"top": 4200, "pad": 200, "now": False}),
]


def main():
    cases = {"chain": [{"blocks": bl, "view": VIEW, "pin": pin} for _, bl, pin, _ in CHAIN], "fold": [s for _, s, _ in FOLD]}
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"focusChain, {what}: {got}, expected {want}" for (what, _, _, want), got in zip(CHAIN, out["chain"]) if got != want]
    bad += [f"foldScroll, {what}: {got}, expected {want}" for (what, _, want), got in zip(FOLD, out["fold"]) if got != want]
    for x in bad:
        print(x)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
