#!/usr/bin/env python3
"""The dashboard reads both dialects of notion-fetch page text (assets/core.js → notionText).

Since Oct 20, 2026 Notion's MCP returns pages with <toggle>, <b>, <code>, pipe tables, <p /> and nesting by two
spaces; before, <details>/<summary>, **bold**, `code`, <table> and tabs. Each fixture pair holds one fictional page
in both: the new one must come out as the old one (blank lines aside: no reader counts them), and the old one
must pass unchanged.

Run from anywhere: python3 project-tracker/tests/check_notion_text.py
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CORE = HERE.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function notionText("), src.indexOf("  function clean("));
const notionText = new Function(fn + "; return notionText;")();
const pairs = JSON.parse(process.argv[2]), out = {};
for (const k in pairs) out[k] = { fromNew: notionText(pairs[k].new), fromOld: notionText(pairs[k].old) };
console.log(JSON.stringify(out));
"""


def main():
    pairs = {}
    for f in sorted((HERE / "fixtures").glob("*.new.md")):
        name = f.name[: -len(".new.md")]
        pairs[name] = {"new": f.read_text(), "old": (HERE / "fixtures" / f"{name}.old.md").read_text()}
    res = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps(pairs)], capture_output=True, text=True, check=True).stdout)
    bad = []
    for name, r in res.items():
        old = pairs[name]["old"]
        if "\n".join(l for l in r["fromNew"].split("\n") if l.strip()) != "\n".join(l for l in old.split("\n") if l.strip()):
            bad.append(f"{name}: the new dialect does not come out as the old one:\n{r['fromNew']}")
        if r["fromOld"] != old:
            bad.append(f"{name}: the old dialect changed:\n{r['fromOld']}")
    for b in bad:
        print(b)
    print(f"{len(bad)} problem(s)" if bad else f"notion-fetch dialects: {len(res)} page(s) read the same")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
