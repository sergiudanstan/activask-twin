# Task: sweep (test hardening) · OpenCode · tests only

Read `_common.md` first. Worktree `~/code/activask-twin-wt/sweep`, branch `feat/sweep`.

**File:** `tests/sweep.test.mjs` only. Do NOT edit anything under `src/`. If a check fails because of the code in
`src/`, keep the check, list the failing cases in `docs/tasks/sweep.report.md`, and still finish with `DONE sweep`
(the lead fixes `src/`).

Write a property sweep over the merged logic (`L` = the LOGIC object): for every scene in `L.SCENES` (56), every
instruction in `L.INSTRUCTIONS[scene.id]`, every policy in `L.POLICIES` (7), seeds 1 and 2:
`sc = L.layoutScene(scene, seed)`, target = `ins.matches[seed % ins.matches.length]`,
`tr = L.runTrial(sc, ins, target, policy.id, { seed })`. Collect failures in arrays and make ONE `check(...)` per rule
(with the first 5 failures in the message), so the output stays short:
1. `tr.outcome` is one of correct, wrong, unresolved, none.
2. `tr.questions === tr.rounds.length` and `tr.questions <= tr.S0.length - 1` (when `tr.S0.length >= 1`).
3. Non-clarifying policies (`clarifies: false`) ask 0 questions; clarifying ones ask at least 1 whenever `tr.S0.length >= 2`.
4. In every round the candidate set shrinks strictly and is a subset of the previous one (start from `tr.S0`).
5. Every selected proposal (`round.props[round.sel]`) has all four `valid` flags true.
6. Every selected question text passes your own independent wording test: no digit, no token like `c3` or `o4`,
   none of the words score, box, iou, threshold, candidate, id.
7. No question text is asked twice in one trial.
8. `tr.resolved` is null or in `tr.S0`; when `tr.outcome === "correct"` the resolved candidate is the target's candidate.
9. Run every trial again with `{ seed, slip: 0 }`: then EVERY proposal of every round has all four flags true and
   non-empty yes and no branches.
10. The whole sweep finishes in under 15 s (measure with `performance.now()` or `Date.now()` in the test file).

Add exactly these perturbations (they must both be CAUGHT by `npm run perturb`):
```js
export const perturbations = [
  { name: "wording validator ignores digits", find: "if (/\\d/.test(t)) return false;", replace: "if (false) return false;" },
  { name: "red colour question leaks a digit", find: 'return "Is it the " + v + " one?";', replace: 'return "Is it the " + v + " one?" + (v === "red" ? " 2" : "");' },
];
```
Report: the counts (trials run, checks), the time, every failing case if any, and DONE sweep.
