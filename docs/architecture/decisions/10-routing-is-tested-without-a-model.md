# Routing is tested structurally, without calling a model

The routing suite checks that every skill has cases including negative ones, that every case
names a real skill, that no two skills claim the same case, and that no two descriptions
share too much distinctive vocabulary.

**Why not evaluate real selections with a model.** Because the result would vary run to run,
cost money on every commit, and fail for reasons unrelated to the change under test. A
routing suite that is flaky is a routing suite people stop reading.

**What the overlap score actually measures.** Whether two skills could be told apart at all,
not whether they were. A pair above the limit cannot route reliably whatever model is
choosing; a pair below it might still route badly for other reasons.

**What this does not catch.** A description that is discriminative but wrong. Only a real
selection would find that.

**What would change this.** A cheap, deterministic way to score a real selection.

**Reversed:** no.
