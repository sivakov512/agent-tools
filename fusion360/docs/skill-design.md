# Skill design

How the `fusion360` skill is put together and the criteria every change is checked against — for whoever edits `skills/fusion360/`. Read `docs/skill-development.md` at the repository root first: this file adds only what is particular to this plugin. The skill does not read it at run time.

The skill is a set of rules and style for building and editing parametric models in Autodesk Fusion 360, for any part, through the Fusion MCP server or Fusion API scripts: every dimension a named parameter, derived sizes as formulas, each part its own component, sketches fully constrained and named, a history that reads top to bottom, printed parts that print and fit. Left to itself an agent hardcodes derived numbers, abbreviates names, leaves sketches underconstrained as "Sketch1" and fixes a mistake with a corrective step on top; the model then works once and breaks on the first change of a size.

## What the skill must do

Each has an eval case (`evals/README.md`) or a *not checked* decision under *Decisions* (`docs/skill-development.md` §7.2); a change that breaks one is a bug, not a trade-off.

1. **Every dimension is a parameter, every derived size a formula** — never a number worked out by hand.
2. **Names follow one scheme**: scope prefixes (shared, per part, per element), whole words from one vocabulary, a comment on each parameter, one concept one parameter; sketches and features named by meaning, a feature never the same as its sketch.
3. **Each part is its own component; parts from outside the design are linked and placed**, and the model is built around them.
4. **Sketches are fully constrained by the constraints they need.**
5. **A change edits the step that made the thing**, never a corrective step on top.
6. **Internal corners are filleted; printed parts print and fit**: a shared fit gap, local gaps where a mechanism needs them, bed and lead-in chamfers, hole chamfers, print orientation.
7. **Every change is checked**: health, rebuild over key parameters, interference and gaps, moving parts over their travel, keyed assembly.
8. **Changes beyond the request are proposed, not made**, and whatever a check moves is restored.
9. **The document is saved only when the user asks**, since every save is a cloud version.
10. **It loads for Fusion modelling work, with or without the word Fusion, and not for unrelated work or other CAD tools.** — `trigger-named`, `trigger-unnamed`, `unrelated`, `other-cad-tool`.

## Decisions

Choices the user made or confirmed. A request that goes against one is raised with the user before anything changes.

- **Fusion 360 only, named after it.** The skill is for modelling in Fusion, so it is called `fusion360`; other CAD tools are out of scope, and the description says so, since a modelling request in OpenSCAD or FreeCAD reads much like one in Fusion.
- **Rules and style for any part, nothing personal.** The repository is public: the skill names no user, no domain (electronics, boards), no tracker and no specific part; examples are generic (a box, a lid, a bracket) and parts it does not make are "mating parts" or "parts from outside the design".
- **Rules keep their short reasons.** A reason lets the model apply a rule to a case the list does not name; only duplication is cut.
- **Prefixes as a scheme.** `common__` for what several parts share, `<part>__` for one part, `<element>__` for a reusable element, kept even when several parts use it; a part's prefix is its component name in lower snake case; the double underscore separates the scope from the name, which itself uses single underscores. The skill gives the scheme, not concrete names.
- **One vocabulary for sizes.** width is X, depth is Y, height is Z; thickness, dia, radius, gap, pitch, count; positions end in `_x`, `_y`, `_z` and are measured from one datum. `dia` is the one accepted abbreviation, and "gap" is used for every clearance.
- **Edit history instead of adding steps.** Reordering the timeline, or deleting and recreating a feature in place, is preferred over a corrective feature at the end.
- **A shared fit gap where fits are alike, a local gap where a mechanism differs.** Fits of the same kind are tuned in one place; a hinge or a latch that needs its own gap gets its own parameter rather than bending the shared one.
- **Saving only when asked.** Every save makes a new cloud version; this is about Fusion, not one user's taste.
- **API notes load on demand.** The rules are in `SKILL.md`; the API calls, pitfalls and export live in `references/fusion-api.md`, read before the first script.
- **Behaviour cases: none.** The user decided per behaviour, below: rule compliance shows in real use on real Fusion, and a mock can only imagine the results.
- **1, parameters and formulas: not checked.** A hardcoded or hand-computed size shows in the parameter table and breaks on the first change; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **2, naming: not checked.** Names are what the user reads in the browser and timeline; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **3, components and linked parts: not checked.** Bodies in the root or a redrawn mating part show in the browser; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **4, constrained sketches: not checked.** An underconstrained sketch shows in Fusion's sketch status and moves on the next edit; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **5, editing in place: not checked.** A corrective step shows at the end of the timeline; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **6, fillets and printed-part features: not checked.** Missing fillets, chamfers or fit gaps show in the model and on the first print; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **7, checks after each change: not checked.** A skipped check shows as a misfit the user sees in the model; it shows in the model the user opens on real Fusion, and a case could only grade scripts against a mock that imagines Fusion's answers (`docs/skill-development.md` §7.2, criteria 1 and 4).
- **8, changes beyond the request: not checked.** An unrequested change lands in the user's own open document, where the timeline shows it and undo reverts it (`docs/skill-development.md` §7.2, criterion 1).
- **9, saving only when asked: not checked.** A save is visible in the document's version history and costs only an extra version the user can delete (`docs/skill-development.md` §7.2, criteria 1 and 2).
- **10, loading for Fusion work: checked** by the trigger cases every skill has: a skill that silently stops loading is the one failure real use misses.

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; words; the rules for structure, parameters, sketches, history, finish, printed parts, checks and saving; the pointer to the API reference |
| `references/fusion-api.md` | carrying the rules out through the MCP or API scripts: reading the design, units, the API calls for each rule, the checks as code, the API pitfalls, export for printing, how to save |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why.

- **No config, no `schema`** (§4.6, §4.7). The skill keeps no structure of its own in an outside service; the Fusion document is the only data it works on.
- **No reply rules** (§4.1–§4.3). The skill covers how to model, not how to talk to the user; §4.4 applies through `SKILL.md` §8.
- **A failed script does not stop the work** (§4.5). A failing Fusion script is a normal step in modelling: re-read the design and fix the script before running it again.

## Checking a change

Beyond `docs/skill-development.md` §7: a change to `references/fusion-api.md` that names a new API call is tried once on a real Fusion design through the Fusion MCP.
