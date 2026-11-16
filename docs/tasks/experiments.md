# Task: experiments (M5) · Grok · logic only

Read `_common.md` first. Worktree `~/code/activask-twin-wt/experiments`, branch `feat/experiments` (from main: it has
the real `SCENES`/`INSTRUCTIONS` and your merged perception + clarify modules).

**Files:** `src/js/15-experiments.js` (prefix `ex`), `tests/experiments.test.mjs`, and the constants `PER_SCORE` /
`PER_*` in `src/js/13-perception.js` (calibration only, no API change). Implement SPEC §4.

## API
- `wilson(k, n, z = 1.96)` → [lo, hi] in %. `wilson(199, 216)` must give [87.76, 95.03] (the paper's CI).
- `runBatch({ set: "offline" | "online", policies, perPolicy, seed, eps = 0, K = 4, slip = 0.05 })` → `{ trials, summary }`.
  Protocol (Sec. 4.1-4.3): per policy, scenes round-robin, instruction type cycling clear → partial → ambiguous,
  instruction drawn uniformly from that type's pool, intended target drawn uniformly among its `matches`,
  `layoutScene(scene, trialSeed)`. Offline: 216 per policy over the 36 offline scenes. Online: 57 per policy
  (19 per type) over the 20 online scenes, the four online policies, plus the grasp stage: wrong or unresolved
  targets are not executed (operator verification), executed ones succeed with the paper's per-category rate
  (`PAPER.graspByCat`, sampled with `rng`, labelled simulated).
- `summarize(trials)` per policy: n, correct, acc + Wilson CI, asked %, mean Q all and on asked trials, outcome counts,
  by instruction type, by family, mean questions by |S0| = 2..6; online also attempts, grasp %, full-task %, non-executed.
- `epsSweep({ eps: [0, .05, .1, .15, .2], n: 98, policies })` (clarifying policies, trials with |S0| ≥ 2 and the target
  in S0) and `kSweep({ K: [1, 2, 3, 4, 5] })` (mean minimum G per round for ambiguous and partial instructions).
- Speed: a full offline batch (7 × 216 trials) in under 1 s in Node.

## Calibration (the main job)
Measured on main today with the current `PER_SCORE`, offline, 216 per policy: mean |S0| 2.60, multi-candidate 65.7 %
(paper 46.1 %), accuracy top 50.5 / random 47.7 / directVLM 56.0 / all clarifying 91.7 % (paper 53.7 / 53.2 / 53.7 /
90.7-92.1), questions on asked trials 1.68-1.77 for every clarifying policy (paper: ActivAsk 1.91, others 2.30-2.39).
The twin asks too often with too few candidates. In the paper a multi-candidate trial averages about 4.3 candidates
((2.49 − single share) / 0.461), and the pooled asked rates by type over all 7 methods (clear 1.79, partial 26.64,
ambiguous 52.37 %) imply about 3 / 47 / 92 % for the four clarifying policies: a *specific* query ("orange cup") often
keeps only the best-scoring match, while a category-only instruction keeps most of the category.
Tune the score model (only `PER_*` constants, plus a documented rule if needed) so that offline:
- mean |S0| = 2.49 ± 0.15 and multi-candidate rate = 46.1 ± 4 pp;
- clarifying policies' asked rate by type ≈ 3 / 47 / 92 % (± 8 pp);
- then report, do not force: accuracy per policy and by type, questions on asked trials, ActivAsk vs firstQ/randomQ/vlmQ.
  If ActivAsk's question advantage still does not appear, find out why (proposal set, K draw, vlmQ heuristic) and
  report it with numbers; change `14-clarify.js` only for a clear bug, and say so.

## Checks (tests/experiments.test.mjs, plus perturbations ≥ 2)
wilson CI above; batch determinism per seed; offline protocol balance (216 per policy, 72 per type, every offline scene
used 6 times); calibration targets above as checks; interactive accuracy ≥ 85 % and non-interactive 40-65 %;
online grasp stage never executes a wrong target; full-task % = correct and grasped / n.
Report: a table twin vs paper for every number in `PAPER.offline`, `PAPER.online`, `PAPER.qByS0`, `PAPER.noise`,
`PAPER.byType`, and what you changed in `PER_SCORE` with the reason.
