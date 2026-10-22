#!/usr/bin/env python3
"""On the project page an opened item's header sticks while the item is read, one at a time — the innermost item being read
(assets/core.js → stuckOne) — and a fold keeps the folded item's header where the reader sees it, stuck or not, never under its
parent's header that sticks again (foldScroll).

stuckOne gets the page's blocks (items that open in place) in document order — the block each is drawn in, open or not, its box from the
view's top, its header's height — and returns the block whose header is stuck. foldScroll gets the scroll box, where the folded item's
header shows, where the item starts and its parent's header height, and returns where the page must stand so nothing moves under the reader.

Run from anywhere: python3 project-tracker/tests/check_drawer.py
"""
import json
import subprocess
import sys
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function stuckOne("), src.indexOf("  // ---------- the timeline ----------"));
const f = new Function(fn + "; return { stuckOne: stuckOne, foldScroll: foldScroll };")();
const c = JSON.parse(process.argv[2]);
console.log(JSON.stringify({ stuck: c.stuck.map(f.stuckOne), fold: c.fold.map(f.foldScroll) }));
"""


def b(parent, open_, top, bottom, head):
    return {"parent": parent, "open": open_, "top": top, "bottom": bottom, "head": head}


# A page, boxes from the view's top: Open items (0: a task, 1: a problem), the Plan (2: MLS-10 with 3: TSK-13, 4: TSK-25; 5: MLS-11).
def page(w=(None, None), m10=(None, None), t13=(None, None), m11=(None, None), m10_open=True):
    def blk(parent, box, head, at, h):
        return b(parent, box[0] is not None, box[0] if box[0] is not None else at, box[1] if box[0] is not None else at + h, head)
    return [blk(-1, w, 46, -2000, 46), b(-1, False, -1900, -1854, 46), b(-1, m10_open, *(m10 if m10[0] is not None else (-1500, -1452)), 48),
            blk(2, t13, 46, 600, 46), b(2, False, 900, 946, 46), blk(-1, m11, 48, 1500, 48)]


STUCK = [  # (what, blocks, the block whose header is stuck: -1 none)
    ("nothing opened has reached the top", page(m10=(100, 900)), -1),
    ("reading a milestone: its header is the stuck one", page(m10=(-200, 900)), 2),
    ("a task opened inside it reaching the top takes the place; the milestone's gives way", page(m10=(-500, 1200), t13=(-50, 400)), 3),
    ("a task not at the top yet: the milestone's stays, the task's slides in over it", page(m10=(-500, 1200), t13=(20, 400)), 2),
    ("a task ending: less than its header left, the milestone's is back as the task's slides away", page(m10=(-900, 900), t13=(-400, 30)), 2),
    ("past the task, in the milestone's rest: the milestone's", page(m10=(-1200, 600), t13=(-700, -100)), 2),
    ("the milestone ending: nothing item-level is stuck", page(m10=(-1200, 40)), -1),
    ("an item under Open items alone, whatever milestone it is in", page(w=(-100, 300)), 0),
    ("a task left open inside a milestone just folded (its box still sliding away) is not the stuck one",
     page(m10=(-600, 400), t13=(-50, 400), m10_open=False), -1),
    ("two milestones: the second one read after the first ended", page(m10=(-1200, -200), m11=(-100, 700)), 5),
]

FOLD = [  # (what, state, expected)
    ("a header in its place, in view: the page stays, the fold slides",
     {"top": 1000, "view": 800, "height": 5000, "pad": 0, "head": 200, "from": 200, "under": 48, "shrink": 600}, {"top": 1000, "pad": 0, "now": False}),
    ("a header in its place near the page's end: room below so it stays",
     {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 200, "from": 200, "under": 0, "shrink": 600}, {"top": 4200, "pad": 600, "now": False}),
    ("a milestone folded from its header stuck at the top: its start comes up to where the header shows, at once",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": 0, "from": -700, "under": 0, "shrink": 900}, {"top": 2300, "pad": 0, "now": True}),
    ("a task folded from its header stuck at the top: it lands under its milestone's header, which sticks again",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": 0, "from": -400, "under": 48, "shrink": 500}, {"top": 2552, "pad": 0, "now": True}),
    ("a task folded while sliding in over its milestone's stuck header: down to just under it",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": 20, "from": 20, "under": 48, "shrink": 500}, {"top": 2972, "pad": 0, "now": True}),
    ("a stuck header folded near the page's end: up to it, with room below",
     {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 0, "from": -300, "under": 0, "shrink": 1500}, {"top": 3900, "pad": 1200, "now": True}),
    ("a header scrolled away above, not stuck (a section's): to the view's top, at once",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": -300, "from": -300, "under": 0, "shrink": 900}, {"top": 2700, "pad": 0, "now": True}),
    ("room left by an earlier fold is not counted as page",
     {"top": 4200, "view": 800, "height": 5300, "pad": 300, "head": 100, "from": 100, "under": 0, "shrink": 200}, {"top": 4200, "pad": 200, "now": False}),
]


def main():
    cases = {"stuck": [x for _, x, _ in STUCK], "fold": [x for _, x, _ in FOLD]}
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"stuckOne, {what}: {got}, expected {want}" for (what, _, want), got in zip(STUCK, out["stuck"]) if got != want]
    bad += [f"foldScroll, {what}: {got}, expected {want}" for (what, _, want), got in zip(FOLD, out["fold"]) if got != want]
    for x in bad:
        print(x)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
