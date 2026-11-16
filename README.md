# ActivAsk Twin

ActivAsk (Yang, Haddon-Hill, Zielinska and Murata, *Robotics* 15(8):154, 2026,
[mdpi.com/2218-6581/15/8/154](https://www.mdpi.com/2218-6581/15/8/154)) is a clarification policy for a
robot that is told "pick up my cup" when several objects fit the words. It builds an open-vocabulary set of
candidates, asks a yes/no question chosen by expected free energy, and shrinks the set with the answer. It
grasps only after one candidate remains.

The twin is a browser model of that loop on a Hello Robot Stretch 3: the same decision rules and the same
experimental protocol, with perception, the vision-language model and grasp contact simulated. Every twin
number below was computed from the built logic (`runBatch`, `epsSweep`, `kSweep`) and is the simulated mean,
shown beside the paper's measurement. A line-by-line inventory is in
[docs/FIDELITY.md](docs/FIDELITY.md).

Live page: https://sergiudanstan.github.io/activask-twin/

## What the twin shows

The stage is a tabletop cell. The origin sits on the floor under the table centre, z points up, and the robot
stands on the near side. The table is 1.20 × 0.70 m with the top at 0.74 m. On first load the table holds a
fixed eight-object demo (cups, bottles, a fork and a spoon). Experiment batches instead lay out the 56 scenes
in `src/js/11-scenes.js` (36 offline, 20 online).

The robot is a Stretch 3, sized from Hello Robot's guide, datasheet, gripper page and URDF
(`src/js/16-kinematics.js`) and posed by `src/js/40-stretch.js`. The head carries a RealSense D435i. Perception
and the camera share one pinhole: 640 × 360, 69° × 42°, pose `CAM_POSE`, projection `camProject`. Candidate
boxes are that projection. `stretchHeadCam()` is the same optical centre on the model.

A clarifying trial is a short dialogue. The detector proposes one box per object, keeps those at or above
τ = 0.38, and suppresses overlaps. The policy then asks up to K = 4 yes/no questions about colour, size,
material, handle, lid or position. ActivAsk picks the question with the lowest expected free energy under a
uniform belief. The simulated operator answers from the intended object. The candidate set shrinks to the
matching branch and the robot stops at one object, or when none remain. The Experiments panel summarises
those dialogues against the paper. The Clarify panel is the slot for the question text and the candidate
chips; that body is filled by the UI work, which is still open.

Grasp, in the online protocol, is a second stage: a wrong, unresolved or empty target is not executed, and an
executed grasp succeeds with the paper's rate for that object category. The arm path itself (pregrasp,
descend, close, lift, retract) is specified in `docs/SPEC.md` §3.3 and is not animated in this build. The
Grasp panel is on the rail for that motion.

<!-- screenshots -->

## How to use

Open `index.html` after `npm run build` (three.js loads from a CDN), or use the live page.

The header chooses who answers.

- **Auto** (the default) uses the simulated operator, which answers from the hidden target. It opens the Live
  and Clarify panels.
- **Interactive** is the mode in which a person answers. `?mode=interactive` selects it, and the button does
  the same. It opens Clarify and Camera. Yes/No buttons are part of the UI module, which is not in this tree
  yet, so the switch currently chooses the panels and the mode flag.

Keys, when the focus is not in a field: **Space** plays and pauses. **1** Room, **2** Iso, **3** Robot,
**4** Table, **5** Top, **6** User. Drag rotates, right-drag pans, the wheel zooms. The transport has restart,
½× / 1× / 2× / 4×, Loop and HQ.

`?panels=` opens a comma-separated set and closes the others. The names are `live`, `clarify`, `camera`,
`grasp`, `exp` and `report`. Example: `?panels=exp,report`. On a narrow window the drawer starts closed.

`?demo=grasp` is the query the grasp demonstration is specified to use (lay out the first scene and play the
waypoint sequence). This page does not read `demo`. `planGrasp` and `graspWaypoints` are not in the tree yet.

The Experiments panel has set, seed, ε, K and slip, **Run batch**, and **Copy batch CSV**. The seed box runs
one batch and draws it as detail. The Paper-vs-twin header states that the twin column is the 5-seed mean
of 216 trials per policy per seed. That column stays put when you run another seed. Headline protocol:
seeds 1–5, ε = 0, K = 4, slip = 0.05.

## Results

Twin cells are the unweighted mean of seeds 1, 2, 3, 4 and 5. Each offline seed is 216 trials per policy,
so the offline twin column is the 5-seed mean of 216 trials per policy per seed (1512 trials a policy).
Each online seed is 57 trials per policy on the four online policies. ε = 0, K = 4, slip = 0.05, except the
noise sweep and the K sweep, which vary that one factor. Percentages and question counts are rounded to two
decimals; expected free energy is rounded to three. The five offline batches took 0.17 s in Node.

Slip is the probability that a proposed question is damaged (a candidate dropped, duplicated, or an id leaked
into the text) and then repaired. Each proposal keeps `raw`, the four validity flags from before that repair,
and `valid`, the flags after it. They are equal when slip does not fire. `repaired` and `fallback` record
which rewrite ran. Slip 0.05 is a twin assumption (`docs/SPEC.md` §3.2).

### Calibrated

The detector score bands were fitted to mean \|S0\| and the multi-candidate rate. Agreement on those two
rows is by construction.

| Row | Paper | Twin mean | |
|---|---:|---:|---|
| Mean \|S0\| | 2.49 | 2.48 | calibrated |
| Multi-candidate rate | 46.10% | 46.57% | calibrated |

The asked rates below are the four clarifying policies. The paper column is derived, not the published cell:
the published pooled rate (all seven methods) times 7/4, because the three policies that never ask pull the
pooled rate down. Clear 1.79 × 7/4 = 3.13, partial 26.64 × 7/4 = 46.62, ambiguous 52.37 × 7/4 = 91.65.
The fit target in `src/js/13-perception.js` is about 3 / 47 / 92. The twin values are the five-seed means.
Clear is 2.22 against the derived 3.13, a residual of −0.91 points, 29% low. That is not agreement.
Partial is +1.16 points. Ambiguous is −1.93 points.

| Row | Derived paper (pooled × 7/4) | Twin mean | |
|---|---:|---:|---|
| Asked rate, clear | 3.13 (1.79 × 7/4) | 2.22 | fitted, −0.91 pt, 29% low, not agreement |
| Asked rate, partial | 46.62 (26.64 × 7/4) | 47.78 | fitted, +1.16 pt |
| Asked rate, ambiguous | 91.65 (52.37 × 7/4) | 89.72 | fitted, −1.93 pt |

### Offline policies (out of sample)

Paper column: Table 5, accuracy with the published Wilson 95% interval, asked rate, mean questions on all
trials, mean questions on asked trials. Twin column: the five-seed mean. `–` is a policy that never asks.

| Policy | Paper acc % | Twin acc % | Paper asked % | Twin asked % | Paper Q all | Twin Q all | Paper Q asked | Twin Q asked |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Top score | 53.70 (47.05–60.23) | 60.00 | 0.00 | 0.00 | 0.00 | 0.00 | – | – |
| Random candidate | 53.24 (46.59–59.78) | 54.72 | 0.00 | 0.00 | 0.00 | 0.00 | – | – |
| Direct VLM | 53.70 (47.05–60.23) | 60.37 | 0.00 | 0.00 | 0.00 | 0.00 | – | – |
| First question | 91.20 (86.67–94.30) | 86.85 | 46.76 | 46.57 | 1.11 | 0.99 | 2.37 | 2.12 |
| Random question | 90.74 (86.13–93.93) | 86.85 | 46.76 | 46.57 | 1.12 | 0.94 | 2.39 | 2.02 |
| VLM question | 92.13 (87.76–95.03) | 86.85 | 47.22 | 46.57 | 1.09 | 0.98 | 2.30 | 2.10 |
| ActivAsk | 92.13 (87.76–95.03) | 86.85 | 48.15 | 46.57 | 0.92 | 0.89 | 1.91 | 1.92 |

The batch is paired (all policies see the same scene, instruction, target and layout), so the four clarifying
policies have identical accuracy and asked rate by construction; only their question counts can differ.

### Instruction type (out of sample)

Paper Sec. 5.1, all methods pooled. The twin column pools the same seven policies, then averages the five
seeds. Asked rate by type is the fitted table above, with its residual; this table is accuracy and questions on asked trials.

| Type | Paper acc % | Twin acc % | Paper Q asked | Twin Q asked |
|---|---:|---:|---:|---:|
| Clear | 96.02 | 99.44 | – | 1.00 |
| Partial | 69.38 | 60.95 | 1.30 | 1.01 |
| Ambiguous | 60.47 | 63.53 | 2.75 | 2.61 |

### Scene family (out of sample)

Paper Sec. 5.1, accuracy by family, all methods pooled.

| Family | Paper acc % | Twin acc % |
|---|---:|---:|
| Bottles | 75.74 | 75.24 |
| Cups | 74.02 | 72.06 |
| Mixed | 80.58 | 78.15 |
| Utensils | 71.39 | 73.12 |

### Questions by initial candidate count (out of sample)

Mean questions on asked trials with \|S0\| from 2 to 6. Ideal is the paper's optimal binary-partition
reference. Across five seeds the twin has 177 asked trials at \|S0\| = 2, 24 at 3, 114 at 4, 17 at 5 and 104
at 6, so the \|S0\| = 3 and \|S0\| = 5 cells are thin.

| \|S0\| | Ideal | Paper first | Twin first | Paper random | Twin random | Paper VLM | Twin VLM | Paper ActivAsk | Twin ActivAsk |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 1.00 | 1.00 | 1.00 | 1.05 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| 3 | 1.67 | 1.91 | 1.52 | 1.91 | 1.32 | 1.91 | 1.52 | 1.73 | 1.52 |
| 4 | 2.00 | 2.17 | 2.18 | 2.44 | 2.17 | 2.22 | 2.18 | 2.06 | 2.02 |
| 5 | 2.40 | 2.67 | 2.22 | 3.00 | 2.52 | 2.00 | 2.22 | 2.33 | 2.37 |
| 6 | 2.67 | 3.45 | 3.24 | 3.16 | 2.70 | 3.55 | 3.16 | 2.70 | 2.68 |

### Answer noise (out of sample)

Accuracy against the probability ε that the operator flips an answer. The paper reports N = 98 trials per
policy. The twin sweep uses the same grid and the same N, kept only when \|S0\| ≥ 2 and the intended object
is already a candidate, then averaged over the five seeds.

| ε | Paper first | Twin first | Paper random | Twin random | Paper VLM | Twin VLM | Paper ActivAsk | Twin ActivAsk |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 98.98 | 100.00 | 93.88 | 100.00 | 96.94 | 100.00 | 98.98 | 100.00 |
| 0.05 | 87.78 | 90.82 | 82.92 | 90.82 | 86.40 | 90.82 | 89.68 | 92.04 |
| 0.10 | 77.75 | 79.18 | 73.14 | 80.20 | 76.96 | 79.18 | 81.05 | 80.82 |
| 0.15 | 68.78 | 70.61 | 64.39 | 71.43 | 68.50 | 70.82 | 73.05 | 72.24 |
| 0.20 | 60.76 | 62.86 | 56.58 | 63.67 | 60.90 | 63.47 | 65.62 | 65.31 |

### Proposal count K (out of sample)

Sec. 5.3. Mean minimum expected free energy of the proposals ActivAsk is shown, on ambiguous and partial
instructions, at K = 1..5. Lower (more negative) is a more balanced split; −ln 2 ≈ −0.693 is a perfect half.
The paper also reports the VLM's latency, which this twin does not simulate.

The draw is K distinct partitions, uniform from the enumerated pool. ActivAsk minimises G inside that draw, so
a larger K can only improve the best split. A previous build inserted the most balanced partition into every
draw; that made K irrelevant and has been removed (`src/js/14-clarify.js`).

| K | Paper ambiguous | Twin ambiguous | Paper partial | Twin partial | Paper latency (s) |
|---:|---:|---:|---:|---:|---:|
| 1 | −0.649 | −0.628 | −0.664 | −0.692 | 3.49 |
| 2 | −0.655 | −0.661 | −0.661 | −0.692 | 5.43 |
| 3 | −0.656 | −0.673 | −0.674 | −0.692 | 6.97 |
| 4 | −0.669 | −0.678 | −0.675 | −0.692 | 8.37 |
| 5 | −0.670 | −0.680 | −0.681 | −0.692 | 10.42 |

### Online

Twenty scenes, 57 trials per policy (19 of each instruction type), policies Top score, Random, VLM question
and ActivAsk. Target accuracy is whether the dialogue names the intended object, and it is out of sample.
Grasp % and full-task % are sampled from the paper's category rates (not out-of-sample): an executed attempt
succeeds when a uniform draw falls under `PAPER.graspByCat` for that object's category, keyed by the trial
seed rather than by the policy. Full task is that success over all 57 trials, so it inherits the same draw.
Attempts and not-executed are twin counts. The twin cells are means over the five seeds.

| | Top score | Random | VLM question | ActivAsk |
|---|---:|---:|---:|---:|
| Paper target % | 59.65 (46.70–71.38) | 61.40 (48.43–72.94) | 91.23 (81.06–96.19) | 92.98 (83.30–97.24) |
| Twin target % (out of sample) | 59.65 | 55.44 | 88.07 | 88.07 |
| Paper attempts | 34 | 35 | 52 | 53 |
| Twin attempts | 34.0 | 31.6 | 50.2 | 50.2 |
| Paper grasp % | 88.24 (73.38–95.33) | 82.86 (67.32–91.90) | 88.46 (77.03–94.60) | 94.34 (84.63–98.06) |
| Twin grasp % (sampled from the paper's category rates, not out-of-sample) | 90.71 | 91.63 | 90.86 | 90.86 |
| Paper full task % | 52.63 (39.92–65.01) | 50.88 (38.26–63.38) | 80.70 (68.66–88.87) | 87.72 (76.75–93.92) |
| Twin full task % (sampled from the paper's category rates, not out-of-sample) | 54.04 | 50.88 | 80.00 | 80.00 |
| Paper not executed | 23 | 22 | 5 | 4 |
| Twin not executed | 23.0 | 25.4 | 6.8 | 6.8 |
| Paper Q asked | – | – | 2.25 | 1.84 |
| Twin Q asked | – | – | 2.08 | 1.88 |

VLM question and ActivAsk share target accuracy, attempts, grasp and full-task rate on a paired batch. Their
question counts still differ. Which numbers sit close to the paper, and which do not, is written up in
[docs/FIDELITY.md](docs/FIDELITY.md).

## Limitations

Perception is a scored stand-in for GroundingDINO, not the detector. Mean \|S0\| and the multi-candidate
rate are the rows the bands were fitted to. The clarifying asked rate by type was a fit target; clear
misses the derived rate by 0.91 points.

Questions are enumerated from visible attributes and drawn uniformly. Direct VLM and the VLM-selected question
are salience rules. The paper's picks come from MiMo-VL-7B.

The batch is paired, so the clarifying policies cannot reproduce the small accuracy gaps between them in
Table 5.

Grasp contact is not simulated. An executed attempt succeeds with the paper's rate for that category
(cup 96.61%, bottle 85.25%, fork 80.77%, spoon 89.29%). Grasp % and full-task % are sampled from those
rates. They are not an out-of-sample prediction of the paper's per-policy grasp column.

## Development

```sh
npm install
npm test                 # builds index.html from src/ and runs the logic checks
npm run perturb          # every mutation of the logic block must be caught
node tools/shots.mjs --port 8799 --view iso,table,robot --t 1 --out _shots/docs
```

`index.html` is generated by `tools/build.mjs`. Edit `src/` and rebuild. One Chrome at a time
(lock `/tmp/at-chrome.lock`). `docs/SPEC.md` is the contract.

Modules (`docs/SPEC.md` §6). Files in `src/js/` are concatenated in lexical order into one scope, so each
module prefixes its private names.

| File | Prefix | Public names |
|---|---|---|
| `10-contracts.js`, `12-paper.js`, `19-logic-end.js` | – | data contracts, `PAPER` |
| `11-scenes.js` | `sc` | `SCENES`, `INSTRUCTIONS` |
| `13-perception.js` | `per` | `buildQuery`, `matches`, `detect`, `initialCandidates` |
| `14-clarify.js` | `cl` | `proposeQuestions`, `validateProp`, `repairProp`, `fallbackProp`, `efe`, `updateState`, `selectProp`, `operatorAnswer`, `runTrial` |
| `15-experiments.js` | `ex` | `runBatch`, `wilson`, `summarize`, `epsSweep`, `kSweep` |
| `16-kinematics.js` | `kin` | `STRETCH` (grasp IK is specified, not in this tree) |
| `25-objects.js` | `obj` | `makeObject` |
| `26-room.js` | `lab` | room, table, lights |
| `40-stretch.js` | `stretch` | `setStretch`, `stretchHeadCam` |
| `41-grasp.js` | `grasp` | not in this tree |
| `page.html`, `00`, `20`–`22`, `50`, `60`, `67`, `70` | – | shell, views, experiments panel, loop |

Workers each have a worktree `~/code/activask-twin-wt/<name>` on `feat/<name>`. A worker edits only the files
the task names, plus that task's report, runs the checks, and commits on the branch. The lead merges and
pushes. The board is [docs/COORDINATION.md](docs/COORDINATION.md).

## Credits

Yang, Haddon-Hill, Zielinska and Murata, ActivAsk: Free-Energy-Guided Clarification for Robotic Grasping Under
Ambiguous Instructions, *Robotics* 2026, 15(8), 154.

Stretch 3 geometry and joint limits are Hello Robot's, cited in `src/js/16-kinematics.js`: the Stretch 3
hardware guide and the datasheet image (rev 2.14.2024) in `hello-robot/stretch_hardware_guides`, the Stretch
Gripper 3 specifications at hello-robot.com, and the uncalibrated URDF in `hello-robot/stretch_forcesight`.
The paper's robot is the same Stretch 3 with a D435i.
