---
"create-religion": patch
---

The first-tier guard hook no longer asks about `rm -rf`.

The pattern caught the common spelling of a dangerous action and missed every other one:
`find -delete`, a one-line script, or the same effect through any other tool all passed
silently. Meanwhile it asked constantly about throwaway directories, which is most of what
`rm -rf` is used for.

A guard that catches one spelling and invisibly misses the rest is worse than no guard,
because the person relying on it cannot see the gap. Deleting data is still first tier and
still requires an explicit yes; that rule lives in the Authority prose, which applies to all
four supported tools rather than to one way of typing a command.

The enforcement reference now states plainly what these patterns match, and what they do
not, so the hooks are not mistaken for a guarantee.
