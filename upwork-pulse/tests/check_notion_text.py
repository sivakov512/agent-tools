#!/usr/bin/env python3
"""The dashboard reads both dialects of notion-fetch page text (assets/dashboard.html → notionText, unesc).

Since Oct 20, 2026 Notion's MCP returns pages with <toggle>, <b>, <code>, <p />, blank lines between blocks and
escapes like `auto\\_drafts` and `11\\:56`; before, <details>/<summary>, **bold**, `code` and tab-indented lines.
Each fixture pair holds one fictional page in both: the new one must come out as the old one (blank lines and
indentation aside: every reader here trims its lines), the old one must pass unchanged, and the config and Run
state lines must read the same values from both.

Run from anywhere: python3 upwork-pulse/tests/check_notion_text.py
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAGE = HERE.parent / "skills" / "upwork-pulse" / "assets" / "dashboard.html"
RUN = r"""
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function unesc("), src.indexOf("  function shortId("));
const [notionText, unesc] = new Function(fn + "; return [notionText, unesc];")();
const pairs = JSON.parse(process.argv[2]), out = {};
function values(t) { // what loadConfig and checkJobPages read, from the text with escapes undone
  const f = unesc(notionText(t)), v = {};
  for (const k of ["schema", "auto_drafts", "auto_skip", "drafts_task", "guide", "state", "chat_project", "skill_version"]) { const m = new RegExp("\\b" + k + ":\\s*`([^`]*)`").exec(f); if (m) v[k] = m[1]; }
  for (const k of ["match_score", "JOB_PAGES_PAUSE", "PROCESSED_UNTIL"]) { const m = new RegExp(k + ":\\s*`?(\\S+?)`?(?:\\s|$)").exec(f); if (m) v[k] = m[1]; }
  const d = /DEFERRED:\s*([^\n<]*)/.exec(f); if (d) v.DEFERRED = d[1].trim();
  return v;
}
for (const k in pairs) out[k] = { fromNew: notionText(pairs[k].new), fromOld: notionText(pairs[k].old), newValues: values(pairs[k].new), oldValues: values(pairs[k].old) };
console.log(JSON.stringify(out));
"""


def lines(t):
    return [l.strip() for l in t.split("\n") if l.strip()]


def main():
    pairs = {}
    for f in sorted((HERE / "fixtures").glob("*.new.md")):
        name = f.name[: -len(".new.md")]
        pairs[name] = {"new": f.read_text(), "old": (HERE / "fixtures" / f"{name}.old.md").read_text()}
    res = json.loads(subprocess.run(["node", "-e", RUN, str(PAGE), json.dumps(pairs)], capture_output=True, text=True, check=True).stdout)
    bad = []
    for name, r in res.items():
        if lines(r["fromNew"]) != lines(pairs[name]["old"]):
            bad.append(f"{name}: the new dialect does not come out as the old one:\n{r['fromNew']}")
        if r["fromOld"] != pairs[name]["old"]:
            bad.append(f"{name}: the old dialect changed:\n{r['fromOld']}")
        if name in ("root", "state") and not r["newValues"]:
            bad.append(f"{name}: no config or Run state value read")
        if r["newValues"] != r["oldValues"]:
            bad.append(f"{name}: values differ: new {r['newValues']} / old {r['oldValues']}")
    for b in bad:
        print(b)
    print(f"{len(bad)} problem(s)" if bad else f"notion-fetch dialects: {len(res)} page(s) read the same")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
