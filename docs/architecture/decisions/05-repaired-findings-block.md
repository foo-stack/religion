# A repaired finding still blocks completion until it is reviewed again

Findings carry a status. A high-severity finding blocks completion while it is `open`, and
it keeps blocking after it is marked `fixed`. Only a later review moves it to `closed`.

**Why a fix is not enough.** The repair was written by the same session that misunderstood
the code well enough to introduce the defect. A fix can be wrong, incomplete, or worse than
the original, and nothing has looked at it yet. `fixed` means the code changed; `closed`
means someone checked.

**Why not just trust the repair for low-severity findings.** That is exactly what happens.
Only the two highest severities block; the rest are reported and carried.

**The escape hatches, and why they are recorded.** A finding can be accepted, which is the
user's explicit decision with a stated reason, or ruled invalid, which needs re-examination
evidence. Both travel into the archive. Neither is a silent drop.

**What would change this.** Nothing foreseeable. This is the rule that most often feels
obstructive and most often turns out to be right.

**Reversed:** no.
