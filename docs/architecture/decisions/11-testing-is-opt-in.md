# Testing is opt-in, and one signal turns it on

A test command declared in the entry file's Commands section makes tests a gate for
logic-bearing work. Without one, the loop verifies logic with the evidence it already has.

**Why not always require tests.** Because the alternative is installing a test runner in the
middle of unrelated work, which is a decision the project should make deliberately. A
workflow that silently adds a dependency to satisfy its own rule has overstepped.

**Why a declared command rather than detecting a runner.** A dependency in the manifest
proves nothing about whether the project runs it. A command someone wrote down is a
statement of intent.

**What is in scope when the gate is on.** Logic where a wrong answer is possible: parsers,
formatters, validators, server actions. Interface and integration surfaces are verified with
a screenshot and the build, because unit tests over them are brittle and prove little.

**What would change this.** Nothing foreseeable. The gate is already strict once enabled.

**Reversed:** no.
