# Generated local state

Machine-written files that are never committed:

- `manifest.json` - the installed version and the hashes of managed files, so an update can
  tell a local edit from a stale copy instead of overwriting either.
- `run.json` - what the workflow is doing right now, for the status view and the dashboard.

Nothing here is a record of the work. Deleting it costs the update path its conflict
detection and the dashboard its activity view, and costs the project nothing.
