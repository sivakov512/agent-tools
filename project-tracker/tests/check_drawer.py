#!/usr/bin/env python3
"""On the project page an opened item's header sticks while the item is read, under the headers of the opened items it is drawn in
(assets/core.js → stickTops), and a fold keeps the folded item's header where the reader sees it, stuck or not (foldScroll).

stickTops gets the page's blocks (items that open in place) in document order — the block each is drawn in, whether it is open, its
header's height — and returns the offset each header sticks at. foldScroll gets the scroll box, where the folded item's header shows and
where the item starts, and returns where the page must stand so nothing moves under the reader.

Run from anywhere: python3 project-tracker/tests/check_drawer.py
"""
import json
import subprocess
import sys
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function stickTops("), src.indexOf("  // ---------- the timeline ----------"));
const f = new Function(fn + "; return { stickTops: stickTops, foldScroll: foldScroll };")();
const c = JSON.parse(process.argv[2]);
console.log(JSON.stringify({ tops: c.tops.map(f.stickTops), fold: c.fold.map(f.foldScroll) }));
"""


def b(parent, open_, head):
    return {"parent": parent, "open": open_, "head": head}


# A page: Open items (0: a task, 1: a problem), then the Plan (2: MLS-10 with 3, 4: its tasks; 5: MLS-11 with 6: its task).
def page(**o):
    return [b(-1, o.get("w", False), 48), b(-1, o.get("p", False), 48), b(-1, o.get("m10", True), o.get("mh", 48)),
            b(2, o.get("t13", False), o.get("th", 46)), b(2, False, 46), b(-1, o.get("m11", False), 48), b(5, o.get("t30", False), 46)]


TOPS = [  # (what, blocks, expected offsets)
    ("an item under Open items sticks at the top, as a milestone does", page(w=True), [0, 0, 0, 48, 48, 0, 0]),
    ("a milestone's tasks stick under its header; the task headers of another milestone under its own",
     page(t13=True, m11=True, t30=True), [0, 0, 0, 48, 48, 0, 48]),
    ("a header that wraps to two lines (a phone) moves the ones under it by its height", page(t13=True, mh=70), [0, 0, 0, 70, 70, 0, 0]),
    ("a folded milestone adds nothing above its tasks", page(m10=False), [0, 0, 0, 0, 0, 0, 0]),
    ("three levels stack all the way", [b(-1, True, 48), b(0, True, 46), b(1, True, 40)], [0, 48, 94]),
]

FOLD = [  # (what, state, expected)
    ("a header in its place, in view: the page stays, the fold slides",
     {"top": 1000, "view": 800, "height": 5000, "pad": 0, "head": 200, "from": 200, "shrink": 600}, {"top": 1000, "pad": 0, "now": False}),
    ("a header in its place near the page's end: room below so it stays",
     {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 200, "from": 200, "shrink": 600}, {"top": 4200, "pad": 600, "now": False}),
    ("a milestone folded from its header stuck at the top: its start comes up to where the header shows, at once",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": 0, "from": -700, "shrink": 900}, {"top": 2300, "pad": 0, "now": True}),
    ("a task folded from its header stuck under its milestone's: it lands right under the milestone's header",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": 48, "from": -400, "shrink": 500}, {"top": 2552, "pad": 0, "now": True}),
    ("a stuck header folded near the page's end: up to it, with room below",
     {"top": 4200, "view": 800, "height": 5000, "pad": 0, "head": 0, "from": -300, "shrink": 1500}, {"top": 3900, "pad": 1200, "now": True}),
    ("a header scrolled away above, not stuck (a section's): to the view's top, at once",
     {"top": 3000, "view": 800, "height": 5000, "pad": 0, "head": -300, "from": -300, "shrink": 900}, {"top": 2700, "pad": 0, "now": True}),
    ("room left by an earlier fold is not counted as page",
     {"top": 4200, "view": 800, "height": 5300, "pad": 300, "head": 100, "from": 100, "shrink": 200}, {"top": 4200, "pad": 200, "now": False}),
]


def main():
    cases = {"tops": [x for _, x, _ in TOPS], "fold": [x for _, x, _ in FOLD]}
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
    bad = [f"stickTops, {what}: {got}, expected {want}" for (what, _, want), got in zip(TOPS, out["tops"]) if got != want]
    bad += [f"foldScroll, {what}: {got}, expected {want}" for (what, _, want), got in zip(FOLD, out["fold"]) if got != want]
    for x in bad:
        print(x)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
