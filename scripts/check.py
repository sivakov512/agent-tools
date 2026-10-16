#!/usr/bin/env python3
"""Static checks every plugin gets (docs/skill-development.md §7), then the plugin's own tests/.

- registration: plugin.json names the folder; the plugin is in marketplace.json and both
  release-please files; no top-level bin/; every release-please extra file exists;
- the skill: frontmatter `name` is the folder's, `description` at most 1024 characters,
  SKILL.md under 500 lines; nothing in the skill points outside its folder;
- links: `references/x.md`, `references/x.md` §N, `references/x.md` → *Name* / **Name**,
  `SKILL.md` → *Name*, and a bare §N inside a reference (its own section) resolve — §N to a
  heading `## N.`, a name to a heading or a bold label in the target file; a (**Name**) or
  → **Name** with no file before it names a heading or a defining bold label (one that opens a
  line or item, or is followed by a dash or colon) in the same file, or, from a reference, in
  SKILL.md; a reference is named by its full path (`references/x.md`), never a bare `x.md`;
- graders: no empty grader and none without frontmatter (the harness skips those silently);
- pages: every script in assets/ parses (`node --check`), no function is declared twice in the
  scripts one page loads (the later one silently wins), and a page the release stamps starts with
  `<!-- <name>-version: x.y.z --> <!-- x-release-please-version -->`;
- tests: every *.py and *.sh in the plugin's tests/ exits 0.

Run from anywhere: python3 scripts/check.py [plugin ...]   (no plugin: every plugin in marketplace.json)
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE = json.loads((ROOT / ".release-please" / "config.json").read_text())
MANIFEST = json.loads((ROOT / ".release-please" / "manifest.json").read_text())
MARKET = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text())


def frontmatter(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None
    out = {}
    for line in m.group(1).splitlines():
        k = re.match(r"([\w-]+):\s*(.*)$", line)
        if not k:
            continue
        v = k.group(2).strip()
        if len(v) > 1 and v[0] == v[-1] == "'":
            v = v[1:-1].replace("''", "'")
        elif len(v) > 1 and v[0] == v[-1] == '"':
            v = json.loads(v)
        out[k.group(1)] = v
    return out


def check_registration(plugin, bad):
    pj = plugin / ".claude-plugin" / "plugin.json"
    if not pj.exists():
        return bad.append("no .claude-plugin/plugin.json")
    if json.loads(pj.read_text()).get("name") != plugin.name:
        bad.append("plugin.json name is not the folder's")
    if plugin.name not in {p["name"] for p in MARKET["plugins"]}:
        bad.append("not in .claude-plugin/marketplace.json")
    pkg = RELEASE["packages"].get(plugin.name)
    if pkg is None:
        bad.append("not in .release-please/config.json")
    if plugin.name not in MANIFEST:
        bad.append("not in .release-please/manifest.json")
    if (plugin / "bin").exists():
        bad.append("top-level bin/: claude.ai skips the plugin (use libexec/)")
    for extra in (pkg or {}).get("extra-files", []):
        path = extra if isinstance(extra, str) else extra["path"]
        if not (plugin / path).exists():
            bad.append(f"release-please extra file missing: {path}")


def anchors(path):
    text = path.read_text()
    heads = re.findall(r"^#{1,4} (.+)$", text, re.M)
    bold = re.findall(r"\*\*([^*\n]+?)\*\*", text)
    sections = {m for h in heads for m in re.findall(r"^(\d+)\.", h)}
    names = [re.sub(r"[`*]", "", x).strip().lower() for x in heads + bold]
    return sections, names


def labels(path):
    """Names a file defines: headings, and bold labels that open a line or item or are followed by a dash or colon."""
    text = path.read_text()
    found = re.findall(r"^#{1,4} (?:\d+\.\s*)?(.+)$", text, re.M)
    found += re.findall(r"^\s*(?:[-*]|\d+\.)?\s*\*\*([^*\n]+?)\*\*", text, re.M)
    found += re.findall(r"\*\*([^*\n]+?)\*\*\s*[—:]", text)
    return [re.sub(r"[`*]", "", x).strip().rstrip(".:").lower() for x in found]


def has_name(names, name):
    name = re.sub(r"[`*]", "", name).strip().lower()
    return any(name == n or n.startswith(name) or name.startswith(n) or name in n for n in names)


LINK = re.compile(r"`?(SKILL\.md|references/([\w-]+\.md))`?"
                  r"(?:\s*(?:→\s*(?:\*{1,2}([^*\n]+?)\*{1,2}|(\d+)\.?\s*[\w ]*|([A-Z][\w' ]+?)(?=[),.;:]))|§(\d+)))?")
OUTSIDE = re.compile(r"(?<![\w/.])(?:\.\./|docs/[\w-]+\.md)")


def check_skill(skill, bad):
    md = skill / "SKILL.md"
    text = md.read_text()
    fm = frontmatter(text)
    if fm is None:
        return bad.append(f"{skill.name}/SKILL.md: no frontmatter")
    if fm.get("name") != skill.name:
        bad.append(f"{skill.name}/SKILL.md: name is not the folder's")
    if not re.fullmatch(r"[a-z0-9-]{1,64}", fm.get("name", "")):
        bad.append(f"{skill.name}/SKILL.md: name must be lowercase letters, digits and hyphens, at most 64")
    desc = fm.get("description", "")
    if not desc:
        bad.append(f"{skill.name}/SKILL.md: no description")
    elif len(desc) > 1024:
        bad.append(f"{skill.name}/SKILL.md: description is {len(desc)} characters, over 1024")
    if text.count("\n") >= 500:
        bad.append(f"{skill.name}/SKILL.md: {text.count(chr(10))} lines, 500 or more")

    files = [md, *sorted((skill / "references").glob("*.md"))]
    stems = "|".join(re.escape(f.stem) for f in files[1:]) or "(?!)"
    cache, defined = {}, {}

    def get(path):
        if path not in cache:
            cache[path] = anchors(path)
        return cache[path]

    def own(path):
        if path not in defined:
            defined[path] = labels(path)
        return defined[path]

    for f in files:
        rel = f.relative_to(skill)
        own_sections, _ = get(f)
        for no, line in enumerate(f.read_text().splitlines(), 1):
            if OUTSIDE.search(line):
                bad.append(f"{rel}:{no}: points outside the skill folder (it ships alone)")
            for m in re.finditer(rf"(?<![\w/.-])({stems})\.md\b", line):
                bad.append(f"{rel}:{no}: name it references/{m.group(1)}.md, so the link is checked")
            spans = []
            for m in LINK.finditer(line):
                spans.append(m.span())
                whole, ref, star, arrow_num, plain, sect = m.groups()
                path = skill / (ref and f"references/{ref}" or whole)
                if not path.exists():
                    bad.append(f"{rel}:{no}: no file {whole}")
                    continue
                sections, names = get(path)
                num = sect or arrow_num
                if num and num not in sections:
                    bad.append(f"{rel}:{no}: {whole} has no section {num}")
                for nm in (star, plain):
                    if nm and not has_name(names, nm):
                        bad.append(f"{rel}:{no}: {whole} has no '{nm}'")
            # (**Name**) or → **Name** with no file before it: this file's own rule, else SKILL.md's
            for m in re.finditer(r"(?:\(|→\s*)\*\*([^*\n]+)\*\*", line):
                if any(a <= m.start() < b for a, b in spans):
                    continue
                nm = m.group(1)
                if not has_name(own(f), nm) and (f is md or not has_name(own(md), nm)):
                    bad.append(f"{rel}:{no}: no '{nm}' here{'' if f is md else ' or in SKILL.md'}")
            if f is md:
                continue
            for m in re.finditer(r"(?<![\w`])(?<!md )(?<!md` )§(\d+)", line):
                if re.search(rf"(\.md`?|{stems})$", line[:m.start()].rstrip()):
                    continue
                if m.group(1) not in own_sections:
                    bad.append(f"{rel}:{no}: no own section §{m.group(1)}")


def check_graders(plugin, bad):
    for g in sorted(plugin.glob("evals/**/graders/*.md")):
        rel = g.relative_to(plugin)
        fm = frontmatter(g.read_text())
        if not fm or "type" not in fm:
            bad.append(f"{rel}: no frontmatter with a type, so the harness skips it")


def declarations(js):
    """(enclosing block, name) of every function declaration: strings, comments and regex literals skipped."""
    out, stack, i, n, prev = [], [-1], 0, len(js), "("
    while i < n:
        c = js[i]
        if js.startswith("//", i):
            i = js.find("\n", i); i = n if i < 0 else i; continue
        if js.startswith("/*", i):
            i = js.find("*/", i + 2) + 2; continue
        if c in "\"'`":
            j = i + 1
            while j < n and js[j] != c:
                j += 2 if js[j] == "\\" else 1
            i, prev = j + 1, "a"; continue
        if c == "/" and prev in "(,=:[!&|?{};+-*%<>~^":
            j, cls = i + 1, False
            while j < n and (js[j] != "/" or cls):
                if js[j] == "\\": j += 1
                elif js[j] == "[": cls = True
                elif js[j] == "]": cls = False
                j += 1
            i, prev = j + 1, "a"; continue
        if c == "{": stack.append(i)
        elif c == "}" and len(stack) > 1: stack.pop()
        m = re.match(r"function\s+([A-Za-z_$][\w$]*)\s*\(", js[i:i + 80]) if c == "f" and (i == 0 or not re.match(r"[\w$.]", js[i - 1])) else None
        if m:
            out.append((stack[-1], m.group(1)))
        if not c.isspace():
            prev = c
        i += 1
    return out


def node_check(code, label, bad):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
        f.write(code)
    try:
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    except FileNotFoundError:
        return bad.append(f"{label}: node not found, scripts not checked")
    finally:
        Path(f.name).unlink()
    if r.returncode:
        bad.append(f"{label}: script does not parse:\n" + r.stderr.strip())


def check_script(code, label, bad):
    """Parses the script and finds functions declared twice in one inner scope; returns its top-level names."""
    node_check(code, label, bad)
    counts = {}
    for scope, n in declarations(code):
        counts[(scope, n)] = counts.get((scope, n), 0) + 1
    bad += [f"{label}: function {n} declared {c} times in one scope" for (s, n), c in counts.items() if c > 1 and s != -1]
    return [n for (s, n), c in counts.items() for _ in range(c) if s == -1]


def check_pages(plugin, bad):
    pkg = RELEASE["packages"].get(plugin.name, {})
    stamped = {e if isinstance(e, str) else e["path"] for e in pkg.get("extra-files", [])
               if isinstance(e, str) or e.get("type") == "generic"}
    for assets in sorted(plugin.glob("skills/*/assets")):
        tops = {js.name: check_script(js.read_text(), str(js.relative_to(plugin)), bad) for js in sorted(assets.glob("*.js"))}
        for page in sorted(assets.glob("*.html")):
            rel = page.relative_to(plugin)
            html = page.read_text()
            if str(rel) in stamped and not re.match(
                    r"<!-- [\w-]+-version: \d+\.\d+\.\d+ --> <!-- x-release-please-version -->", html):
                bad.append(f"{rel}: first line is not <!-- <name>-version: x.y.z --> <!-- x-release-please-version -->")
            # classic scripts share one global scope, so a name declared at the top of two of them collides
            top = [n for src in re.findall(r"<script[^>]*\bsrc=\"([\w.-]+\.js)\"", html) for n in tops.get(src, [])]
            inline = re.findall(r"<script(?![^>]*\bsrc=)(?![^>]*type=\"(?!text/javascript)[^\"]*\")[^>]*>(.*?)</script>", html, re.S)
            for k, code in enumerate(inline):
                top += check_script(code, f"{rel} inline script {k + 1}", bad)
            seen = {}
            for n in top:
                seen[n] = seen.get(n, 0) + 1
            bad += [f"{rel}: function {n} declared {c} times at the top level of its scripts" for n, c in seen.items() if c > 1]


def run_tests(plugin, bad):
    for t in sorted((plugin / "tests").glob("*")):
        cmd = {".py": ["python3"], ".sh": ["bash"]}.get(t.suffix)
        if not cmd:
            continue
        r = subprocess.run(cmd + [str(t)], capture_output=True, text=True)
        if r.returncode:
            tail = "\n".join((r.stdout + r.stderr).strip().splitlines()[-15:])
            bad.append(f"{t.relative_to(plugin)} failed:\n{tail}")


def main(names):
    names = names or [p["source"].removeprefix("./") for p in MARKET["plugins"]]
    failed = 0
    for name in names:
        plugin = ROOT / name
        bad = []
        if not plugin.is_dir():
            bad.append("no such folder")
        else:
            check_registration(plugin, bad)
            skills = sorted(p.parent for p in plugin.glob("skills/*/SKILL.md"))
            if not skills:
                bad.append("no skills/<skill>/SKILL.md")
            for skill in skills:
                check_skill(skill, bad)
            check_graders(plugin, bad)
            check_pages(plugin, bad)
            run_tests(plugin, bad)
        for b in bad:
            print(f"{name}: {b}")
        print(f"{name}: {len(bad)} problem(s)" if bad else f"{name}: all checks pass")
        failed += bool(bad)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
