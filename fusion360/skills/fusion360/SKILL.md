---
name: fusion360
description: Rules and style for building and editing parametric models in Autodesk Fusion 360 (Fusion), through its MCP server or Fusion API scripts - every dimension a named user parameter, derived sizes as formulas, a component per part, fully constrained named sketches, a history that reads top to bottom, printable parts, and checks after every change. Use whenever the work is on a Fusion design - modelling, changing or fixing a part, case, box, lid, bracket, mount or holder; adding or renaming user parameters, components, sketches or features; checking fit, gaps or interference between parts; preparing a part for 3D printing; or exporting it for printing. Trigger even without the word Fusion when the conversation is about a Fusion model, for example "make the walls of this part 0.5 mm thicker", "the lid is too tight", "add a slot for the strap".
---

# Fusion 360

Build and edit the model so that someone opening it later understands from its parameters, components and history how each part is made, and changing one dimension moves everything that depends on it. A model that only looks right — numbers worked out by hand, "Sketch1", a corrective cut on top — breaks on the first change. Names in the model are English.

Before the first script in a session, read `references/fusion-api.md`: the API calls that carry out these rules, the checks as code, the API's pitfalls and export.

**Words.** A *part* is one piece the model makes (a box, a lid, a bracket). A *mating part* is something the model is built around but does not make: a part from outside the design, such as another document or a supplier's model. An *element* is a reusable feature group that may appear in several parts (a mount, a hinge, a snap hook). A *step* is one entry of the timeline (a sketch or a feature). The *datum* is the one origin every position is measured from.

## 1. Structure

- **Each part is its own component**, its sketches and features inside that component, never in the root — so a part can be moved, hidden, exported and changed on its own.
- **Parts from outside the design are inserted by link and placed**, not redrawn, and the model is built around them, so a change to one shows up as an interference instead of a silent misfit.
- **No needless sketches.** A sketch exists because a feature uses it.

## 2. Parameters

- **Every dimension is a user parameter**, so every size can be found and changed in one table. No literal dimension inside a feature or a sketch dimension; constants inside a formula (`2 *`, `/ 2`) are fine.
- **Anything derived is a formula, never a number worked out by hand**: an outer width is the inner width plus twice the wall thickness, written as that expression, not as its result. A hand-computed number is right only until one of its inputs changes.
- **Prefix by scope**, with a double underscore between scope and name: `common__` for what several parts share; `<part>__` for one part, the part's component name in lower snake case; `<element>__` for a reusable element, kept even when several parts use it. The prefix says where a parameter is used before its name is read.
- **Whole words from one vocabulary**: width (X), depth (Y), height (Z), thickness, dia, radius, gap, pitch, count; positions end in `_x`, `_y`, `_z` and are measured from the datum. `dia` is the one accepted abbreviation; no others, since the next reader has to guess them.
- **A short comment on each parameter**: what it is and, for a chosen value, why that value.
- **One concept, one parameter, reused everywhere.** No duplicates and no unused parameters: a duplicate drifts from its twin on the first edit.

## 3. Sketches

- **Short meaningful names**, one to three words; never Fusion's defaults.
- **Fully constrained by the constraints it needs, and no redundant ones.** Geometry held only "as drawn" moves when anything near it changes. Trust `isFullyConstrained`, not the picture.
- **Sketch dimensions reference parameters** (§2).

## 4. History

- **A change edits the step that made the thing**: a wrong size in its parameter, a wrong shape in its sketch, a wrong feature in place. A corrective step on top (a cut to fix an extrude, an offset to fix a sketch) hides the intent and doubles the work of the next change. When a step must move, reorder the timeline.
- **Features are named by what they make**, never the same as their sketch.

## 5. Finish

- **Small fillets on internal corners**: a sharp inside corner concentrates stress. Not on edges that sit on the bed (those get chamfers, §6), and not where a mating part with square corners must fit.

## 6. Printed parts

For parts that will be printed on an FDM printer:

- **A shared fit-gap parameter** for fits of the same kind, so they are tuned for a printer in one place; **a local gap parameter** where a mechanism needs a different one.
- **Chamfers on edges that lie on the bed** against elephant foot, and **lead-in chamfers** where parts slide or press together.
- **Chamfers on outer hole edges**, so screws and pins find the hole.
- **Print orientation** decided for each part: which face lies on the bed, overhangs past about 45°, bridges, walls thick enough to print.

## 7. Checks after every change

A change is done when these pass:

1. **Health**: no feature in the timeline has an error or warning.
2. **Rebuild**: change a few parameters that drive the overall shape, within values that make sense for the part, then restore them; the model rebuilds without errors and returns exactly to where it was. A break is reported, not redesigned.
3. **Interference and gaps**: no part interferes with another or with a mating part; the gaps that matter are measured, not assumed.
4. **Moving parts over their whole travel**: a lid, a latch, a slider, a button is checked for fit, engagement and removal at several positions along its path, not only where it was drawn.
5. **Assembly**: parts cannot be put together the wrong way round; if they can, add a key.

## 8. Changes beyond the request

- **Propose them, do not make them**: restructuring or renaming parts of an existing design, deleting or renaming parameters, adding a key, moving or reorienting parts. The design is the user's; a change they did not ask for is one they have to find and undo.
- **Restore what a check moves.** A travel check or a parameter sweep leaves the parts and parameters as they were.

## 9. Saving

Do not save the document unless the user asks: every save creates a new version in the cloud.
