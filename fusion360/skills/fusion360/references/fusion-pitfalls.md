# Fusion pitfalls

How Fusion behaves where neither the MCP's tool descriptions nor the API documentation say so, and where an agent goes wrong. Each item is the behaviour and what to do about it.

## 1. Values

- **A bare number is read as centimetres**, the API's internal unit. Give values, parameter expressions and dimension expressions as strings with units; only sketch coordinates are plain numbers, in centimetres, and a dimension driven by a parameter then sizes the geometry.

## 2. Sketches

- **Rectangles come without constraints.** The two-point and centre-point rectangle calls added no horizontal or vertical constraints in practice: add them, then dimension the rectangle.
- **A sketch on a face projects the face's edges into it.** Remove the projected curves, create the sketch without edges where the API allows it, or pick profiles by their loops.
- **Projected curves split the sketch into several profiles.** Pick the profile by its bounding box or area, never by its index.
- **A redundant constraint or dimension fails when added.** Read the error and drop the constraint; do not force it.

## 3. Features and history

- **A feature named like an existing sketch gets a " (1)" suffix** (observed). Name features by what they make, which avoids the clash.
- **A feature's profile often cannot be swapped in place.** Roll the timeline to just before the feature, delete it and recreate it there with the same name, then move the marker back to the end.
- **The offset-faces input takes a Python list of faces**, not an object collection.

## 4. Components and placement

- **A linked insert needs the file in the same project as the design.** Ask the user to move or copy it there.
- **Inserting into a design that was never saved may fail.** Ask the user to save it; do not save it yourself (`SKILL.md` §9).
- **An occurrence grounded to its parent does not move.** Clear the grounding before moving it.
- **A moved occurrence reverts on the next compute in a parametric design.** Moving it leaves a pending transform; to keep the placement, capture a snapshot while one is pending. A move made only for a check is undone instead (`SKILL.md` §8).

## 5. Scripts and checks

- **A failed script run through the MCP rolled back as a whole in practice**, parameters included; a script run by hand may leave partial changes. Either way, re-read the design and fix the script before running it again.
- **Suppressed and rolled-back timeline items are not failures**; only an error or a warning is (`SKILL.md` §7).
