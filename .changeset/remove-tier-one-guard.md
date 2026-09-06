---
"create-religion": minor
---

The shell-command guard hook is removed.

It asked before a push, merge, publish, deploy or recursive delete, and it matched how those
commands are usually written rather than what they do. `bash deploy.sh` pushed and passed
silently; so did a one-line script that deleted a tree. Meanwhile it asked about throwaway
directories several times an hour.

Adding patterns does not fix that. The next spelling is one substitution away, and a pattern
broad enough to catch every script would ask about every script. A guard that catches the
common spelling of a dangerous action and silently misses the rest is worse than no guard,
because the gap is invisible to whoever is relying on the prompt.

**Nothing about the Authority rules changed.** Merging, pushing, deploying, publishing,
deleting data and rewriting history are still first tier and still need an explicit yes every
time. That rule is carried by the prose loaded every session, which applies to all four
supported tools rather than to one way of typing a command.

Three hooks remain, all cases where a pattern can describe the thing being protected: a write
into a rendered tree, content being read, and the end of a turn.
