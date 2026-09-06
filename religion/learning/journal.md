# Journal

> **Generated file.** Raw observations appended as work happens: what went wrong, what was
> surprising, what a correction revealed. Not loaded into context. `distill` reads
> it, promotes what has proved stable into `lessons.md`, and archives what it processed.

## 2026-09-05 - carried over from the build

Written down when this project stopped keeping a separate progress file. These are the
observations from building Religion that were worth more than the record they sat in.

**Silent wrong results come from paths nobody exercised, not from code nobody read.** Five
bugs were found by running things end to end rather than by reading them, and the two worst
produced no error at all: the update manifest recorded on-disk hashes rather than what was
installed, so conflict protection worked exactly once and then overwrote the edit it had
preserved; and the renderer's directory walk skipped every dot-entry, so `.state/` and its
settings template rendered without error and were absent from every install. The other three
were a hook that stripped real blank lines along with conditional ones, state files being
re-rendered over a project's real work, and a plan parser that counted the template's own
worked examples as plan items.

**The npm registry lags a publish, and the gap looks exactly like failure.** A publish
reported success and the version became readable about 76 seconds later, once over five
minutes. Reading inside that window returns the previous version. This produced a confident
and entirely wrong diagnosis, built on a single stale read, that only collapsed when the
staging list disproved it. Re-read with cache busting before concluding anything about a
publish.

**A green check is not evidence that the check ran.** A verification step once reported
"typecheck clean" while typechecking a file that had never been written, because the heredoc
that should have created it had failed. Every check added since has been deliberately broken
to confirm it fails, and that habit has caught two checks that could not fail.

**Version pull requests arrive with no checks.** A pull request opened with the default token
does not trigger workflows, so the required check never appears and merging needs an admin
bypass. This is settled and accepted here, not a problem to solve.

**Documentation drifts from the thing it documents, quietly.** The enforcement reference
described four hooks when there were three, advertising a mechanism that had no file and was
wired nowhere. Two configuration settings shipped undocumented. Both classes now have a
verification check, and both were found by hand first.
