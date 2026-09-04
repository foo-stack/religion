<!-- {{state}}:setup-required -->

Fill this in with the project's real commands. `{{cmd:setup}}` detects them and proposes
the list; until it runs, treat this section as unverified.

- Dev server: `<command>`
- Build: `<command>`
- Test: `<command>`

Testing is opt-in. A declared test command is what turns testing into a gate for
logic-bearing work. If this project has no test runner, `{{cmd:tests}}` adds one and
updates this section.
