#!/usr/bin/env python3
"""The dashboard reads a literal text field as it was meant (assets/core.js → plain).

Notion turns a domain-like part of a rich-text value into a link when it is written as plain text, so a `Code folder` such as
/Users/me/Development/example.dev/clients/acme_co/meter reads back as /Users/me/Development/[example.dev/clients/acme\\_co/meter](http://…),
and the dashboard would hand the app a folder that does not exist. Written as inline code it reads back as <code>…</code>. Every form
must come out as the path itself, and a path's own __, * and brackets must stay.

Run from anywhere: python3 project-tracker/tests/check_plain_text.py
"""
import json
import subprocess
import sys
from pathlib import Path

CORE = Path(__file__).resolve().parent.parent / "skills" / "project-tracker" / "assets" / "core.js"
RUN = """
const src = require("fs").readFileSync(process.argv[1], "utf8");
const fn = src.slice(src.indexOf("  function unesc("), src.indexOf("  // A page's text as notion-fetch returns it"));
const plain = new Function(fn + "; return plain;")();
console.log(JSON.stringify(JSON.parse(process.argv[2]).map(plain)));
"""
PATH = "/Users/me/Development/example.dev/clients/acme_co/meter"
CASES = [
    ("/Users/me/Development/[example.dev/clients/acme\\_co/meter](http://example.dev/clients/acme_co/meter)", PATH),
    ("<code>" + PATH + "</code>", PATH),
    ("`" + PATH + "`", PATH),
    ("/Users/me/Development/example.dev/clients/acme\\_co/meter", PATH),
    (" " + PATH + " ", PATH),
    ("/Users/me/x__y/a\\*b", "/Users/me/x__y/a*b"),
    ("/Users/me/\\[old\\]/meter", "/Users/me/[old]/meter"),
    ("", ""),
]


def main():
    out = json.loads(subprocess.run(["node", "-e", RUN, str(CORE), json.dumps([c for c, _ in CASES])], capture_output=True, text=True, check=True).stdout)
    bad = [f"{c!r} → {o!r}, expected {want!r}" for (c, want), o in zip(CASES, out) if o != want]
    for b in bad:
        print("plain:", b)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
