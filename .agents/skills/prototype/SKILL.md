---
name: prototype
summary: explore the look before building, as throwaway mockups or real components
description: "Explore how a project should look before the build loop starts. Asks what feel is wanted and which screens to draft, proposes a plan, then writes static mockups sharing one theme file to prototypes/. When the project already uses a component system, offers to prototype in that system instead, so the result is real components rather than something to port. Sits outside the reviewed loop, like scaffolding. Use when the user runs $prototype, names screens to mock up, or asks to explore the layout, theme, or look and feel."
---

# prototype - lock the look before building it

Exploratory work, deliberately outside the spec loop. Deciding how something should look is
not a reviewable build step, and forcing it through one wastes both.

## Step 1 - decide which kind

Look at the project. If it already has a component system with tokens and primitives, offer
to prototype **in that system**. Otherwise write **static mockups**.

| | Static mockups | In the component system |
| --- | --- | --- |
| Output | HTML and CSS in `prototypes/` | Real components in the project |
| Fidelity | Approximate | Exactly what ships |
| Afterwards | Tokens ported, folder deleted | Nothing to port, nothing to delete |
| Good for | Deciding a look from nothing | A project whose look is already decided |

Static mockups are the default because they are faster to throw away, and throwing away is
what usually happens to the first three attempts. Prototyping in the real system is better
once the direction is settled, because the port step is where the approximation creeps back
in.

Say which you propose and why. The user decides.

## Step 2 - ask what is wanted

Do not start drawing. Ask:

- **The feel**, in adjectives, plus anything to look at: a site, a screenshot, a product
  whose look is close.
- **Which screens**, and which one matters most. Draft that one first and get it right
  before the others copy its decisions.
- **Constraints**: dark, light, or both; density; an existing brand.

Propose a short plan and get agreement before writing files.

## Step 3 - static mockups

Write to `prototypes/`, one file per screen, all sharing `prototypes/theme.css`.

**Every colour, size, and spacing value lives in `theme.css` as a variable.** No exceptions.
That file is the actual output of this work: the mockups are disposable, the token set is
the decision, and a value hardcoded in one screen is a decision that will not survive.

Use realistic content. Placeholder text hides every layout problem worth finding: real
labels are longer than expected, real lists are emptier, real names break alignment.

Draft the primary screen, show it, iterate until it is right, then do the others.

## Step 4 - prototyping in the component system

Build the screens with the project's own primitives and tokens, in the project.

Add tokens where the design needs values that do not exist yet, in the token layer, never
inline in a component. If the design fights the system repeatedly, that is a finding worth
reporting: either the design or the system is wrong, and knowing which is worth more than
the mockup.

These are not throwaway. Say what should be kept, what was a sketch, and what a later work
item should build on.

## Step 5 - hand off

Say which mockups exist and where the tokens live.

For static mockups, note that the first build step of the first visual work item ports
`theme.css` into the project's real stylesheet, and that the folder is deleted once that
lands. For component prototypes, note there is nothing to port.

Then point at $feature. Prototypes inform the plan; they are not a work item.

## Rules

- Ask before drawing. A mockup built from a guess wastes the round trip that would have
  prevented it.
- Every value is a token.
- Real content, never placeholder text.
- Static mockups are throwaway and are deleted once consumed. Component prototypes are not.
- No product logic, no data layer, no routing. This is the look.

## Formatting

Match the conventions in `religion/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
