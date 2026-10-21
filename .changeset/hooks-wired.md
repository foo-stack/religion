---
"create-religion": minor
---

`religion doctor` gains a `hooks` check where Claude Code is installed: it confirms that
`.claude/settings.json` registers each hook this version ships, under the right event, and
that each hook's file exists, and names any that are missing with how to add them. Matchers
you have tuned still count, and a settings file that is a link is not read. Since `update`
never rewrites the settings, this is how a hook added by a later version gets noticed.
