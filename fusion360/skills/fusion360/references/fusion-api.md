# Fusion API

How to carry out the rules in `SKILL.md` in Autodesk Fusion 360, through the Fusion MCP server (a script tool, a read tool with API documentation and screenshots, undo / redo) or Fusion API scripts run by hand. The calls below are the usual ones; look a class up in the API documentation (the read tool's `apiDocumentation` query) before using one you have not used in this session, since signatures change between Fusion releases.

## 1. Before the first change

Read the design with a read-only script and keep what it shows in mind:

- the components and their occurrences, which one is active, which are linked (`occurrence.isReferencedComponent`);
- every user parameter with its expression, unit and comment (`design.userParameters`);
- the timeline: each item's name, type, health (`healthState`, `errorOrWarningMessage`) and the marker position;
- each body's volume (`body.physicalProperties.volume`, in cm³), to see what a change did.

A design started by someone else may break the rules: say what you found, and bring only the parts the request touches in line (`SKILL.md` §8).

Scripts through the MCP define `run(_context)` and never catch exceptions, so a failure comes back with its message. Mark an inspecting script `readOnly`. The API works in centimetres internally: give every value as an expression string with its unit (`'2 mm'`, `'lid__height'`), never a bare float, which Fusion reads as centimetres.

## 2. Parameters

- Create: `design.userParameters.add(name, adsk.core.ValueInput.createByString(expression), 'mm', comment)`. A derived parameter's expression names its inputs: `'common__inner_width + 2 * common__wall_thickness'`. Create inputs before the parameters that use them.
- Change: set `param.expression` on the existing parameter (`design.userParameters.itemByName(name)`), never add a second one.
- Use in a feature: pass `ValueInput.createByString('lid__height')`. Use in a sketch dimension: create the dimension, then set `dimension.parameter.expression = 'lid__width'`.
- Unused: a user parameter with no `dependentParameters` drives nothing; delete it (`deleteMe()`) or use it.

## 3. Components and mating parts

- New part: `occ = design.rootComponent.occurrences.addNewComponent(adsk.core.Matrix3D.create())`, then `occ.component.name = 'Lid'`. Build its sketches and features through `occ.component` (`component.sketches`, `component.features`), never `rootComponent`.
- Mating part: find the file (the read tool's document search gives its id; `app.data.findFileById(id)`), insert it by link with `occurrences.addByInsert(dataFile, transform, True)`, and place it with `occurrence.transform2` or a joint. Build the parts around it.

## 4. Sketches

- Create on a construction plane or face of the part's own component and name it at once: `sketch = component.sketches.add(component.xYConstructionPlane); sketch.name = 'Lid outline'`.
- Constrain: `sketch.geometricConstraints` (`addHorizontal`, `addVertical`, `addCoincident`, `addMidPoint`, `addSymmetry`, `addConcentric`, `addEqual`) ties geometry together and to the origin or projected references; `sketch.sketchDimensions` (`addDistanceDimension`, `addDiameterDimension`, `addRadialDimension`) sizes it, each dimension then driven by a parameter (§2).
- Verify: `sketch.isFullyConstrained` is true before the sketch is used. If it is not, find the free entities (`isFullyConstrained` on each curve and point) and constrain them; a redundant constraint fails when added, so read that error rather than forcing it.

## 5. Features and history

- Create through the part's component, with every distance a parameter expression, and name the feature at once by what it makes: `extrude.name = 'Lid shell'`.
- Edit in place: change the parameter or sketch that made the thing. To change a feature's inputs, roll the timeline to just before it (`feature.timelineObject.rollTo(True)`), change it, and move the marker back to the end (`design.timeline.moveToEnd()`). To move a step, `timelineObject.reorder(beforeIndex)` after checking `canReorder(beforeIndex)`. When a feature's inputs cannot be changed, delete it and recreate it at the same place in the timeline, rolled there, with the same name.

## 6. Checks

Run them in a read-only script after each change (`SKILL.md` §7):

- **Health**: every timeline item `healthState == HealthyFeatureHealthState`; print the name and message of any other.
- **Interference**: `inp = design.createInterferenceInput(occurrences)`, `results = design.analyzeInterference(inp)`; each result's `interferenceBody` volume and its two entities say what touches. Run it with the mating parts included.
- **Clearance**: `app.measureManager.measureMinimumDistance(a, b).value` between the faces or bodies that matter (centimetres; convert before reporting).
- **Rebuild**: set several key parameters to the ends of their sensible range, check health and interference at each, then restore the original expressions and confirm the volumes match the originals.
- **Travel**: drive a moving part through its path — a joint's `jointMotion` value, or the occurrence's `transform2` — at several positions (start, middle, engaged, removed) and check interference and clearance at each.

## 7. Pitfalls

- `addTwoPointRectangle` adds no constraints: add the horizontal and vertical constraints yourself, then dimension it.
- A sketch on a face projects the face's edges into it. Remove them, use `sketches.addWithoutEdges` where it exists, or choose profiles by their loops rather than by index.
- Projected geometry splits sketch regions into several profiles: pick the profile by its bounding box or area (`profile.boundingBox`, `profile.areaProperties()`), never `profiles.item(0)`.
- A feature given the same name as an existing sketch gets a " (1)" suffix: name features by what they make (`SKILL.md` §4), which also avoids this.
- A script that fails rolls back as a whole, parameters included: nothing it created exists. Re-read the design before retrying.
- An occurrence with `isGroundToParent` set does not move: clear it before setting `transform2`.
- `OffsetFacesFeatures.createInput` wants a Python list of faces, not an `ObjectCollection`.
- A design with a linked component exported as a Fusion archive (.f3d) cannot be opened offline, and the API cannot write .f3z: export a copy without the linked part, or STEP for exchange.

## 8. Rendering and export

- Screenshots for your own checks come from the read tool's `screenshot` with a `direction`.
- Rendering: set the resolution again before each render, as it does not persist between renders; setting a solid background colour also switches the background type to solid colour; lighting comes from above, so for a bottom view flip the model rather than the camera.
- Printing: export each part on its own as STL or 3MF, in its print orientation (`design.exportManager.createSTLExportOptions(occurrence, path)`, then `exportManager.execute(options)`); STEP (`createSTEPExportOptions`) for exchange.

## 9. Saving

Save with the MCP's document `save` or `document.save`, only when asked (`SKILL.md` §9). Closing a document with unsaved changes needs a choice between saving and discarding.
