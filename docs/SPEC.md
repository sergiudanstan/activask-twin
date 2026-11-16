# ActivAsk Twin: specification and module contracts

Browser digital twin of **ActivAsk** (Yang, Haddon-Hill, Zielinska, Murata, *Robotics* 15(8):154, 2026,
https://www.mdpi.com/2218-6581/15/8/154). A Hello Robot **Stretch 3** with a head-mounted **RealSense D435i**
gets an instruction such as "pick up my cup" that can match several objects. It builds open-vocabulary
candidates, asks candidate-grounded yes/no questions chosen by **expected free energy (EFE)**, updates the
candidate set from each answer, and grasps only after one target remains.

**Honesty rule.** The twin reproduces ActivAsk's *decision logic* exactly (candidate state, validation, EFE,
deterministic update, policies) and its experimental protocol. Perception (GroundingDINO, SAM), the VLM
(MiMo-VL-7B) and grasp physics are **simulated** with documented rules. Every simulated number is labelled
"twin (simulated)" and shown next to the paper's measured number (`PAPER` in `src/js/12-paper.js`). Never
present a twin number as the paper's. Facts that are not in the paper or in a cited source are written
`TODO-SOURCE` in a code comment, never invented.

## 1. Frame, units, conventions

- Metres, radians, seconds. **Cell frame**: z up, origin on the floor under the table-top centre, x along the
  table (left to right as the head camera sees it), y away from the robot. three.js gets it through
  `world` (rotated −90° about x): cell (x, y, z) → scene (x, z, −y). Camera views use `cv()` (`50-views.js`).
- Table: `TABLE` (1.20 × 0.70 m, top at z = 0.74). Objects stand on the top, positions from `layoutScene`
  (footprints from `footprintDiscs`). A fork or spoon lies flat with its **length along its local x axis**
  (yaw 0 = along cell x, tines/bowl toward +x); cups and bottles are round about their local z axis, a cup's
  handle points along local +x.
- Robot: `ROBOT.base` on the −y side. It drives along x, the telescoping arm extends along +y over the table.
- Head camera: `CAM` (640 × 360, 69° × 42°, D435i colour FOV) at `CAM_POSE` (position + look-at point);
  `camProject(p)` is the pinhole projection to pixels. Perception boxes and the rendered head view must agree.
- Everything on screen is a **pure function of the trial and of time t**. Same seed, same scene, same trial.
- Code: plain ES2022, 2-space indent, double quotes, semicolons, no dependencies besides three r186 (CDN).
  All `src/js/*.js` files are concatenated into one module scope by `tools/build.mjs`, so every module-scope
  name must be unique: **prefix your module-scope names** with your module prefix (table in §6).

## 2. Data contracts (`src/js/10-contracts.js`, lead-owned)

```
Object  { id:"o3", cat:"cup"|"bottle"|"fork"|"spoon", color, size:"small"|"medium"|"large", material,
          handle:bool (cups only), lid:bool (cups, bottles), x, y, yaw }      checkObject(o) -> [errors]
Scene   { id, set:"offline"|"online", family:"cups"|"bottles"|"utensils"|"mixed", objects:[Object] }
Instr   { text, type:"clear"|"partial"|"ambiguous", noun, mods:{color?,size?,material?,handle?,lid?}, matches:[obj ids] }
Cand    { id:"c2", disp:2, obj:"o3", label:"cup", score:0.61, box:[u0,v0,u1,v1] }
Prop    { text, yes:[cand ids], no:[cand ids], key, count:{total,yes,no}, valid:{exhaustive,disjoint,legal,wording}, G, vlmPick }
Round   { S:[cand ids], props:[Prop], sel, answer:"yes"|"no" }
Trial   { scene, instr, target, policy, eps, S0, rounds:[Round], resolved, outcome:"correct"|"wrong"|"unresolved"|"none", questions }
Segment { t0, t1, kind, label, q0, q1 }
```
`DIMS[cat][size]` gives nominal dimensions; `ATTRS` the allowed values; `PARAMS` the paper's thresholds
(τ = 0.38, text 0.30, NMS IoU 0.50, ≤ 100 detections, K = 4 proposals); `POLICIES` the seven policies.
`rng(seed)` is the only randomness allowed in logic (no `Math.random`).

## 3. Algorithms (what each logic module must do exactly)

### 3.1 Perception (`13-perception.js`, Sec. 3.3)
- **Query** from the instruction: noun + visible modifiers (colour, size, material). If the specific query
  returns no candidate, fall back to the broad noun query (recall first: never treat the most specific
  result as the answer).
- **Simulated detector**: one proposal per object with a score drawn from `rng` by match quality: matches noun
  and modifiers > matches noun only > confusable category (fork↔spoon, cup↔bottle) > other. Keep a small
  miss rate (a true match below τ) and false-positive rate (a confusable object above τ). Calibrate to the
  paper's offline statistics: mean |S0| ≈ 2.49 (range 0–8) and multi-candidate rate ≈ 46.1 %. Report the
  values you reach.
- **Candidates**: score ≥ τ, NMS at IoU 0.50 on the projected boxes (same label), at most 100;
  `box` = projection of the object's bounding box by `camProject`; `disp` = 1..n left to right in the image.
- `matches(obj, instr)`: ground truth used by the simulated operator (not by the policy).

### 3.2 Clarification loop (`14-clarify.js`, Sec. 3.4)
- **Proposals** (the VLM stand-in): from the current state S, enumerate yes/no questions over visible
  attributes (colour, size, material, handle, lid) and geometry (left/right of a split x, front/back of a split y,
  "next to a <cat>"). Keep only partitions with both branches non-empty, merge duplicate partitions, and order
  them deterministically. The round's proposal set is **K = 4** of them, drawn with `rng` (simulated VLM
  diversity), so ActivAsk chooses among K, not among all.
- `key` is a predicate any object can be tested with (`color=orange`, `handle=true`, `x<0.12`, `y>-0.05`,
  `near=bottle`). The simulated operator answers by evaluating `key` on the **intended target object**, so a
  target that perception missed still gets truthful answers (and the trial then ends wrong or unresolved).
- **Wording** (Sec. 3.4.2): natural text about visible properties only. Never ids, display numbers, scores,
  boxes, thresholds, IoU, or digits.
- **Validation** (Eq. 3): yes ∪ no = S (exhaustive), yes ∩ no = ∅ (disjoint), only current candidates (legal),
  wording OK. Simulate VLM slips with a small probability (default 0.05, twin assumption): drop a candidate,
  duplicate one, or leak an id. Then **repair** if unambiguous (the key decides the branch), otherwise replace
  with a **rule-based fallback** from labels and positions.
- **EFE** with uniform belief (Eq. 9–11): `p_yes = |Y|/|S|`, `p_no = |N|/|S|`,
  `G = p_yes·ln p_yes + p_no·ln p_no` (natural log, zero-mass terms omitted). Lower is better: a 2|2 split of 4
  gives −ln 2 = −0.6931, a 1|3 split gives −0.5623.
- **Update** (Eq. 4): S ← Y on "yes", S ← N on "no". Never reintroduce a candidate. Stop at |S| = 1
  (resolved) or |S| = 0 (unresolved).
- **Policies** (Table 3): `top` = highest score in S0; `random` = uniform in S0; `directVLM` = simulated
  direct pick (documented heuristic, no question); `firstQ` = first valid proposal; `randomQ` = uniform valid
  proposal; `vlmQ` = simulated "VLM-preferred" proposal (documented salience heuristic that ignores
  balance); `activask` = argmin G, ties broken by proposal order.
- **Operator**: answers truthfully from the target; with answer noise ε it flips the answer with probability ε.
- `runTrial(scene, instr, target, policy, {seed, eps, K})` returns a `Trial` (§2).

### 3.3 Grasp (`16-kinematics.js` math, `41-grasp.js` animation, Sec. 3.5)
- Compact objects (cup, bottle): centre-height slice, grasp centre at the slice centre, yaw from horizontal
  candidates (avoid the handle), opening = diameter + clearance.
- Slender objects (fork, spoon): PCA axis = object yaw, fingers close across the narrow dimension.
- Stretch IK for a top-down pose within joint limits: base translation x, lift z, arm extension y, wrist yaw
  (wrist pitched down). Waypoints: **pregrasp → descend → close → lift → retract**. Re-observe after a large
  base move.
- Physical success in the twin is sampled per category from the paper's online rates (`PAPER.graspByCat`),
  labelled simulated.

## 4. Experiments (`15-experiments.js`, Sec. 4)
Offline: 36 scenes, 216 trials per policy, near-equal clear / partial / ambiguous; online: 20 scenes, 57 trials
per policy (19 per type), the four online policies, grasp stage included. Per trial: draw an instruction of the
type from the scene pool, then draw the intended target uniformly among its `matches` (Sec. 4.1 protocol).
Report accuracy (Wilson 95 % CI), asked rate, mean Q (all and asked), questions vs |S0| beside the ideal
reference, the ε sweep, and online target / grasp / full-task rates, each beside `PAPER`.
**Calibrated vs out-of-sample.** The detector score bands are fitted so that mean |S0|, the multi-candidate rate
and the clarifying policies' asked rate by type match the paper; the UI labels those rows *calibrated* (agreement
there is by construction). Every other twin number is *out-of-sample*. The batch is paired (all policies see the
same scene, instruction, target and layout), so the clarifying policies have identical accuracy and asked rate by
construction; only their question counts can differ. Headline twin numbers are means over several seeds.

## 5. Scenes (`11-scenes.js`, Sec. 4.1)
Families: cups-only (6 cups), bottles-only (4 offline, 3 online), utensils (offline: 3 × four forks,
3 × four spoons, 3 mixed six-object scenes with fork:spoon 2:4, 3:3, 4:2; online: 2 × four forks, 2 × four
spoons, 1 × four forks + two spoons), mixed (8 objects: cups, two bottles, forks/spoons). Offline 36 scenes
(9 per family, twin assumption), online 20 (5 per family, twin assumption). Each scene has an instruction pool
of every type: clear = exactly one match; partial = a useful modifier that still matches ≥ 2; ambiguous =
category only ("pick up my cup"), matching every object of the category.

## 6. Module contracts

| File | Owner | Prefix | Public API (names other modules use) |
|---|---|---|---|
| `10-contracts.js`, `12-paper.js`, `19-logic-end.js` | lead | – | §2, `PAPER` |
| `11-scenes.js` | OpenCode | `sc` | `SCENES` (array of Scene without x/y/yaw), `INSTRUCTIONS` ({sceneId: [Instr]}) |
| `13-perception.js` | Codex | `per` | `buildQuery`, `matches`, `detect`, `initialCandidates` |
| `14-clarify.js` | Codex | `cl` | `proposeQuestions`, `validateProp`, `repairProp`, `fallbackProp`, `efe`, `updateState`, `selectProp`, `operatorAnswer`, `runTrial` |
| `15-experiments.js` | Codex | `ex` | `runBatch`, `wilson`, `summarize` |
| `16-kinematics.js` | Grok | `kin` | `STRETCH` (sourced specs), `planGrasp`, `stretchIK`, `graspWaypoints` |
| `25-objects.js` | Grok | `obj` | `makeObject(o)` → THREE.Group named `o.id` (origin at the base centre, cell frame) |
| `26-room.js` | Grok | `lab` | room, table (top exactly `TABLE`), lights placement |
| `40-stretch.js` | Grok | `stretch` | `setStretch(q)`, `stretchHeadCam()` → {pos, look} in the cell frame; q = {x, lift, arm, yaw, pitch, roll, grip, pan, tilt} |
| `41-grasp.js` | Grok | `grasp` | ticker that poses the robot and the held object from Segments |
| `page.html`, `00`, `20`–`22`, `50`, `60`, `70`, tests harness, tools | lead | – | shell, loop, `window.pc` |

Logic modules (10–19) publish with `Object.assign(LOGIC, { ... })`, use no DOM and no three.js, and are
tested in Node by `tests/<module>.test.mjs` (`export default (L, check) => {...}` plus
`export const perturbations = [{name, find, replace}]`, at least two per module, each must make a check fail).

Rules: touch only your files (plus your test file and `docs/tasks/<name>.report.md`); keep names in the API
column unchanged; no allocations inside per-frame tickers; animated objects get a stable `.name`; draw-call
budgets: room 60, objects 40, stretch 60.

## 7. Tools

```
npm test                 # build + logic checks, must end "all checks passed"
npm run perturb          # every perturbation must be CAUGHT
node tools/shots.mjs --port <port> --view iso,table,robot --t 1 --out _shots/<name>   # 0 console errors required
node tools/shots.mjs --port <port> --cam x,y,z --target x,y,z --clean --out _shots/<name>-macro   # cell frame close-up
```
`tools/shots.mjs` serves the folder, opens headless Chrome (macOS path by default, override `CHROME_PATH`),
waits for `window.pcReady`, and exits 1 on any console error. One Chrome at a time
(lock `/tmp/at-chrome.lock`).
