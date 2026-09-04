# create-religion

## 0.2.0

### Minor Changes

- fec5e77: Add the `refactor` skill: simplify code that already exists, one behaviour-preserving
  campaign at a time.
  
  Point it at a single file, a folder, one package, or a monorepo root. It surveys five lenses
  (bloat, structure, over-implementation, duplication, and reinvention of what the language,
  the standard library, or an installed dependency already provides), reports where the density
  is, then specs one lens in one area for `implement` to build.
  
  It refuses to start when no test reaches the target. A change meant to preserve behaviour
  needs something able to notice when it does not, and a green suite that never imports the
  target is not that.

## 0.1.1

### Patch Changes

- c9e7b11: Document the invocation that actually works. The readme and `--help` both showed
  `religion <command>`, which exists only after a global install, so anyone following
  `npx create-religion@latest` found the command missing.
