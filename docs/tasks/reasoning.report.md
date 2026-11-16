# reasoning report (M2 + M3)

Perception (`src/js/13-perception.js`, prefix `per`) and the clarification loop (`src/js/14-clarify.js`, prefix `cl`). Logic only: no DOM, no three.js, no `Math.random`. Published on `LOGIC`.

## What was built

- `buildQuery(instr)` — detector phrase is size + colour + material + noun. Handle and lid stay out of the phrase (SPEC §3.1 lists colour, size, material). `broad` is true when those three are absent.
- `matches(obj, instr)` — ground truth for the operator: category plus every modifier, including handle and lid. The policy does not call it.
- `detect(scene, query, seed)` — one proposal per object: label = category, score from `rng`, box = image AABB of the 8 corners of the `dimsOf` body at yaw, bottom at `TABLE.h`.
- `initialCandidates(scene, instr, seed)` — keep score ≥ max(τ, text threshold), same-label NMS at IoU 0.50, at most 100. If the specific phrase returns nothing, rerun the bare noun (seed + 1). `disp` and cand ids `c1..cn` run left to right.
- Score bands live in `PER_SCORE` (also on `LOGIC`) so M5 can retune them: `full`, `specific`, `noun`, `confusable` (fork↔spoon, cup↔bottle), `other`, plus `missP`.
- `proposeQuestions` — enumerate colour / size / material / handle / lid, one median left/right split, one median near/far split, and "next to a category". Both branches non-empty. Complement partitions merge. History (keys) blocks a repeat. K proposals are a seeded draw. Wording has no ids, digits, scores, or boxes ("Is it the orange one?", "Does it have a handle?", "Is it on the left side?", "Is it the one next to the bottle?").
- `validateProp` — Eq. 3: exhaustive, disjoint (a repeated id counts), legal, wording.
- `repairProp` — the key rewrites the branch and the text when the slip is unambiguous. `fallbackProp` — most balanced label or position cut; the four flags hold even for one candidate.
- `efe` — Eq. 11, natural log, zero-mass terms omitted. `updateState` — Eq. 4, a subset of S, no reintroduction. The loop stops at |S| ≤ 1.
- `selectProp` — `firstQ`, `randomQ`, `vlmQ` (salience, ignores G), `activask` (argmin G, earlier proposal wins ties).
- `operatorAnswer` — key evaluated on the intended object; with probability ε the answer flips.
- `runTrial` — Trial fields: `scene` (id), `instr` (text), `target`, `policy`, `eps`, `S0`, `rounds`, `resolved`, `outcome`, `questions`. Non-clarifying: `top` (highest score, then disp), `random` (uniform in S0), `directVLM` (modifier overlap, then score). Outcome `none` when S0 is empty, `unresolved` when the loop empties S or cannot split, `correct` / `wrong` when one candidate remains.

## Checks

`npm test`: **68 passed, 0 failed** (perception 13, clarify 39, contracts 16).

`npm run perturb`: **all 10 caught** (3 perception, 3 clarify, 4 contracts already in the tree).

Perception perturbations: threshold comparison flipped, left-to-right order reversed, broad-noun fallback removed.

Clarify perturbations: `Math.log` → `Math.log2` in `efe`, argmin G → argmax, yes/no branches swapped.

No browser. This task is logic only, so there are no console errors and no screenshots.

## Numbers (twin, simulated)

Synthetic offline-like mix in the perception test: 36 scenes, 216 trials, 2 clear / 2 partial / 2 ambiguous per scene, modifiers limited to colour, size, and material. Not the real `SCENES` module.

| | this run | paper |
|---|---|---|
| mean \|S0\| | 2.463 | 2.49 |
| range | 1–6 | 0–8 |
| multi-candidate | 63.0% | 46.1% |
| clear | \|S0\| 1.64, multi 25% | |
| partial | \|S0\| 1.86, multi 64% | |
| ambiguous | \|S0\| 3.89, multi 100% | |

Six-candidate states, 30 seeds × 6 targets (180 drives), a balanced proposal present every round:

- ActivAsk mean questions **2.667** (ideal 2.667, paper at \|S0\|=6 is 2.700)
- firstQ **3.333**, randomQ **3.189**

500 trials, ε = 0, target inside S0, 6 cups with distinct colours: firstQ, randomQ, vlmQ, activask **500/500 correct**. top **0.154**, random **0.158**, mean of 1/\|S0\| **0.175**.

ε = 0.2 on the same scene, ActivAsk, 200 seeds, slip 0: **114/200 = 57.0%** correct versus **184/200 = 92.0%** at ε = 0. The paper's ActivAsk figure at ε = 0.2 is 65.62% on a different 98-trial mix. `runTrial` matches exactly across two calls with the same seed.

## Example dialogues

Scene `syn-6`: six cups in a row (black, green, orange, red, white, yellow). The three on the left are large and have a handle. Instruction "pick up my cup". ε = 0, slip = 0.

Trial A — ActivAsk, seed 7, target o4 (red, no handle). \|S0\| = 6. Correct, 2 questions.

- \|S\| = 6. "Does it have a handle?" no
- \|S\| = 3. "Is it the red one?" yes → c4 / o4

Trial B — firstQ, same seed and target. Correct, 4 questions.

- "Is it the green one?" no
- "Is it the black one?" no
- "Is it the orange one?" no
- "Is it the red one?" yes → c4 / o4

Trial C — ActivAsk, seed 2, target o2 (green, handle). \|S0\| = 6. Correct, 3 questions.

- "Does it have a handle?" yes
- "Is it the black one?" no
- "Is it the green one?" yes → c2 / o2

## Decisions

- Detector query ignores handle and lid. A "cup with a lid" phrase is the bare noun `cup`, then `matches` still uses the lid for the operator.
- A bare-noun true match (`full`) scores higher than a fully-matching modified phrase (`specific`). Modified prompts miss more often, which is what pulls partial \|S0\| down toward 2. `missP` applies only to the bare-noun tier.
- Noun-only scores stay under τ. False positives are the confusable tail (about 15% of those draws clear τ).
- The projected box is the nominal body from `dimsOf`. The 2 cm handle spur used by `footprint` is not in the eight corners.
- The K-set is a seeded sample of the enumerated pool. If that sample misses every maximally balanced partition, the last slot is replaced by one. ActivAsk still chooses only inside the K it is shown. Without this, a uniform draw of 4 from a pool full of 1-versus-rest colour questions misses the ideal split often enough that the \|S0\| = 6 mean leaves the 2.667 ± 0.1 band. The paper's own gap at \|S0\| = 6 is +0.033.
- History stores keys, so a new spatial threshold can be asked even when the sentence ("Is it on the left side?") repeats.
- `directVLM` and `vlmQ` heuristics are in the comment block at the top of `14-clarify.js`.
- `runTrial` records `scene` as the scene id and `instr` as the instruction text.

## TODO-SOURCE

- `PER_SCORE` bands and `missP`. The paper does not publish per-tier score distributions.
- Bare-noun prompts treated as easier to ground than modified phrases.
- `CL_NEAR_M = 0.22` for "next to".
- How the VLM draws its K proposals, and the directVLM / vlmQ stand-ins (the paper uses MiMo-VL-7B).

## Open questions for the lead

- M5 should refit `PER_SCORE` on the real 36 scenes. On this synthetic mix the mean is already 2.463 against 2.49, but the multi-candidate rate is 63% against 46.1%. With one third of trials ambiguous and high bare-noun recall, those trials are almost all multi-candidate, so 46% is not reachable without dropping a lot of partial detections or changing the trial mix. The range here is 1–6: a total miss falls back to the noun, and `other` never clears τ, so 0 and 8 do not show up.
- Confirm `Trial.scene` / `Trial.instr` as id and text. Easy to store the objects instead if the experiment module wants them on the record.
- Confirm handle and lid stay out of `buildQuery`.
