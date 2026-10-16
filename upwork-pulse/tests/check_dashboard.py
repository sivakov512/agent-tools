#!/usr/bin/env python3
"""The dashboard carries every placeholder `references/dashboard.md` → *Publish* fills, and no other.

A missing one leaves the published page reading nothing; an unknown one is published as is.
What every page needs (its scripts parse, no function declared twice, the version line) is
`scripts/check.py`'s.

Run from anywhere: python3 upwork-pulse/tests/check_dashboard.py
"""
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent / "skills" / "upwork-pulse"
NOTION_VALUES = {"__YES__", "__NO__"}  # Notion's checkbox values, not placeholders


def main():
    publish = (SKILL / "references" / "dashboard.md").read_text().split("## Publish", 1)[1].split("\n## ", 1)[0]
    filled = set(re.findall(r"`(__[A-Z_]+__)`", publish))
    found = set(re.findall(r"__[A-Z_]+__", (SKILL / "assets" / "dashboard.html").read_text())) - NOTION_VALUES
    bad = [f"placeholder in the page that Publish does not fill: {p}" for p in sorted(found - filled)]
    bad += [f"placeholder Publish fills that the page lacks: {p}" for p in sorted(filled - found)]
    for b in bad:
        print(b)
    print(f"{len(bad)} problem(s)" if bad else "dashboard placeholders match")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
