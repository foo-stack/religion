# Releasing

`create-religion` is published by GitHub Actions and by nothing else. There is no npm token,
in CI or on any developer machine, because the registry authenticates the workflow itself.

## The shape

```
feature branch
     |  pull request, carrying a changeset
     v
   main  ------------------------> release.yml opens "chore: version packages"
     ^                                          |
     |  merge the version pull request          |
     +------------------------------------------+
     |
     v
release.yml runs again, finds no changesets left, publishes to npm
```

Two pull requests, then. The first is the change. The second is the release, and merging it
is the act that publishes. Nothing is released as a side effect of landing a change.

## A changeset per pull request

A changeset is a file in `.changeset/` naming a bump and a summary. Contributors add one with
`npm run changeset` in the same pull request as the change, which puts the decision about
what a change means for the version next to the change itself, while the reasoning is still
fresh. A pull request that alters no published behaviour needs no changeset.

Pending changesets are visible: anything left in `.changeset/` is a change that has not
shipped.

## Versioning is a pull request, not a command

When changesets are pending on `main`, the release workflow does not publish. It opens a pull
request that applies them: versions bumped, `CHANGELOG.md` written, the consumed changeset
files deleted. That pull request is the release proposal, and it is reviewable like any other.

When no changesets are pending, which is the state immediately after that pull request merges,
the same workflow publishes instead. One workflow, two behaviours, decided by what is in
`.changeset/`.

## Publishing has no token

npm trusted publishing exchanges a GitHub OIDC token for short-lived publish rights. The
registry is configured to trust exactly one identity: the `release.yml` workflow in
`foo-stack/religion`. A leaked secret cannot publish because there is no secret, and a
workflow with a different filename cannot publish either.

Three consequences worth knowing:

- **`release.yml` may not be renamed** without updating the trusted publisher registration
  first. Renaming it revokes publishing.
- **`repository.url` in the package manifest must match the repository exactly.** npm checks
  it when attaching provenance.
- **`npm publish` from a laptop will fail**, which is the intended behaviour rather than a
  problem to route around.

## Pins that are load-bearing

Most action versions in these workflows are ordinary hygiene. These three are not.

| Pin | Why it cannot drift downward |
| --- | --- |
| `actions/setup-node@v7` | Earlier versions paired `registry-url` with a dummy `NODE_AUTH_TOKEN` export, leaving an empty `_authToken` in `.npmrc`. npm read that as "already authenticated", skipped the OIDC exchange, and failed the publish after the version pull request had already merged. v7 removed the export. |
| `npm@^12.0.0`, well above the 11.5.1 floor | Trusted publishing does not exist below 11.5.1, and whatever npm a Node image happens to bundle is incidental. The major is pinned rather than tracking `latest` so that a future npm release cannot change publishing behaviour underneath a release that is already in flight. |
| `changesets/action@v2` with `@changesets/cli` 3 | v2 is the release line that matches cli 3, and its inputs were renamed from v1. v1 names are silently ignored rather than rejected, so a stale example produces a workflow that runs and does nothing. |

Changesets 3.0.0 also removed the preflight auth check that `changeset publish` used to run.
That check assumed a token existed and is the reason older changesets could not publish over
OIDC at all.

## One-time setup

These live outside the repository and cannot be committed.

1. **npm**, package settings, Trusted publisher: organization `foo-stack`, repository
   `religion`, workflow `release.yml`, environment blank.
2. **GitHub**, Settings, Actions, General, Workflow permissions: allow GitHub Actions to
   create and approve pull requests. Without it the workflow cannot open the version pull
   request.
3. **GitHub**, a ruleset on `main`: require a pull request, and require the `verify` check.

## When the version pull request cannot merge

A pull request opened with the default `GITHUB_TOKEN` does not trigger other workflows. The
version pull request therefore arrives with no CI run, and a branch rule that requires the
`verify` check will hold it there forever.

Either add a fine-grained personal access token as `RELEASE_TOKEN`, scoped to this repository
with contents and pull-requests write, or merge that one pull request past the check as an
administrator. The workflow reads
`${{ secrets.RELEASE_TOKEN || github.token }}`, so it works with no secret present and starts
using one the moment it exists.
