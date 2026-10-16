#!/usr/bin/env python3
"""Privacy check for a pull request (docs/skill-development.md §8): nothing private reaches this public repository.

What it looks for:
- links to Claude sessions — claude.ai/code/session_<id>, claude.ai/chat/<id>, claude.ai/share/<id>, cse_<id> —
  with a real id; the eval mocks' fake ids (session_01Eval…, session_01Other…) and placeholders
  (session_<id>, "session_" + sid) pass;
- AI signatures in the PR title and body and in commit messages: "Generated with [Claude Code]", a
  Co-Authored-By line naming Claude or Anthropic, a line opening with 🤖, a Claude-Session: trailer.
  Added file lines are not checked for these: alter-ego's own docs and tests are about them;
- private terms: the PRIVATE_TERMS environment variable (a repository secret in CI), one word or regex
  per line, matched case-insensitively in the texts, the added lines and the names of added files.
  Unset or empty: that part is skipped with a notice.

A finding names its kind and where it is, never what matched, so the CI log of a public repository does
not repeat the leak, and never the term.

Run from the repository root:
  python3 scripts/check_privacy.py                        # this branch: origin/master..HEAD
  python3 scripts/check_privacy.py --range BASE..HEAD     # commit messages in the range, lines it adds
  python3 scripts/check_privacy.py --diff x.diff --text "PR body" body.txt
  python3 scripts/check_privacy.py --self-test            # the patterns catch the bad forms, pass the fakes,
                                                          # and the repository's files pass
Exit status: 0 clean, 1 something found, 2 bad usage.
"""
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IN_CI = os.environ.get("GITHUB_ACTIONS") == "true"

SESSION_LINKS = [
    ("a Claude session link", re.compile(r"claude\.ai/code/session_(?!01Eval|01Other)[A-Za-z0-9]{8,}")),
    ("a Claude session id", re.compile(r"(?<![A-Za-z0-9_])session_01(?!Eval|Other)[A-Za-z0-9]{16,}")),
    ("a Claude chat link", re.compile(r"claude\.ai/(?:chat|share)/[0-9A-Fa-f]{8}-?[0-9A-Fa-f]{4}")),
    ("a Claude session id", re.compile(r"(?<![A-Za-z0-9_])cse_[A-Za-z0-9]{12,}")),
]
SIGNATURES = [
    ("an AI signature", re.compile(r"generated\s+with\s+\[?claude", re.I)),
    ("an AI co-author line", re.compile(r"^\W*co-authored-by:.*\b(?:claude|anthropic)", re.I)),
    ("a 🤖 line", re.compile(r"^\W*🤖")),
    ("a Claude-Session trailer", re.compile(r"^\W*claude-session\s*:", re.I)),
]


def private_terms(raw):
    terms = []
    for line in (raw or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            terms.append(re.compile(line, re.I))
        except re.error:
            terms.append(re.compile(re.escape(line), re.I))
    return terms


def scan(lines, patterns, terms):
    """Yields (line number, kind) for each line that carries a pattern or a private term."""
    for no, line in lines:
        for kind, rx in patterns:
            if rx.search(line):
                yield no, kind
                break
        if any(rx.search(line) for rx in terms):
            yield no, "a private term"


def added_lines(diff):
    """Yields (path, line number in the new file, text) for each added line, and (path, None, path) for an added file's name."""
    path, named, added_file, old_left, new_left, no = None, False, False, 0, 0, 0

    def header_path(line):
        return re.sub(r"^b/", "", line.rsplit(" b/", 1)[-1].strip().strip('"'))

    header = ""
    for line in diff.splitlines():
        if old_left > 0 or new_left > 0:
            if line.startswith("+"):
                yield path, no, line[1:]
                no, new_left = no + 1, new_left - 1
            elif line.startswith("-"):
                old_left -= 1
            elif line.startswith(" "):
                no, old_left, new_left = no + 1, old_left - 1, new_left - 1
            continue
        if line.startswith("diff --git "):
            if added_file and not named:
                yield header_path(header), None, header_path(header)
            header, path, named, added_file = line, None, False, False
        elif line.startswith("new file mode"):
            added_file = True
        elif line.startswith("rename to "):
            path, named = line[len("rename to "):].strip().strip('"'), True
            yield path, None, path
        elif line.startswith("+++ "):
            target = line[4:].strip().strip('"')
            path = None if target == "/dev/null" else re.sub(r"^b/", "", target)
            if path and added_file and not named:
                named = True
                yield path, None, path
        elif line.startswith("@@"):
            m = re.match(r"@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@", line)
            if m and path:
                old_left = int(m.group(1) or 1)
                no, new_left = int(m.group(2)), int(m.group(3) or 1)
    if added_file and not named:
        yield header_path(header), None, header_path(header)


def check(texts, diff, terms):
    """Returns findings as (label, line number or None, kind, is a file)."""
    found = []
    for label, text in texts:
        lines = list(enumerate(text.splitlines(), 1))
        found += [(label, no, kind, False) for no, kind in scan(lines, SESSION_LINKS + SIGNATURES, terms)]
    for path, no, text in added_lines(diff or ""):
        patterns = [] if no is None else SESSION_LINKS
        found += [(path, no, kind if no else "a private term in the file name", True)
                  for _, kind in scan([(no, text)], patterns, terms)]
    return found


def report(found):
    for label, no, kind, is_file in found:
        where = f"{label}:{no}" if no else label
        print(f"privacy: {kind} in {where}")
        if IN_CI:
            loc = f" file={label},line={no}" if is_file and no else ""
            print(f"::error{loc}::{kind} in {where}")


def git(*args):
    return subprocess.run(["git", "-c", "core.quotePath=false", *args],
                          cwd=ROOT, capture_output=True, text=True, check=True).stdout


def from_range(rng):
    base, _, head = rng.partition("..")
    head = head.lstrip(".") or "HEAD"
    log = git("log", "--format=%h%x00%B%x1e", f"{base}..{head}")
    texts = []
    for entry in filter(str.strip, log.split("\x1e")):
        sha, _, body = entry.strip("\n").partition("\x00")
        texts.append((f"commit {sha}", body))
    diff = git("diff", "--no-color", "--no-ext-diff", "-U0", "--src-prefix=a/", "--dst-prefix=b/", f"{base}...{head}")
    return texts, diff


# The bad ids are built from parts, so that this file itself carries none.
SID, UUID, CSE = "session_" + "01ABcdEFghIJklMNopQRstUV", "3f2b1c9e" + "-4d5a-4e6f-8a7b-9c0d1e2f3a4b", "cse_" + "9Kq2LmZx81RtYb"
BAD = [
    f"see https://claude.ai/code/{SID} for the run",
    f"claude://claude.ai/code/{SID}",
    f"Session id {SID}",
    f"https://claude.ai/chat/{UUID}",
    f"https://claude.ai/share/{UUID}",
    f"https://claude.ai/cowork/{CSE}",
    "🤖 Generated with [Claude Code](https://claude.com/claude-code)",
    "Generated with Claude Code",
    "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>",
    "co-authored-by: someone <noreply@anthropic.com>",
    "> 🤖 made by a bot",
    "Claude-Session: https://claude.ai/code/session_01EvalTaskChat",
]
GOOD = [
    "https://claude.ai/code/session_01EvalTaskChat",
    "https://claude.ai/code/session_01EvalOtherChat",
    "https://claude.ai/code/session_01OtherThing",
    "`Chat` holds `https://claude.ai/code/session_<id>`",
    "the link is claude.ai/code/session_… with the id",
    '"claude://claude.ai/code/session_" + sid',
    "https://claude.ai/cowork/cse_<id>",
    "set_session_title with session_id: \"self\"",
    "Anthropic-hosted cloud sessions (claude.ai/code) run the wrappers",
    "https://claude.ai/chat/<id>",
    "no `Co-Authored-By: Claude`, no \"Generated by\", no 🤖 here",
    "Co-Authored-By: Jane Doe <jane@example.com>",
    "fix(alter-ego): refuse a push whose message carries 🤖",
]


def self_test():
    failed = []
    for line in BAD:
        if not check([("t", line)], "", []):
            failed.append(f"not caught: {line}")
    for line in GOOD:
        if check([("t", line)], "", []):
            failed.append(f"caught wrongly: {line}")

    diff = ("diff --git a/x.md b/x.md\n--- a/x.md\n+++ b/x.md\n@@ -3,0 +4,4 @@\n"
            f"+fine\n+++ a line that looks like a header\n+claude.ai/code/{SID}\n+🤖 Generated with [Claude Code]\n"
            "diff --git a/old.md b/acme-plan.md\nsimilarity index 100%\nrename from old.md\nrename to acme-plan.md\n"
            "diff --git a/empty-acme b/empty-acme\nnew file mode 100644\nindex 0000000..e69de29\n"
            "diff --git a/acme-notes.md b/acme-notes.md\nnew file mode 100644\n--- /dev/null\n+++ b/acme-notes.md\n"
            "@@ -0,0 +1,2 @@\n+Call ACME on Monday\n+nothing here\n")
    got = check([("PR body", "Thanks\nfrom Foo42 ltd")], diff, private_terms("acme\n\n  foo\\d+  \n[unclosed"))
    want = [("PR body", 2, "a private term", False), ("x.md", 6, "a Claude session link", True),
            ("acme-plan.md", None, "a private term in the file name", True),
            ("empty-acme", None, "a private term in the file name", True),
            ("acme-notes.md", None, "a private term in the file name", True), ("acme-notes.md", 1, "a private term", True)]
    if got != want:
        failed.append(f"diff and terms: got {got}, want {want}")

    # The repository's own files carry none of the links (signatures are left to the texts).
    for path in git("ls-files").splitlines():
        try:
            with open(ROOT / path, encoding="utf-8") as f:
                lines = list(enumerate(f, 1))
        except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
            continue
        failed += [f"{path}:{no}: {kind}" for no, kind in scan(lines, SESSION_LINKS, [])]

    for f in failed:
        print(f"self-test: {f}")
    print(f"self-test: {len(failed)} problem(s)" if failed else
          f"self-test: {len(BAD)} bad forms caught, {len(GOOD)} good ones and the repository's files pass")
    return 1 if failed else 0


def main():
    ap = argparse.ArgumentParser(description="Privacy check for a pull request.")
    ap.add_argument("--range", help="BASE..HEAD: check the commit messages in it and the lines it adds")
    ap.add_argument("--diff", help="a unified diff to check the added lines of ('-' for stdin)")
    ap.add_argument("--text", nargs=2, action="append", default=[], metavar=("LABEL", "FILE"),
                    help="a text to check (PR title, PR body, a message), named LABEL in findings")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if args.range and args.diff:
        ap.error("--range and --diff exclude each other")

    texts = []
    for label, path in args.text:
        with open(path, encoding="utf-8") as f:
            texts.append((label, f.read()))
    diff = ""
    if args.diff:
        diff = sys.stdin.read() if args.diff == "-" else open(args.diff, encoding="utf-8").read()
    elif args.range or not texts:
        commits, diff = from_range(args.range or "origin/master..HEAD")
        texts += commits

    terms = private_terms(os.environ.get("PRIVATE_TERMS"))
    if not terms:
        print(("::notice::" if IN_CI else "") + "privacy: PRIVATE_TERMS is not set, private terms not checked")
    found = check(texts, diff, terms)
    report(found)
    print(f"privacy: {len(found)} finding(s)" if found else
          f"privacy: clean ({len(texts)} text(s), {sum(1 for _, no, _ in added_lines(diff) if no)} added line(s))")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
