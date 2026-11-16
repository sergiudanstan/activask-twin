# Task: docs · Grok · text only

Read `_common.md` first. Worktree `~/code/activask-twin-wt/docs`, branch `feat/docs` (from main: experiments,
calibration, the Experiments panel and the clarify fix are merged; grasp r1 and the UI are still being built).

**Files:** `README.md` and new `docs/FIDELITY.md` only.

## README.md
For a robotics reader who has not read the paper. Sections: what ActivAsk is (3 sentences, cite the paper), what the
twin shows (scene, robot, dialogue, head camera, grasp, experiments), how to use it (Auto vs Interactive, keys, URL
flags such as `?panels=`, `?mode=interactive`, `?demo=grasp`), **results**: one table per experiment with the paper's
number beside the twin's 5-seed mean (run `runBatch` for seeds 1..5 in Node like the tests do; never copy numbers by
hand), with the calibrated rows marked as calibrated, then the out-of-sample rows; limitations (simulated perception,
rule-based questions instead of a VLM, paired batch, grasp success sampled from the paper's category rates);
development (`npm test`, `npm run perturb`, `tools/shots.mjs`, the module map from SPEC §6, the worker process in
`docs/COORDINATION.md`); credits (paper authors; Hello Robot for the Stretch 3 specs, with the sources cited in
`16-kinematics.js`). Leave a `<!-- screenshots -->` marker where the lead will add images.

## docs/FIDELITY.md
An inventory a reviewer can check line by line. Three lists with file:line references:
1. **Exact** (implemented as the paper states): thresholds, candidate-state update, validation flags, EFE Eq. 11 with
   the uniform belief, policy rules, protocol counts, the waypoint order, etc.
2. **Calibrated** (fitted to a paper statistic; agreement there is not evidence): every `PER_*` band and rule in
   `13-perception.js`, with the target statistic.
3. **Simulated / assumed** (twin assumptions): every `TODO-SOURCE` and every "twin assumption" comment in `src/js`
   (grep them all; none may be missing), each with one line on why it is there and what it would take to remove it.
Close with the out-of-sample comparison: which twin numbers are close to the paper, which are not, and why.

Checks: `npm test` stays green (you do not touch code). Count the `TODO-SOURCE` occurrences in `src/js` and state in
the report that FIDELITY.md covers all of them. Finish with: DONE docs
