# Inbox

> **Generated file.** Notes taken with `capture` while something else was being built.
> One line each, newest last. Not a plan, not a ledger, and not loaded into every session.

`fix` and `feature` read this when choosing what to build next and offer what is
here alongside the build plan. Choosing a note specs it and removes the line. Deleting one
yourself is the other way out, and needs no ceremony.

- 2026-09-05 - `parseWork.nextStep` truncates a step title at the first " - ", which is the separator the spec template uses inside the bold title, so "Step 5 - cover the parsers" becomes "Step 5". Latent: the field is parsed and never read. Either fix the regex or drop the field. (`packages/create-religion/lib/state.ts`)
