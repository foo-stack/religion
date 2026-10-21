---
"create-religion": minor
---

A build-plan line that says `after item N` (or `after items N, M and K`) waits until those are
ticked, and one that says `spike first` waits until a spike archive records `**For:** item N`
and `**Settled:** yes`. `religion status`, `feature` with no argument, and `auto` take the first
item that waits on nothing and name the ones passed over; when every remaining item waits on a
spike, `status` points at `spike`. A reference to an item the plan does not have, or items that
wait on each other, is reported as a warning. `status --json` keeps its shape.
