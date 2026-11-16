# Report: sweep (test hardening) · OpenCode · tests only

Branch `feat/sweep`, worktree `~/code/activask-twin-wt/sweep`. Files touched: `tests/sweep.test.mjs` (new) and
this report. Nothing under `src/` was edited; no browser/shots run (pure logic task).

## What I built

- `tests/sweep.test.mjs`: property sweep over the merged logic — every scene (56) × every instruction in its pool
  (6 each) × every policy (7) × seeds 1, 2 = **4704 trials** through `L.runTrial(sc, ins, target, policy.id, { seed })`
  with `sc = L.layoutScene(scene, seed)` and `target = ins.matches[seed % ins.matches.length]`, plus a **slip-free
  rerun of every trial** (`{ seed, slip: 0 }`) → 9408 `runTrial` calls in total.
- Ten rules, ONE `check(...)` each; failures are collected per rule and the message shows the count and the first 5
  cases (scene, policy, seed, instruction, round). Rules 1–8 run at `runTrial` defaults (slip 0.05, eps 0, K 4);
  rule 9 inspects the slip-free rerun; rule 10 times the whole double pass with `performance.now()`.
- Rule 8 re-derives the candidates with `L.initialCandidates(sc, ins, seed >>> 0)` (deterministic, same inputs as
  `runTrial` uses) to map the resolved candidate id to its object.

## Test and perturbation counts

- `npm test`: **103 passed, 0 failed** (6 test files); my 10 sweep checks all PASS on the current merged src.
- `npm run perturb`: **all 17 perturbations CAUGHT**, including my two:
  - *wording validator ignores digits* → **R6** fails (536 selected texts like `"Is it c1?"`: slip leaks that the
    weakened validator now accepts). First case: `off-cups-01 firstQ s2 "pick up the orange cup" r0 -> "Is it c1?"`.
  - *red colour question leaks a digit* → **R5** (70 bad), **R6** (70 bad), **R9** (96 bad). Example:
    `off-cups-02 firstQ s1 "hand me the cup" r3` — the pair left in S is a red and a white cup; every 1|1 partition
    of two candidates collapses to one proposal by partition signature, and the smallest key wins (`color=red`),
    whose text is now `"Is it the red one? 2"` (wording false). With no valid alternative in the built set,
    `selectProp` falls back to the raw list and selects the invalid proposal → R5; the text leaks a digit → R6;
    the slip-free rerun offers the invalid proposal → R9.
- Time (rule 10): the 4704 + 4704-trial sweep finishes in **≈ 160 ms** (162 ms on the recorded run), far under 15 s.

## Failing cases in src

- **None.** All ten rules pass on the current merged logic; there is nothing to hand to the lead.
- R7 (no question text twice in one trial) was my main suspicion — different x/y keys produce the same side text
  ("Is it on the left side?"). Verified empirically: across all clarifying trials no round ever *selects* a second
  axis question (attribute partitions win the proposal-order tie-break after the signature dedupe), so no repeat
  occurs. The check is in place and would catch such a repeat if selection behaviour changed.

## Assumptions

1. **`Round.sel` is the selected proposal object**, not an index: the task text writes `round.props[round.sel]`, but
   the src stores the proposal itself (`rounds.push({ S, props, sel, answer })`). My `selOf()` accepts both shapes
   (object or numeric index). Worth a line in SPEC §2's Round contract.
2. Rule 4 read as: the stored state of round 0 equals `S0`, each later stored state is a strict subset of the previous
   one, and every round's `updateState` strictly shrinks the set (checked with `L.updateState` on the stored state,
   selected proposal and answer).
3. Rule 6's independent wording test: no digit; no id-like token `\b[co]\d+\b` (c3, o4); none of the words
   score/box/iou/threshold/candidate/id as word-bounded, case-insensitive, plural-tolerant tokens. "lid" does not
   trip the id rule (word boundary). This is deliberately independent of `clWordingOk`.
4. Rules 1–8 run with the default slip 0.05 (exercises the repair/fallback paths); rule 9 proves the slip-free path
   never emits an invalid or empty-branch proposal.
5. The sweep is O(9408 trials) and deterministic per seed; the perturb mode re-runs it twice more without issue.

## Observations for the lead (no failures, just sweep data)

- Over the 4704 default trials: mean |S0| **2.284**, |S0| ≥ 2 in **71.1 %**, outcomes 3999 correct / 705 wrong /
  0 unresolved / 0 none; questions per trial {0: 2792, 1: 1363, 2: 388, 3: 101, 4: 60}. Note this covers seeds 1–2
  only; the paper's mean |S0| 2.49 / multi-candidate 46.1 % is over the full protocol — M5 (perception
  recalibration) owns that gap; don't read these two seeds as the calibration.
- At |S| = 2 all 1|1 partitions dedupe to a single proposal keyed by the lexicographically smallest predicate
  (usually a colour), so the final asked question is arbitrary by design. Harmless for every rule, but useful when
  reading traces (e.g. the R5 example above).

## TODO-SOURCE

- None added. The test encodes rules from the task brief only.

## Open questions

- Should SPEC §2's `Round { ..., sel, ... }` be documented as "the selected Prop object" (current behaviour)? The
  task brief's `round.props[round.sel]` suggests an index was once intended.
