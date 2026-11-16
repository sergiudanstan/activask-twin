# Report: experiments (M5) · Grok · logic only

Branch `feat/experiments`. Files: `src/js/15-experiments.js` (new), `tests/experiments.test.mjs` (new),
`PER_SCORE` / `PER_RIVAL` / `PER_BARE` in `src/js/13-perception.js` (calibration only; the public names
`buildQuery`, `matches`, `detect`, `initialCandidates` are unchanged). `14-clarify.js` was not edited.
Every twin number below is **twin (simulated)**. The checked protocol draw is seed 11. A 13-seed average
is given beside it so the draw is not the only evidence.

## What was built

- `wilson(k, n, z = 1.96)` → Wilson score interval in percent, rounded to 2 decimals. `wilson(199, 216)` is `[87.76, 95.03]`. `wilson(116, 216)` is `[47.05, 60.23]`.
- `runBatch({ set, policies, perPolicy, seed, eps = 0, K = 4, slip = 0.05 })` → `{ trials, summary, seed, set, simulated }`.
  One schedule is shared by every policy (paired scene, instruction, target, layout, S0). Type cycles clear → partial → ambiguous; the scene index is `(k + t) mod nScenes`. The instruction is uniform in that scene's pool for the type; the target is uniform in `matches`. `layoutScene(scene, layoutSeed)` runs once per trial and is reused across policies.
  Offline default: 7 policies × 216 trials, 72 per type, each of the 36 scenes six times. Online default: the four `POLICIES` with `online: true` (top, random, vlmQ, activask) × 57 trials, 19 per type.
- Online grasp stage: only `outcome === "correct"` is executed. Success is a Bernoulli draw at `PAPER.graspByCat[cat].rate` with `rng`. Wrong, unresolved and empty targets are not executed.
- `summarize(trials)` per policy: n, correct, accuracy, Wilson CI, asked %, mean questions (all trials and asked trials), outcome counts, by instruction type, by family, mean questions at `|S0|` = 2..6, `meanS0`, multi-candidate %. Online rows also have attempts, non-executed, grasp %, grasp CI, full-task % (grasped / n), full-task CI.
- `epsSweep` draws clarifying trials until 98 have `|S0| ≥ 2` and the target inside S0, then reruns them at ε = 0, 0.05, 0.1, 0.15, 0.2.
- `kSweep` reports mean minimum proposal G per round on partial and ambiguous instructions at K = 1..5.
- A full offline batch (7 × 216) measured 38 ms. The check requires under 1 s.

## Checks

- `npm test`: **146 passed, 0 failed** (5 files), ends `all checks passed`.
- `npm run perturb`: **15 of 15 CAUGHT**, including the three new ones (Wilson centre term quartered; grasp executes the wrong targets; scene round-robin collapsed).
- Console errors: none. Logic task, no browser, no `tools/shots.mjs`.
- `index.html` was rebuilt by the test runner and left unstaged.

## What changed in `PER_SCORE`, and why

Before this pass a modified phrase and a bare noun drew from overlapping bands (`specific` 0.26–0.72, `full` 0.58–0.96, `missP` 0.05). A specific query often missed, the broad-noun fallback then returned the whole category, and a bare noun kept almost everyone. On the real 36 scenes that produced mean `|S0|` about 2.60 and a multi-candidate rate about 66 %, with clarifying asked-rates far above 3 / 47 / 92 and about 1.7 questions on every asked trial.

The refit separates the two prompts. Bands (τ = 0.38):

| band | range | role |
|---|---|---|
| `full` | 0.60–0.96 | bare-noun category match, always ≥ τ except `missP` |
| `specific` | 0.64–0.97 | best modified-phrase match, always ≥ τ |
| `rival` | 0.14–0.58 | each other phrase match; P(≥ τ) = 0.455 before NMS |
| `noun` | 0.06–0.36 | right category, a modifier fails; always < τ |
| `confusable` | 0.02–0.30 | specific phrase, fork↔spoon or cup↔bottle; always < τ |
| `other` | 0.01–0.18 | specific phrase, anything else; always < τ |
| `broadConf` | 0.40–0.57 | bare noun, confusable; always ≥ τ and below `full.lo` |
| `broadOther` | 0.33–0.58 | bare noun, unrelated; P(≥ τ) = 0.80, still below `full.lo` |
| `missP` 0.03 | 0.05–0.37 | bare-noun true match drawn under τ |
| `singleP` 0.10 | | bare-noun query collapsed to its best category box |

Three rules sit on the bands (comments in `13-perception.js`):

1. **Rival suppression.** Every phrase match draws from `specific`; all but the highest are redrawn from `rival`. A clear instruction (one ground-truth match) stays one box. A partial (usually two matches) grows a second box on about half of trials. Same-label NMS still drops a rival whose projected box overlaps the winner.
2. **Loose bare-noun bands.** `broadConf` and `broadOther` apply only when the phrase is the bare noun, so an ambiguous instruction keeps most of the category plus some extras. Both top out below `full.lo`, so the top-score pick remains a category member.
3. **`singleP` collapse.** With probability 0.10 a bare-noun query keeps only its best category box (the same argmax top-score would have picked) and pushes every other box under τ. That is what brings the ambiguous asked-rate down near 92 % without shrinking the trials that stay multi-candidate. The survivor is boosted to `full.lo` if the miss coin had put it under τ.

A handle or lid constraint on an otherwise bare phrase is scored as specific, even though `buildQuery` still leaves it out of the detector string. Two offline clear instructions are lid-only ("the cup with a lid"); without this they would detect every cup.

Over 13 seeds (1, 2, 3, 4, 5, 7, 11, 13, 17, 19, 23, 29, 31) the offline means are `|S0|` **2.471**, multi-candidate **46.3 %**, clarifying asked-rates **1.6 / 46.6 / 90.6 %**. Nine of the thirteen seeds sit inside every check window. The four misses are binomial tails on 72 trials (partial asked 56–57, ambiguous asked 83, clarifying accuracy 83). Seed 11, the seed the tests lock, is inside all of them: `|S0|` 2.514 (range 1–8), multi 47.7 %, asked 1.4 / 48.6 / 93.1. Multi-candidate trials on that draw average 4.18 candidates (the paper's figure is about 4.3). Histogram: 1×113, 2×34, 3×3, 4×27, 5×6, 6×21, 7×7, 8×5. There is no `|S0| = 0` on this draw.

## Twin vs paper

Seed 11. Paper column is the published number. Time is not simulated.

### `PAPER.offline` (216 trials per policy)

| policy | correct | acc % | Wilson CI | asked % | q all | q asked |
|---|---|---|---|---|---|---|
| top twin | 128 | 59.26 | 52.60–65.59 | 0 | 0 | — |
| top paper | 116 | 53.70 | 47.05–60.23 | 0 | 0 | — |
| random twin | 120 | 55.56 | 48.89–62.03 | 0 | 0 | — |
| random paper | 115 | 53.24 | 46.59–59.78 | 0 | 0 | — |
| directVLM twin | 129 | 59.72 | 53.07–66.04 | 0 | 0 | — |
| directVLM paper | 116 | 53.70 | 47.05–60.23 | 0 | 0 | — |
| firstQ twin | 193 | 89.35 | 84.53–92.80 | 47.69 | 1.046 | 2.194 |
| firstQ paper | 197 | 91.20 | 86.67–94.30 | 46.76 | 1.11 | 2.37 |
| randomQ twin | 193 | 89.35 | 84.53–92.80 | 47.69 | 1.000 | 2.097 |
| randomQ paper | 196 | 90.74 | 86.13–93.93 | 46.76 | 1.12 | 2.39 |
| vlmQ twin | 193 | 89.35 | 84.53–92.80 | 47.69 | 1.065 | 2.233 |
| vlmQ paper | 199 | 92.13 | 87.76–95.03 | 47.22 | 1.09 | 2.30 |
| activask twin | 193 | 89.35 | 84.53–92.80 | 47.69 | 0.944 | 1.981 |
| activask paper | 199 | 92.13 | 87.76–95.03 | 48.15 | 0.92 | 1.91 |

The four clarifying policies agree on accuracy (89.35 %, 23 wrong, 0 unresolved, 0 empty) because at ε = 0 a repaired question never drops the target once it is in S0. The 23 misses are targets the detector did not return. directVLM and top differ by one trial; both pick the highest phrase match, then the noun, then the score.

ActivAsk's asked-trial mean is 1.981 against the paper's 1.91, and its all-trial mean is 0.944 against 0.92. It is below firstQ (2.194), randomQ (2.097) and vlmQ (2.233). The gap is real and smaller than the paper's (about 10 % versus firstQ and vlmQ, about 6 % versus randomQ; the paper's gaps are 15–20 %).

Why the baselines ask fewer questions than the paper:

- Partial detections are almost always `|S0|` = 2, so every policy asks exactly one question there (partial q-asked 1.029, paper 1.30). The rival rule was what hit the 47 % partial asked-rate; it also caps those sets at two boxes.
- `clKeepBalance` in `14-clarify.js` (already on main, not changed here) forces a maximally balanced proposal into the K set whenever the draw missed one. randomQ therefore sees a near-optimal split on every round. firstQ and vlmQ still prefer a colour key, so they remain worse, but the forced split keeps them from the paper's longer peels.
- At `|S0|` = 6, ActivAsk is 2.810 (paper 2.700, ideal 2.667) and firstQ is 3.095 (paper 3.450). The mechanism matches the paper on the large sets. Those sets are 21 of 103 asked trials; 34 asked trials are `|S0|` = 2 and contribute a 1 for every policy, which compresses the average.

I did not edit `14-clarify.js`. Taking the force-include out would lengthen the baselines and would also let ActivAsk miss the balanced split on some rounds. That is a product choice, recorded under open questions.

### `PAPER.byType` (seven policies pooled, 504 trials per type)

| type | twin correct | twin acc | twin asked % | twin q asked | paper correct | paper acc | paper asked | paper q asked |
|---|---|---|---|---|---|---|---|---|
| clear | 488/504 | 96.83 | 0.79 | 1.000 | 483/503 | 96.02 | 1.79 | — |
| partial | 321/504 | 63.69 | 27.78 | 1.029 | 349/503 | 69.38 | 26.64 | 1.30 |
| ambiguous | 340/504 | 67.46 | 53.17 | 2.716 | 306/506 | 60.47 | 52.37 | 2.75 |

Clarifying policies alone, same draw: clear asked 1.39 % / acc 97.22; partial asked 48.61 % / acc 75.00 / q 1.029; ambiguous asked 93.06 % / acc 95.83 / q 2.716. ActivAsk's ambiguous q-asked is 2.493 against firstQ 2.821.

Pooled family accuracy (paper in parentheses): bottles 73.54 (75.74), cups 75.13 (74.02), mixed 75.93 (80.58), utensils 79.37 (71.39). Not a calibration target.

### `PAPER.qByS0` (mean questions; n is the seed-11 count, shared because the policies are paired)

| `|S0|` | n | ideal | firstQ twin / paper | randomQ twin / paper | vlmQ twin / paper | activask twin / paper |
|---|---|---|---|---|---|---|
| 2 | 34 | 1.000 | 1.000 / 1.000 | 1.000 / 1.053 | 1.000 / 1.000 | 1.000 / 1.000 |
| 3 | 3 | 1.667 | 1.667 / 1.909 | 1.333 / 1.909 | 1.667 / 1.909 | 1.667 / 1.727 |
| 4 | 27 | 2.000 | 2.185 / 2.167 | 2.074 / 2.444 | 2.185 / 2.222 | 2.000 / 2.056 |
| 5 | 6 | 2.400 | 3.000 / 2.667 | 2.333 / 3.000 | 3.000 / 2.000 | 2.667 / 2.333 |
| 6 | 21 | 2.667 | 3.095 / 3.450 | 3.000 / 3.158 | 3.190 / 3.550 | 2.810 / 2.700 |

`|S0|` = 3 and 5 are a handful of trials. At 2, 4 and 6 ActivAsk sits on the ideal or within 0.15 of the paper.

### `PAPER.noise` (accuracy %, 98 conditioned trials, seed 11)

| ε | firstQ twin / paper | randomQ twin / paper | vlmQ twin / paper | activask twin / paper |
|---|---|---|---|---|
| 0 | 100.00 / 98.98 | 100.00 / 93.88 | 100.00 / 96.94 | 100.00 / 98.98 |
| 0.05 | 92.86 / 87.78 | 92.86 / 82.92 | 91.84 / 86.40 | 93.88 / 89.68 |
| 0.10 | 82.65 / 77.75 | 82.65 / 73.14 | 80.61 / 76.96 | 84.69 / 81.05 |
| 0.15 | 75.51 / 68.78 | 76.53 / 64.39 | 72.45 / 68.50 | 76.53 / 73.05 |
| 0.20 | 65.31 / 60.76 | 69.39 / 56.58 | 64.29 / 60.90 | 68.37 / 65.62 |

ε = 0 is 100 % because the sweep keeps only trials whose target is already in S0 and the operator is truthful. The paper's ε = 0 column is 94–99 % because a real VLM proposal sometimes fails. ActivAsk degrades more slowly than firstQ and vlmQ, and at ε = 0.20 it is 68.4 against the paper's 65.6. randomQ stays higher than the paper's randomQ for the same reason it asks fewer questions: fewer answers, fewer flips.

### `PAPER.kSweep` (mean minimum G per round, seed 11)

| K | ambiguous twin / paper | partial twin / paper |
|---|---|---|
| 1 | −0.682 / −0.649 | −0.690 / −0.664 |
| 2 | −0.682 / −0.655 | −0.690 / −0.661 |
| 3 | −0.682 / −0.656 | −0.690 / −0.674 |
| 4 | −0.682 / −0.669 | −0.690 / −0.675 |
| 5 | −0.682 / −0.670 | −0.690 / −0.681 |

The curve is flat. `clKeepBalance` inserts the most balanced partition for every K, including K = 1, so the minimum cannot improve as K grows. Partial rounds are almost a 1|1 split, so G sits on −ln 2 (−0.693). Ambiguous rounds are a little less even (−0.682). The paper's slow improvement with K is a VLM that sometimes misses the balanced question at small K. Latency in the paper (3.49–10.42 s) is not simulated.

### `PAPER.online` (57 trials per policy, seed 11)

| | top twin / paper | random twin / paper | vlmQ twin / paper | activask twin / paper |
|---|---|---|---|---|
| target acc % | 59.65 / 59.65 | 63.16 / 61.40 | 91.23 / 91.23 | 91.23 / 92.98 |
| target CI | 46.70–71.38 / 46.70–71.38 | 50.18–74.48 / 48.43–72.94 | 81.05–96.19 / 81.06–96.19 | 81.05–96.19 / 83.30–97.24 |
| attempts | 34 / 34 | 36 / 35 | 52 / 52 | 52 / 53 |
| non-executed | 23 / 23 | 21 / 22 | 5 / 5 | 5 / 4 |
| grasp % | 94.12 / 88.24 | 94.44 / 82.86 | 90.38 / 88.46 | 90.38 / 94.34 |
| grasp CI | 80.91–98.37 / 73.38–95.33 | 81.86–98.46 / 67.32–91.90 | 79.39–95.82 / 77.03–94.60 | 79.39–95.82 / 84.63–98.06 |
| full-task % | 56.14 / 52.63 | 59.65 / 50.88 | 82.46 / 80.70 | 82.46 / 87.72 |
| full CI | 43.28–68.23 / 39.92–65.01 | 46.70–71.38 / 38.26–63.38 | 70.63–90.18 / 68.66–88.87 | 70.63–90.18 / 76.75–93.92 |
| q asked | — / — | — / — | 2.034 / 2.25 | 1.759 / 1.84 |

Top's target accuracy, CI, attempt count and non-executed count match the paper on this seed because both are 34/57. That is the draw, not a fit. Grasp success is sampled from `PAPER.graspByCat`, so a policy's grasp % does not reproduce that policy's published grasp %; full-task % moves with it. ActivAsk's online question mean (1.759 vs 1.84) keeps the same shape as offline.

## Assumptions

- The schedule is paired across policies. The paper does not say the seven methods saw the same images; pairing makes the question comparison readable and keeps the batch at 216 layouts rather than 1512.
- `perPolicy` must be a multiple of 3. The defaults (216 and 57) are.
- Trial records keep `runTrial`'s shape (`scene` is the scene id, `instr` is the text) and add `type`, `family`, and, online, `executed`, `grasped`, `grasp` (`ok` / `fail` / `skipped`), `simulated`.
- Unknown policy ids are not given a private branch; `runBatch` runs whatever ids the caller passes, and `runTrial` treats an unknown id as non-clarifying only when `POLICIES` says so.
- Layouts are cached by `sceneId:seed` for the process. `layoutScene` is deterministic, so the cache does not change results.

## TODO-SOURCE

All of these are marked in `13-perception.js`:

- Per-tier score distributions are not in the paper. The bands, `missP`, `singleP`, rival suppression and the broad-only false-positive bands are a twin assumption, refit to the offline totals above.
- The paper does not say a bare-noun query sometimes returns only its top box. `singleP` is how the twin hits an ambiguous asked-rate near 92 % while keeping multi-candidate scenes large enough for mean `|S0|` ≈ 2.49.
- The paper does not publish the text prompt per attribute. A handle/lid word on a bare phrase is scored as a specific match so "the cup with a lid" does not detect every cup. `buildQuery` still omits handle and lid from the phrase, as SPEC §3.1 requires.
- `directVLM` and `vlmQ` remain the heuristics already documented in `14-clarify.js`. They are not MiMo-VL.
- Grasp physics are the category rates in `PAPER.graspByCat`, labelled simulated. Wall-clock time and the K-sweep latency are not modelled.

## Open questions for the lead

- `clKeepBalance` makes the K-sweep flat and shrinks ActivAsk's question advantage toward about 10 % (paper 15–20 %). Leaving it keeps ActivAsk on the ideal at `|S0|` = 4 and near the paper at `|S0|` = 6. Removing it is a `14-clarify.js` change; I did not make it.
- `|S0|` on seed 11 runs from 1 to 8. A total miss does not occur: a phrase query always keeps its best match, and a collapsed bare-noun query boosts that box above τ. The paper's range includes 0.
- Neighbouring seeds can leave the ±4 pp multi window or the ±8 pp asked window. The 13-seed means (2.471, 46.3 %, 1.6 / 46.6 / 90.6) are the calibration; seed 11 is the locked check.
- Confirm that experiment rows may carry `type`, `family` and the grasp fields next to the Trial contract. They are additive.
