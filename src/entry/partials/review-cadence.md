`workflow.stepReview` decides how often implementation stops for you. It ships as
`every`: each step ends with a diff to read and approve before the next one starts. Set
it to `item` to collect the steps into one review packet at the end.

Either way, implementation stops early and asks whenever a check fails, a decision is
needed, a conflict appears, the work drifts outside its spec, or something in the first
tier of the authority rules comes up.

`workflow.parallelSteps` ships `false`. Turned on, steps a spec marks as independent are
built together in one wave and reviewed as one packet, so nothing lands unreviewed either
way. While it is off, those markers are ignored and every spec builds in order.
