Build one feature, fix, or rollback at a time, behind review gates.

The loop is:

    {{cmd:feature}} -> review the spec -> {{cmd:implement}} -> {{cmd:check}} -> {{cmd:audit}} -> {{cmd:complete}}

Each step's instructions are plain markdown skills any capable agent can read and follow.
The spec is written before code exists, so it can be reviewed before a line is built.
Implementation lands one small step at a time, each with a diff to read and evidence that
its stated outcome was met.

`{{state}}/context/current-work.md` holds exactly one work item. Finish it, archive it,
then start the next. Progress lives in checkboxes inside that file, so a cleared context
costs nothing: a fresh session reads which steps are ticked and resumes from the first
one that is not.
