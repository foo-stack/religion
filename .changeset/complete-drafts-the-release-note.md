---
"create-religion": minor
---

In a project that uses Changesets, `complete` now drafts the finished item's changeset: the
packages it touched, a proposed bump, and a summary written for the changelog's readers. It asks
before writing when someone is there, and in an automated run writes the proposal and names it in
the pull request for the reviewer to approve or change. An item that already has a changeset keeps
it.
