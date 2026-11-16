# Docs report

## What I built

- Rewrote `README.md` for a robotics reader: what ActivAsk is, what the twin shows, how to use it, one table per experiment with the paper beside the twin's 5-seed mean, calibrated rows first, limitations, development, credits. Left `<!-- screenshots -->` after "What the twin shows".
- Added `docs/FIDELITY.md`: exact rules with file:line, every `PER_*` band and the three fit rules, every `TODO-SOURCE` and every twin-assumption comment, then which out-of-sample numbers sit near the paper and which do not.

No source file was edited. `index.html` was rebuilt by the checks and matches HEAD.

## Checks

- `npm test`: 164 passed, 0 failed, 7 test files, ends "all checks passed".
- `npm run perturb`: all 21 perturbations caught. No new perturbation: this task does not touch the logic block.
- Shots were not run. The task is text only and the page was not changed, so there are no new console errors to report.

## How the numbers were computed

Loaded the logic block out of `index.html` the way `tests/run.mjs` does (`new Function` on the `@@logic-start` slice) and called the published functions. Seeds 1, 2, 3, 4, 5. Offline and online: `runBatch({ set, seed, eps: 0, K: 4, slip: 0.05 })`. Noise: `epsSweep({ seed })` (N = 98, ε grid as the paper). K: `kSweep({ seed })`. Headline cell = the unweighted mean of the five per-seed rates, then `toFixed` at the precision the README prints. Not a pooled count over 5×216, and not a Wilson interval on that pool. The same definition is what the Experiments panel writes into `[data-twin]`.

Timing on this machine: offline 166 ms, online 21 ms, K sweep 85 ms, noise sweep 369 ms.

Within each offline seed the four clarifying policies had identical accuracy and identical asked rate. Within each online seed, `vlmQ` and `activask` had identical target accuracy, attempts, grasp rate and full-task rate. Question counts differed.

### Headline (mean of seeds 1–5)

Calibrated: mean |S0| 2.475926 (printed 2.48) against 2.49. Multi-candidate 46.574% (printed 46.57) against 46.10. Clarifying asked by type: clear 2.222, partial 47.778, ambiguous 89.722 (printed 2.22 / 47.78 / 89.72). Paper clarifying equivalent used in the README is the published pooled asked rate × 7/4: 1.79 → 3.1325, 26.64 → 46.62, 52.37 → 91.6475.

Offline accuracy / asked / Q all / Q asked (unrounded):

| Policy | acc | asked | qAll | qAsked |
|---|---:|---:|---:|---:|
| top | 60.000 | 0 | 0 | – |
| random | 54.722 | 0 | 0 | – |
| directVLM | 60.370 | 0 | 0 | – |
| firstQ | 86.852 | 46.574 | 0.985 | 2.115 |
| randomQ | 86.852 | 46.574 | 0.941 | 2.022 |
| vlmQ | 86.852 | 46.574 | 0.980 | 2.104 |
| activask | 86.852 | 46.574 | 0.894 | 1.923 |

The README prints Q to two decimals, so ActivAsk's 1.923 is shown as 1.92 beside the paper's 1.91.

Pooled by type (all 7 policies): clear acc 99.444 Q asked 1.000; partial acc 60.952 Q 1.013; ambiguous acc 63.532 Q 2.612. Clarifying-only partial accuracy is 70.000, which is a different pool from the paper's 69.38 and is not the cell in the README.

Family acc: cups 72.063, bottles 75.238, utensils 73.122, mixed 78.148.

Online target / attempts / grasp / full / not-executed / Q asked:

| Policy | target | attempts | grasp | full | skip | Q asked |
|---|---:|---:|---:|---:|---:|---:|
| top | 59.649 | 34.0 | 90.708 | 54.035 | 23.0 | – |
| random | 55.439 | 31.6 | 91.632 | 50.877 | 25.4 | – |
| vlmQ | 88.070 | 50.2 | 90.856 | 80.000 | 6.8 | 2.084 |
| activask | 88.070 | 50.2 | 90.856 | 80.000 | 6.8 | 1.879 |

K sweep, mean minimum G, ambiguous then partial: K1 −0.6283 / −0.6920, K2 −0.6613 / −0.6919, K3 −0.6729 / −0.6919, K4 −0.6780 / −0.6919, K5 −0.6802 / −0.6919. Printed to three decimals. Ambiguous falls. Partial is already at a half split.

Noise, ActivAsk accuracy at ε = 0, 0.05, 0.10, 0.15, 0.20: 100, 92.041, 80.816, 72.245, 65.306. The other three policies are in the README. At ε = 0 every clarifying policy is 100 on this sweep.

### Per seed, offline

| Seed | mean \|S0\| | multi % | top acc | random acc | direct acc | clarifying acc | asked % | Q asked first/random/vlm/ActivAsk | asked by type clear/partial/ambiguous |
|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | 2.528 | 44.91 | 59.26 | 56.48 | 59.26 | 87.50 | 44.91 | 2.134 / 2.052 / 2.216 / 2.021 | 1.39 / 40.28 / 93.06 |
| 2 | 2.519 | 45.83 | 61.11 | 56.48 | 61.57 | 87.50 | 45.83 | 2.202 / 2.101 / 2.192 / 1.990 | 2.78 / 40.28 / 94.44 |
| 3 | 2.486 | 49.07 | 61.11 | 52.31 | 61.57 | 87.96 | 49.07 | 2.104 / 1.991 / 2.075 / 1.877 | 1.39 / 56.94 / 88.89 |
| 4 | 2.366 | 43.52 | 59.72 | 53.24 | 60.19 | 83.80 | 43.52 | 2.053 / 2.053 / 1.979 / 1.926 | 1.39 / 45.83 / 83.33 |
| 5 | 2.481 | 49.54 | 58.80 | 55.09 | 59.26 | 87.50 | 49.54 | 2.084 / 1.916 / 2.056 / 1.804 | 4.17 / 55.56 / 88.89 |

### Per seed, online (target %, grasp %, full %, attempts, not executed)

| Seed | top | random | vlmQ and activask |
|---:|---|---|---|
| 1 | 56.14, 93.75, 52.63, 32, 25 | 50.88, 93.10, 47.37, 29, 28 | 85.96, 93.88, 80.70, 49, 8 |
| 2 | 57.89, 87.88, 50.88, 33, 24 | 52.63, 90.00, 47.37, 30, 27 | 92.98, 88.68, 82.46, 53, 4 |
| 3 | 64.91, 86.49, 56.14, 37, 20 | 49.12, 89.29, 43.86, 28, 29 | 87.72, 86.00, 75.44, 50, 7 |
| 4 | 56.14, 93.75, 52.63, 32, 25 | 59.65, 91.18, 54.39, 34, 23 | 82.46, 91.49, 75.44, 47, 10 |
| 5 | 63.16, 91.67, 57.89, 36, 21 | 64.91, 94.59, 61.40, 37, 20 | 91.23, 94.23, 85.96, 52, 5 |

## Inventory coverage

`TODO-SOURCE` occurs 7 times in `src/js`. `FIDELITY.md` cites each one:

- `13-perception.js:4` score bands
- `13-perception.js:25` handle/lid prompt (the cite in the inventory is `:24`, the comment that contains it)
- `14-clarify.js:6` direct VLM and vlmQ
- `14-clarify.js:15` "next to" distance
- `14-clarify.js:260` how the K proposals are drawn
- `16-kinematics.js:17` shell height
- `16-kinematics.js:32` fingertip station (cited as `:30-33`, the comment and the `gripY` value)

"twin assumption" occurs 4 times: `10-contracts.js:40`, `:52`, `:60`, and `13-perception.js:4`. "Twin-assumed" occurs once, `11-scenes.js:2`. All five are in the inventory. Two further assumptions are in the inventory because SPEC labels them and the source does not use those words: slip 0.05 (`14-clarify.js:416`, SPEC §3.2) and grasp success sampled from `PAPER.graspByCat` (`15-experiments.js:77-91`, SPEC §3.3).

63 file:line citations in `FIDELITY.md` were checked against the current files; every range falls inside its file.

## Decisions

- Compared clarifying asked-by-type with the published pooled rate × 7/4. The bands were fitted to the clarifying rates (about 3 / 47 / 92), and the paper's 1.79 / 26.64 / 52.37 pool the three policies that never ask. The README says so above the calibrated table.
- Included the K sweep. On this main the forced balanced proposal is gone (`14-clarify.js:260-264`), so K changes the ambiguous curve. The old flat curve is not the number. Partial stays near −ln 2 because those instructions already have a balanced attribute split at K = 1. I did not retune perception or the proposal pool.
- Included the noise sweep. `epsSweep` drops trials whose target is outside S0 or whose |S0| is under 2, which is why ε = 0 is 100%. That conditioning is stated under the table.
- Documented `?demo=grasp`, Interactive Yes/No, the head-camera picture and the waypoint motion as specified and not wired in this tree. `planGrasp` and `graspWaypoints` are absent. The README does not describe them as working.
- Left `docs/COORDINATION.md` alone. Its status rows still say experiments, grasp and ui are in progress; the process section is what the README points at.
- Did not move `CAM_POSE`. The comment at `10-contracts.js:60` still says the camera height is an assumption until M1. `STRETCH.d435i.z` is 1.322 m and the pose is still 1.30 m. Recorded in the inventory.

## Open questions

- Should `CAM_POSE` be driven from the sourced optical centre (1.322 m) and the comment updated? That is a code change, so it was left.
- The partial K series is flat at about −0.692. If it should fall the way the paper's partial series falls (−0.664 to −0.681), the proposal generator has to change. I did not change it.
- `docs/COORDINATION.md` is behind main (experiments and the experiments panel are merged). I did not edit it.
