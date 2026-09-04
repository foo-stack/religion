# Changesets

A changeset is a note describing a change and how it should move the version. Files here are
consumed and deleted by the release workflow, so anything left in this directory is a change
that has not shipped yet.

Add one in the same pull request as the change it describes:

    npm run changeset

Pick the bump and write the summary as a line in the changelog, because that is what it
becomes. Describe the change from the point of view of someone installing the package.

A pull request that changes no published behaviour - documentation, workflow files, internal
tooling - needs no changeset.

## What happens next

Merging to `main` makes the release workflow open a `chore: version packages` pull request
that applies every pending changeset: versions bumped, changelog written, these files
deleted. Merging that pull request publishes to npm.

Nothing publishes from a developer machine. The registry only accepts releases from the
`release.yml` workflow, authenticated by its identity rather than by a token.
