# Task: reasoning (M2 + M3) · Codex · logic only (no browser needed)

Read `_common.md` first. Worktree `~/code/activask-twin-wt/reasoning`, branch `feat/reasoning`.

**Files:** `src/js/13-perception.js` (prefix `per`), `src/js/14-clarify.js` (prefix `cl`),
`tests/perception.test.mjs`, `tests/clarify.test.mjs`. Logic block: no DOM, no three.js, no `Math.random`
(use `rng(seed)`). Publish with `Object.assign(LOGIC, {...})`. Implement SPEC §3.1 and §3.2 exactly.

## Perception (§3.1)
`buildQuery(instr)`, `matches(obj, instr)`, `detect(scene, query, seed)` (all proposals with scores and boxes),
`initialCandidates(scene, instr, seed)` (τ, NMS, ≤100, broad fallback, `disp` left to right).
Box = bounding box of the object's 8 corner points (from `dimsOf`, `yaw`, z from `TABLE.h`) through `camProject`.
Keep the score model's constants together at the top (`PER_SCORE = {...}`), so M5 can calibrate them against the
36 offline scenes (mean |S0| 2.49, multi-candidate 46.1 %).

## Clarification (§3.2)
`proposeQuestions(S, cands, scene, history, {K, seed, slip})`, `validateProp(p, S)`, `repairProp(p, S, cands, scene)`,
`fallbackProp(S, cands, scene)`, `efe(p, S)` (Eq. 11), `updateState(S, p, answer)` (Eq. 4),
`selectProp(policy, props, seed)`, `operatorAnswer(p, targetObj, eps, r)`,
`runTrial(scene, instr, targetObjId, policy, { seed, eps = 0, K = 4, slip = 0.05 })` → Trial (SPEC §2).
Questions read naturally ("Is it the orange one?", "Does it have a handle?", "Is it on the left side?",
"Is it the one next to the bottle?"), never with ids, numbers, scores or boxes. `history` stops a question from
being asked twice. Document the `directVLM` and `vlmQ` heuristics in a comment block.

## Required checks (write them in your two test files; add more)
- `efe`: 2|2 of 4 → −ln 2 (±1e-9), 1|3 → −0.5623 (±1e-4), 1|1 → −ln 2, 3|3 → −ln 2; lower G for more balanced splits.
- Validation flags a dropped candidate, a duplicated candidate, a foreign candidate, and an id-leaking text; repair
  fixes an unambiguous slip; fallback is always valid.
- `updateState` returns a subset and never reintroduces candidates; the loop stops at |S| ≤ 1.
- With ε = 0 and the target among S0, every clarifying policy resolves the correct target in 500 random trials on
  synthetic scenes (6 cups, distinct attributes); `top` and `random` are near chance (1/|S0|).
- On synthetic 6-candidate states where a balanced proposal exists in every round, ActivAsk's mean questions are
  within 0.1 of the ideal 2.667 and below `firstQ`'s and `randomQ`'s.
- ε = 0.2 lowers ActivAsk's accuracy (show the number), and `runTrial` is deterministic per seed.
- Perturbations (at least 3): e.g. the natural log replaced by log2 in a way a check sees, argmin replaced by argmax,
  the update branch swapped (yes ↔ no).

Report: check counts, perturbations, example dialogues (3 trials printed as text), and open questions.
