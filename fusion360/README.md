# fusion360

Makes an agent build and edit parametric models in Autodesk Fusion 360 the way a careful person would, so the model stays yours to change. Every size is a named parameter and every derived size a formula, each part is its own component built around the parts it mates with, sketches are fully constrained and named, the history reads top to bottom, and printed parts carry the fit gaps, chamfers and fillets an FDM printer needs. After every change the agent checks feature health, rebuilds over a range of key sizes, measures interference and gaps, and moves moving parts through their travel.

The plugin and the skill inside it are both called `fusion360`.

## Needs

Autodesk Fusion 360 with its MCP server connected: the agent runs Fusion API scripts through it. Without the MCP server the skill still writes the scripts, for you to run in Fusion's Scripts and Add-Ins.

## Install

From the root README's Install. Nothing to set up on top: the skill keeps no data of its own.

## Use

Talk to it about the part in plain words:

- "Model a box with a press-fit lid around this part."
- "Add four screw bosses in the corners of the base."
- "The lid is too tight — loosen the fit."
- "Make the walls 0.4 mm thicker."
- "Check that the button still clears the case over its whole travel."

The parameters come out named by scope — `common__` for what several parts share, `<part>__` for one part, `<element>__` for a reusable element such as a mount or a hinge — in whole words, each with a comment.

The agent saves the document only when you ask: every save is a new cloud version.

## Limits

- It does not choose materials, print settings or tolerances for a specific printer; the fit gap is one parameter for you to tune.
- Fusion's API changes between releases: the skill looks classes up in the API documentation before using them, but a call it has not used before may still need a retry.
