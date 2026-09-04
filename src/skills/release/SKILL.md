---
name: release
summary: prepare deployment readiness for Railway, Render, or Vercel
description: "Prepare a project to deploy to Railway, Render, or Vercel. Reads the plans, commands, package files, and existing provider configuration; creates or updates local configuration and an environment example; runs build and start checks; and reports the environment variables, the smoke-test path, and the blockers. Stops before deploying, creating a remote service, changing a remote environment, pushing, or publishing. Use when the user runs {{cmd}}, asks about deployment readiness or provider configuration, or names a provider."
---

# release - get ready to deploy, without deploying

Prepares. Does not deploy. Deploying, creating a remote service, changing remote
environment values, pushing, and publishing all need their own explicit yes, and this skill
stops before every one of them.

Run it after a completed item or a milestone, not as part of the build loop.

## Step 1 - target and shape

Take the provider from the argument: `{{cmd}} railway`, `{{cmd}} render`, `{{cmd}} vercel`.
Without one, read the deployment section of the project plan, and ask if it is not there.

Then establish what is actually being deployed, because the answer changes everything: a
static site, a server-rendered application, a service, a worker, a scheduled job, or several
of these together.

| Provider | Fits |
| --- | --- |
| **Railway** | Long-running services, workers, scheduled jobs, and anything wanting a managed database beside it |
| **Render** | Similar shapes, with static sites and cron as first-class kinds |
| **Vercel** | Front-end and edge-first applications, static output, serverless functions |

If the project's shape fits the chosen provider badly, say so once, plainly, with the
specific mismatch. Then proceed with what was asked.

## Step 2 - survey

- Build and start commands, and the output directory for static output.
- The runtime version, and whether it is pinned.
- Every environment variable the code reads, **by name**, found by searching the source
  rather than by trusting a checked-in example file which is usually stale.
- Data stores, caches, queues, and anything else it expects to exist.
- Background work: workers, scheduled jobs, migrations that must run before start.
- A health endpoint, if there is one.
- Existing provider configuration already in the repository.

## Step 3 - write local configuration

Create or update only local files: the provider's configuration file, and an environment
example listing every variable by name.

**Never put a real secret in a file.** The example lists names and describes what each is
for. A value that looks like a credential is never copied into it, and never printed.

Preserve configuration that already exists. Show a diff for anything you change, and say
why.

Migrations that must run before start belong in the release or pre-deploy step the provider
offers, not in the build. Getting that wrong deploys code against a schema that has not
moved yet, which is the failure that takes a site down rather than failing a build.

## Step 4 - check locally what can be checked

Run the build. Run the start command far enough to see it come up. Hit the health path if
there is one.

A failure here is a blocker, and finding it locally is the entire point of doing this
before deploying.

## Step 5 - report

- **Blockers** first: what would fail, and why.
- **Environment variables**, by name, marking which have no local value yet.
- **The exact next step** for that provider, as a command or a console action, so the user
  can take it themselves.
- **The smoke test**: what to hit after deploying and what should come back.
- **What was not verified** and cannot be locally: the real database, real credentials,
  cold starts, the domain.

## Rules

- Never deploy, create a remote service, change a remote environment, push, or publish.
  Preparing is the whole job.
- Never write, print, or copy a secret value.
- Never claim a deployment will work. Report what was checked and what was not.
- Provider tooling may be used to read state. Using it to change anything is a separate yes.

## Formatting

Match the conventions in `{{state}}/context/ai-interaction.md`: concise, scannable
markdown, lists for enumerations and tables for matrices rather than dense paragraphs.
