# <Project Name> - Project Overview

<!-- {{state}}:source-hash <computed> -->

> <one line on what this project is>

## Problem

What is broken today and why it matters, distilled from section 1 of the project plan.
Two or three sentences.

## Users

Who this is for, from section 2. A short list of user kinds and what each needs. Note any
access tiers, such as anonymous versus signed in.

## What it does

What this product already does, from section 3 of the plan. One line each. This is the
product's identity, not a work queue, and on an established project most of it is already
built. Mark the headline capability.

- **<capability>** - what it gives someone.

## Roadmap

What is queued, in build-plan order, with its number. This is the work list, and it is a
different thing from the section above: on an established project the two barely overlap.

1. **<item>** - what it delivers.
2. **<item>** - what it delivers.

## Domain model

The concrete shapes this project works with, derived from section 4 and the features that
use them. Real types with fields and relationships, not a restatement of the vague list in
the plan. This is usually the section a spec cannot be written without, and the one the
plan does not directly contain.

What belongs here depends on what the project is:

- **Stores data** - the persisted models: entities, fields, types, relationships.
- **Transforms input** (a compiler, a framework, a CLI, a parser) - the shapes it reads,
  the shapes it emits, and the stages between them.
- **Provides an interface** (a library, a design system) - the public types and the
  contracts they promise.

A project with no database is not a project with no domain model. Write the shapes it
actually works with, and say what kind they are.

### <Shape>

- `field` (type) - what it holds
- relates to <other shape> by <field>

Mark anything later work depends on as load-bearing, so a change to it is understood as a
breaking change rather than an edit.

## Code map

Where things live, so that work can name the files it will touch without re-deriving the
layout every time.

- `<path>` - what lives here, and when work belongs in it

For a repository with several packages, list them with the boundary each one owns, so it is
clear which one a given change belongs in.

## Tech stack

From section 5, one line each on what it is for.

- **<technology>** - its role here

## Monetization

From section 6. Omit this heading entirely when the plan has no such section.

## UI and UX

From section 7: the look and feel, and the main routes or screens. Omit this heading
entirely when the plan has no such section.

- `/<route>` - what is there

## Deployment

From section 8: host, app type, build and start commands, output directory, environment
variables by name, storage needs, background jobs, health path, domain notes. Omit this
heading entirely when the plan has no such section.

## Open questions

Contradictions and gaps found between the two plans. Each one names what it affects, so
that work touching that area can be blocked while work elsewhere continues.

- **<short title>** (affects: <areas, features, or models>) - what the two plans say that
  cannot both be true, or what is missing that later work will need. Resolve it in the
  plans, then regenerate.

Delete this heading when there are none.
