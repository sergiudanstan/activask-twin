# Report: expui (Experiments panel) · Grok

Branch `feat/expui`. New file `src/js/67-expui.js` (prefix `exu`). No edits to `page.html`, `50`, `60`, `65`, `66`, or `14-clarify.js`. Every twin figure is labelled simulated and sits beside `PAPER`. The panel opens on the M5 protocol seed **11**.

## What was built

- Controls in `#exp`: set (offline / online), seed, ε, K, slip. **Run batch** calls `runBatch` synchronously and is disabled while that run is in flight. **Copy batch CSV** writes one row per trial (scene, instruction, type, policy, |S0|, questions, outcome, and the online grasp fields).
- On load, `queueMicrotask` runs one offline batch (7 × 216) plus `epsSweep` and `kSweep` at the same seed, so the paper table's twin column is filled without a click. Measured about 100–115 ms for the three together.
- Tables, paper on the muted row and the twin on the tinted row: offline accuracy with the Wilson interval, asked %, Q all, Q on asked trials; online target accuracy, attempts, grasp %, full-task %, non-executed; instruction type pooled over the batch.
- Three inline SVGs, coloured with the page's CSS variables (`--ink`, `--accent`, `--scara`, `--delta`, `--vision`, `--bad`, `--press`, `--faint`, `--line`), so light and dark (including `prefers-color-scheme`) restyle them without a redraw.
  1. Mean questions by |S0| = 2..6: ideal, paper ActivAsk, twin ActivAsk, twin firstQ / randomQ / vlmQ.
  2. Accuracy vs ε = 0..0.2: paper (dashed) and twin (solid) for the four clarifying policies.
  3. Mean minimum G vs K = 1..5 for partial and ambiguous, beside `PAPER.kSweep`.
- `#report [data-twin]` gets the offline accuracy. The Wilson interval is the cell's `title`. Seed 11: top 59.26, random 55.56, directVLM 59.72, and 89.35 for firstQ, randomQ, vlmQ and ActivAsk.
- `CHECKS` entry `experiments panel`: 7 numeric twin cells and the three charts. This branch's `70-loop.js` does not declare `CHECKS` yet (the lead's main checkout does). The panel pushes when that array exists, and otherwise folds the same check into `window.pc.checks`. Shots reported `ok: true` with detail `7 twin accuracies and 3 charts`.

## Checks

- `npm test`: **146 passed, 0 failed** (5 files), ends `all checks passed`.
- `npm run perturb`: **15 of 15 CAUGHT**. No new perturbation: `67-expui.js` is outside the logic block, so `tests/run.mjs` cannot see it. The M5 perturbations still fire.
- `node tools/shots.mjs --port 8793 --query "panels=exp,report" --view iso --t 1 --out _shots/expui`: **console errors: 0**, `pc.checks()` ok. Shot: `_shots/expui/iso_1.0.png`.
- Also exercised in headless Chrome, then inspected the drawer crops: scrolled to the offline table, ran an online batch, changed the seed to 2 (the twin column moved, top 59.26 → 61.11), copied the CSV (1513 lines = header + 1512 trials), and reloaded under `prefers-color-scheme: dark`. Dark `--ink` was `#ece6e1`, the grid stroke followed `--line`, and the charts stayed readable. Axes are labelled, legends sit under the plots, and the confidence intervals stay on one line.

## Twin numbers at seed 11 (simulated)

Offline, 216 trials per policy. Paper in parentheses.

| Policy | Acc % (CI) | Asked % | Q all | Q asked |
|---|---|---|---|---|
| Top | 59.26 (52.60–65.59) | 0 | 0 | – |
| Random | 55.56 (48.89–62.03) | 0 | 0 | – |
| Direct VLM | 59.72 (53.07–66.04) | 0 | 0 | – |
| First Q / Random Q / VLM Q / ActivAsk | 89.35 (84.53–92.80) | 47.69 | 1.05 / 1.00 / 1.06 / 0.94 | 2.19 / 2.10 / 2.23 / 1.98 |

Paper ActivAsk is 92.13 (87.76–95.03), asked 48.15, Q all 0.92, Q asked 1.91. Mean |S0| 2.51 (paper 2.49). Multi-candidate 47.69% (paper 46.10).

Pooled by type, all seven methods: clear acc 96.83 / asked 0.79 / Q asked 1.00 (paper 96.02 / 1.79 / –); partial 63.69 / 27.78 / 1.03 (paper 69.38 / 26.64 / 1.30); ambiguous 67.46 / 53.17 / 2.72 (paper 60.47 / 52.37 / 2.75).

Online, 57 trials, same seed. An online run does not overwrite the offline twin column.

| Policy | Target % | Tries | Grasp % | Full % | Skip |
|---|---|---|---|---|---|
| Top | 59.65 | 34 | 94.12 | 56.14 | 23 |
| Random | 63.16 | 36 | 94.44 | 59.65 | 21 |
| VLM Q | 91.23 | 52 | 90.38 | 82.46 | 5 |
| ActivAsk | 91.23 | 52 | 90.38 | 82.46 | 5 |

Paper ActivAsk is 92.98 / 53 / 94.34 / 87.72 / 4. VLM Q and ActivAsk share the grasp counts because the schedule is paired and a correct target is executed at the category rate, not at a per-policy rate.

The ε chart starts at 100 for the twin: the sweep keeps only trials with the target inside S0, and the operator is truthful at ε = 0. ActivAsk falls off slower than firstQ and vlmQ. The K chart is flat (ambiguous about −0.682, partial about −0.690 at every K). That is `clKeepBalance` in the clarify module, already reported in M5. Not changed here.

## Assumptions

- Seed 11 is the default because it is the M5 draw that sits inside the calibration windows. Seed 1's partial asked-rate was only 1.3 pp above the floor.
- The ε and K charts are the paper's sweeps (`epsSweep` N = 98, `kSweep` K = 1..5), not the batch's single ε and K. They follow the panel seed and stay at K = 4 and slip 0.05 so the dashed paper series stay comparable. The controls apply to `runBatch` only.
- The paper table's `white-space: nowrap` pushed the twin column past the drawer edge. The panel's stylesheet makes `#report table.grid` fit the 360 px drawer (policy names wrap, the five columns share the width). `60-ui.js` and `page.html` were not edited.
- The report card's **Copy trials CSV** is the ui worker's session log. This panel's button copies the batch. They are different files of rows.
- Grasp success is the M5 category-rate draw. It will not match the paper's per-policy grasp rates.
- `index.html` is generated. It was rebuilt for the shots and is not part of the commit.

## TODO-SOURCE

None new. The simulated detector, the grasp rates and the flat K sweep are the M5 rules.

## Open questions for the lead

- When `70-loop.js` on this branch gains the `CHECKS` array from main, the fallback that wraps `window.pc.checks` stops running. Worth a glance that the push still happens after that file evaluates (this file is concatenated before it, so the push is in the load microtask).
- Is the `#report` table restyle acceptable, or should the column widths move into `60-ui.js`?
- Confirm the batch CSV and the ui worker's session CSV should stay separate.
