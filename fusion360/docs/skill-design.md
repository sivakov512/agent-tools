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
6. **Internal corners are filleted; printed parts print and fit**: a shared fit gap, local gaps where a mechanism needs them, print-bed and lead-in chamfers, hole chamfers, print orientation.
7. **Each change gets the checks it calls for**: health and interference with gaps after any change; a rebuild over key parameters when parameters, sketches or the structure changed; the whole travel when a moving part or what it moves against changed; keyed assembly when mating features changed; a check whose need is unclear is put to the user.
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
- **Checks scoped to the change.** Health and interference with gaps run after every change; the rebuild, travel and assembly checks only when the change touches what they test, so renaming a sketch does not set off a parameter sweep. Where it is unclear whether a check applies, the agent asks the user.
- **Edit history instead of adding steps.** Reordering the timeline, or deleting and recreating a feature in place, is preferred over a corrective feature at the end.
- **A shared fit gap where fits are alike, a local gap where a mechanism differs.** Fits of the same kind are tuned in one place; a hinge or a latch that needs its own gap gets its own parameter rather than bending the shared one.
- **Saving only when asked.** Every save makes a new cloud version; this is about Fusion, not one user's taste.
- **Only what the MCP does not say.** The Fusion MCP's tool descriptions and its API documentation query already explain how to run scripts and call the API, so the skill holds no call examples or signatures. `references/fusion-pitfalls.md`, read before the first script, keeps only behaviour neither of them tells and an agent gets wrong, each as the behaviour and what to do, without code.
- **Behaviour cases: none.** The user decided per behaviour, below: a broken rule shows in the model the user opens on real Fusion, so real use catches it, while a mock can only imagine Fusion's answers.
- **1, parameters and formulas: not checked.** A hardcoded or hand-computed size shows in the parameter table the user opens, and breaks on the first change of an input (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **2, naming: not checked.** Names are what the user reads in the browser, the timeline and the parameter table (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **3, components and linked parts: not checked.** Bodies in the root or a redrawn mating part show in the browser (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **4, constrained sketches: not checked.** An underconstrained sketch shows in Fusion's sketch status and moves on the next edit (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **5, editing in place: not checked.** A corrective step shows at the end of the timeline (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **6, fillets and printed-part features: not checked.** Missing fillets, chamfers or fit gaps show in the model and on the first print (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **7, checks per change: not checked.** A skipped check shows as an error, an interference or a misfit in the model the user opens (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **8, changes beyond the request: not checked.** An unrequested change lands in the user's own open document, where the timeline shows it and undo reverts it (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **9, saving only when asked: not checked.** An extra save shows in the document's version history, and the version can be deleted (`docs/skill-development.md` §7.2, criterion 1: the failure is in what the user looks at).
- **10, loading for Fusion work: checked** by the trigger cases every skill has: a skill that silently stops loading is the one failure real use misses.

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; words; the rules for structure, parameters, sketches, history, finish, printed parts, checks and saving; the pointer to the API reference |
| `references/fusion-pitfalls.md` | Fusion behaviour the MCP and the API documentation do not tell: values and units, sketches, features and history, placement, scripts and checks |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why.

- **No config, no `schema`** (§4.6, §4.7). The skill keeps no structure of its own in an outside service; the Fusion document is the only data it works on.
- **No reply rules** (§4.1–§4.3). The skill covers how to model, not how to talk to the user; §4.4 applies through `SKILL.md` §8.
- **A failed script does not stop the work** (§4.5). A failing Fusion script is a normal step in modelling: re-read the design and fix the script before running it again.

## Checking a change

Beyond `docs/skill-development.md` §7: a behaviour added to `references/fusion-pitfalls.md` is one seen on a real Fusion design, and is checked once there; anything the MCP's descriptions or the API documentation already say is left out.
