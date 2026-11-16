# Fidelity inventory

What a reviewer can check against `src/js`, one claim per line. Equation numbers are the ones the source
comments attribute to Yang, Haddon-Hill, Zielinska and Murata, *Robotics* 15(8):154 (2026). "Exact" means the
source implements the rule the paper states. "Calibrated" means a free parameter was fitted to a published
statistic, so matching that statistic is not evidence. "Simulated / assumed" means the twin supplies a fact
the paper does not.

The out-of-sample numbers at the end are the mean of seeds 1–5 from `runBatch`, `epsSweep` and `kSweep` on
this tree (ε = 0, K = 4, slip = 0.05 unless that factor is the one being swept). Unrounded means are in
`docs/tasks/docs.report.md`.

## 1. Exact

Thresholds, Appendix A / Sec. 3.3, in `src/js/10-contracts.js:19-26`:

- Box threshold τ = 0.38 (`PARAMS.tau`).
- Text threshold 0.30 (`PARAMS.textThr`).
- Non-maximum suppression at IoU 0.50 (`PARAMS.nmsIoU`).
- At most 100 detections (`PARAMS.maxDet`).
- K = 4 proposals in the main experiments (`PARAMS.K`).

Candidate keep, `src/js/13-perception.js:164-178`. A box is kept when its score is at least max(τ, 0.30).
Same-label boxes overlapping at IoU ≥ 0.50 lose to the higher score. The list stops at 100. Display numbers
run left to right in the image (`src/js/13-perception.js:181-183` and `:221`).

Query, Sec. 3.3. `buildQuery` (`src/js/13-perception.js:49-59`) sends the noun plus size, colour and material.
Handle and lid stay out of that string. If the specific phrase returns no candidate, `initialCandidates`
(`src/js/13-perception.js:214-220`) runs the bare noun. `matches` (`src/js/13-perception.js:62-70`) is the
operator's ground truth: the noun category, then every modifier.

Validation, Eq. 3, `validateProp` in `src/js/14-clarify.js:87-102`. Exhaustive: yes ∪ no = S. Disjoint: no id
repeated. Legal: no id from outside S. Wording (`src/js/14-clarify.js:21-29`): the text has no digit and no
mention of score, IoU, threshold, box, pixel, candidate or id. `valid` stores those four flags
after repair. `raw` stores the same four flags on the proposal the simulated VLM produced, before
repair, and equals `valid` when nothing was damaged (`src/js/14-clarify.js:130-143` and `:323`).
`repaired` and `fallback` (`src/js/14-clarify.js:318-321`) say which rewrite ran.

Expected free energy, Eq. 11, uniform belief, `efe` in `src/js/14-clarify.js:106-119`.
p_yes = \|Y\|/\|S\|, p_no = \|N\|/\|S\|, G = p_yes·ln p_yes + p_no·ln p_no, natural log, zero-mass terms
omitted. Lower is better. A 2\|2 split of 4 has G = −ln 2.

Update, Eq. 4, `updateState` in `src/js/14-clarify.js:354-359`. "Yes" keeps Y, "no" keeps N, and an id that
was not in S is not reintroduced. The loop (`src/js/14-clarify.js:471-484`) stops at one candidate
(resolved) or at an empty set or an empty proposal list (unresolved). A guard of 24 rounds
(`src/js/14-clarify.js:471`) is a backstop; the paper's stop is the empty or singleton set.

Policies, Table 3. Names and the clarifies / offline / online flags are `src/js/10-contracts.js:138-146`.

- Top score (`src/js/14-clarify.js:460-463`): highest detector score in S0, tie broken by the earlier display
  number. No question.
- Random candidate (`src/js/14-clarify.js:456-459`): uniform draw in S0. No question.
- First question (`src/js/14-clarify.js:386`): the first proposal in the list `proposeQuestions` returns.
  That list is sorted by key (`src/js/14-clarify.js:330`), so "first" is the lowest key among the K that were
  drawn.
- Random question (`src/js/14-clarify.js:387-390`): uniform among the valid proposals in that list.
- ActivAsk (`src/js/14-clarify.js:392-396`): lowest G. A tie keeps the earlier proposal, which is key order
  after the sort above.

Direct VLM and the VLM-selected question are the heuristics in §3, not MiMo-VL-7B.

Operator, `src/js/14-clarify.js:401-406`. The answer is the key evaluated on the intended object, including
when perception missed that object. With probability ε the answer flips.

Repair, `src/js/14-clarify.js:151-163`. When a damaged proposal still has a parsable key that splits S, the
key rewrites the branches and the wording. Otherwise `fallbackProp` (`src/js/14-clarify.js:339-352`)
substitutes the most balanced enumerated partition, tie broken by key order. The pre-repair flags stay on
`raw` (`src/js/14-clarify.js:323`).

Dialogue history, Sec. 3.4.1, `src/js/14-clarify.js:292-306`. A key already asked is not offered again. A new
partition whose wording was already used is prefixed "Of the ones left, "
(`src/js/14-clarify.js:327`).

Protocol, Sec. 4 and Sec. 4.1, `src/js/15-experiments.js`.

- One schedule is shared by every policy (`src/js/15-experiments.js:177-189`), so the batch is paired on
  scene, instruction, target and layout.
- Trial i takes instruction type clear, partial, ambiguous, clear, … and the scene is round-robin inside that
  cycle (`src/js/15-experiments.js:42-56`). The instruction is drawn from that scene's pool of the type, and
  the target is uniform among its matches.
- Offline default: 216 trials per policy, all seven policies (`src/js/15-experiments.js:185-186`). That is 72
  of each type and six passes over each of the 36 offline scenes.
- Online default: 57 trials per policy, 19 of each type, and only the four policies flagged `online: true`
  (`src/js/15-experiments.js:185-186`, flags at `src/js/10-contracts.js:138-146`).
- Wilson 95% interval, z = 1.96 (`src/js/15-experiments.js:18-29`). `wilson(199, 216)` is the paper's
  ActivAsk interval [87.76, 95.03].
- A wrong, unresolved or empty target is not executed (`src/js/15-experiments.js:77-78`).
- The noise sweep uses ε ∈ {0, 0.05, 0.10, 0.15, 0.20} and N = 98, on the four clarifying policies, and it
  keeps a trial only when \|S0\| ≥ 2 and the target is inside S0 (`src/js/15-experiments.js:205-224`).
- The K sweep reports mean minimum proposal G on ambiguous and on partial instructions at K = 1..5
  (`src/js/15-experiments.js:251-283`).

Waypoint order. `docs/SPEC.md` §3.3 specifies pregrasp → descend → close → lift → retract, and a re-observe
after a base move larger than the grasp module's threshold. `planGrasp`, `stretchIK` and `graspWaypoints` are
not in this tree. `src/js/16-kinematics.js` publishes `STRETCH` only. There is no line to cite for the motion.

## 2. Calibrated

`src/js/13-perception.js:4-8` states the fit. The paper does not publish per-tier score distributions
(TODO-SOURCE on line 4). The bands were refit on the 36 offline scenes to three targets: mean \|S0\| = 2.49,
multi-candidate rate = 46.1%, and clarifying asked rate by type about 3% / 47% / 92%. Mean \|S0\| and the
multi-candidate rate land on those targets: the five-seed means are 2.476 and 46.57%. The asked-rate
targets are not the published cells. The paper pools all seven methods (clear 1.79, partial 26.64,
ambiguous 52.37). Three methods never ask, so the clarifying equivalent is that pooled rate × 7/4:
3.1325 / 46.62 / 91.6475. The five-seed clarifying rates are 2.222 / 47.778 / 89.722. Clear is 0.91 points
under its derived target, about 29% low. That residual is not agreement. Partial is 1.16 points over.
Ambiguous is 1.93 points under. The panel prints the derivation and the residual and does not say
agreement by construction for those rows.

`PER_SCORE` is `src/js/13-perception.js:28-41`. A score is uniform inside the band. Two draws are taken per
object so the miss coin does not shift the stream (`src/js/13-perception.js:92-99`).

| Name | Lines | Band or value | Where it is used |
|---|---|---|---|
| `full` | 29 | 0.60–0.96 | Bare noun, category member with no failed modifier |
| `specific` | 30 | 0.64–0.97 | Best modified-phrase match. The band sits at or above τ |
| `rival` | 31 | 0.14–0.58 | Other phrase matches. The comment states P(score ≥ τ) = 0.455 before NMS |
| `noun` | 32 | 0.06–0.36 | Right category, a modifier fails. Always under τ |
| `confusable` | 33 | 0.02–0.30 | Specific phrase, fork↔spoon or cup↔bottle. Under τ |
| `other` | 34 | 0.01–0.18 | Specific phrase, any other category. Under τ |
| `broadConf` | 35 | 0.40–0.57 | Bare noun, confusable category. Above τ and below `full.lo` |
| `broadOther` | 36 | 0.33–0.58 | Bare noun, unrelated. The comment states P(score ≥ τ) = 0.80, and the top is still below `full.lo` |
| `missP` | 37 | 0.03 | Probability a bare-noun true match is drawn from the miss band |
| `missLo`, `missHi` | 38-39 | 0.05–0.37 | That miss band, under τ |
| `singleP` | 40 | 0.10 | Probability a bare-noun query keeps only its best category box |

Aliases: `PER_RIVAL` is `PER_SCORE.rival` (`src/js/13-perception.js:42`). `PER_BARE` is `PER_SCORE.singleP`
(`src/js/13-perception.js:43`). `PER_CONFUSABLE` (`src/js/13-perception.js:44`) is fork↔spoon and cup↔bottle.

Three rules sit on the bands. The header (`src/js/13-perception.js:8-22`) says what each one is for.

1. Specific phrase (`perSuppressRivals`, `src/js/13-perception.js:101-109`). Every modifier match is drawn,
   the highest is kept, and the others are redrawn from `rival`. Noun, confusable and other stay under τ on a
   specific phrase, so a clear instruction rarely gains a second candidate, and the bare-noun fallback runs
   only when the phrase matches nothing.
2. Bare noun (`perTier` / `perBand` / `perDrawScore`, `src/js/13-perception.js:72-99`). Category members draw
   from `full`, except a `missP` fraction from the miss band. Confusable categories draw from `broadConf`,
   unrelated objects from `broadOther`. Both loose bands top out below `full.lo`, so the top-score pick on a
   bare noun is a category member unless every member took the miss draw.
3. Bare-noun collapse (`perBareTop`, `src/js/13-perception.js:112-125`). With probability `singleP`, every box
   except the best category member is pushed under τ. The survivor is the argmax, so a top-score policy is
   unchanged. This is the knob that holds the ambiguous asked rate near 92% while the other ambiguous trials
   stay large enough for mean \|S0\| ≈ 2.49.

## 3. Simulated / assumed

Every `TODO-SOURCE` in `src/js` (7) and every comment that says "twin assumption" (4) or "Twin-assumed" (1).

`src/js/10-contracts.js:40-46` — object dimensions (twin assumption). Cups and bottles get a diameter and a
height; forks and spoons get a length, a head width and a thickness, three sizes each. The paper does not
publish the objects' sizes, and layout, the camera box and a later grasp width need a body. Removing it means
substituting the measured objects from the study.

`src/js/10-contracts.js:52-54` — table size (twin assumption). 1.20 × 0.70 m, top at 0.74 m, margin 0.06 m.
The paper gives no table. The comment calls this a typical service-robot test table, so the objects have a
surface and the robot has a near side. Removing it means using the authors' table.

`src/js/10-contracts.js:55-56` — image size. The comment says the D435i colour field is 69° × 42° and that the
paper does not state the resolution. The twin uses 640 × 360. Removing it means the resolution the study
recorded. The comment does not use the words "twin assumption"; it is the sentence that states the gap.

`src/js/10-contracts.js:59-62` — head pose (twin assumption). `CAM_POSE` is position (0, −0.66, 1.30) looking
at (0, −0.06, 0.74), the twin's realisation of "the tabletop fills the image while limiting arm occlusion"
(Sec. 4.1). The comment still says the height waits on M1. M1 has since recorded the URDF colour-optical
centre at z = 1.322 m (`src/js/16-kinematics.js:47-49`, "22 mm, inside 50 mm" of this pose). The pose was
left at 1.30 m. Removing the assumption means driving the pose from that optical centre and from the
authors' pan and tilt.

`src/js/11-scenes.js:2-6` — scene inventory (the comment says "Twin-assumed"). 36 offline scenes, 9 per
family, and 20 online scenes, 5 per family: cups (6), bottles (4 offline, 3 online), utensils in the ratios
`docs/SPEC.md` §5 gives, mixed (8). Each scene has two instructions of each type, 336 in all. The paper
reports 36 and 20 scenes and the family structure; it does not list the objects. Removing it means the
authors' scene list. `docs/SPEC.md` §5 calls the 9-per-family and 5-per-family counts a twin assumption.

`src/js/13-perception.js:4-8` — score distributions (TODO-SOURCE, and the comment calls the bands a twin
assumption). This is the calibrated section above. Removing it means GroundingDINO on the rendered images, or
bands fitted to a published histogram. The three target rows would then become out-of-sample evidence.

`src/js/13-perception.js:24-26` and `perScoreQuery` at `src/js/13-perception.js:185-195` — handle and lid in
the detector score (TODO-SOURCE). The paper does not publish the text prompt per attribute. A bare phrase
that still names a handle or a lid is scored as a specific match, even though `buildQuery` leaves those words
out of the detector string. Without that, "the cup with a lid" would score every cup. Removing it means the
authors' prompts, or accepting that those phrases detect the whole category.

`src/js/14-clarify.js:6-13` — direct pick and VLM-selected question (TODO-SOURCE). The paper uses
MiMo-VL-7B. The twin runs no VLM. `directVLM` ranks candidates by how many instruction modifiers the object
satisfies, then by category, then by detector score, then by earlier display number
(`src/js/14-clarify.js:413-425`). On an ambiguous instruction that rank collapses to the top score.
`vlmQ` ignores G and prefers a salient family in the order colour, handle, size, material, lid, near,
left/right, near/far (`src/js/14-clarify.js:17` and `:370-378`). A colour question is often a 1-versus-rest
split. Removing either heuristic means calling MiMo-VL-7B, or replaying the study's logged picks.

`src/js/14-clarify.js:15-16` — "next to" (TODO-SOURCE). `CL_NEAR_M` = 0.22 m, about two cup diameters on this
table. The paper never states a distance. The predicate is true when some other object of the named category
is within 0.22 m (`src/js/14-clarify.js:60-69`). Removing it means a distance the paper states, or dropping
"next to" questions.

`src/js/14-clarify.js:274-278` — which K questions are proposed (TODO-SOURCE). The paper says the VLM proposes
K questions and does not say how they are spread. `clSample` (`src/js/14-clarify.js:264-272`) draws K distinct
partitions uniformly from the enumerated pool. ActivAsk then chooses only inside that K, so a larger K raises
the chance of a balanced split (Sec. 5.3). An earlier version swapped the most balanced partition into every
draw; that made the K sweep flat and changed ActivAsk's questions on asked trials by 0.007, and it was
removed. Removing the remaining assumption means the VLM's own proposal distribution.

`src/js/14-clarify.js:279-289` and `:441` — invalid-proposal rate. With probability `slip` (default 0.05 in
`runTrial`, default 0 inside `proposeQuestions` itself) the twin drops a candidate, duplicates one, or leaks
an id into the text, then repairs or falls back. Each returned proposal keeps `raw` (the four flags before
that repair), `valid` (the flags after it), and the booleans `repaired` and `fallback`
(`src/js/14-clarify.js:311-323`). With slip 0, `raw` equals `valid`. With slip 0.3 some `raw` flags are false
while `valid` is all true. `docs/SPEC.md` §3.2 calls 0.05 a twin assumption. The source comment does not use
those words. Removing it means the study's rate of invalid proposals, or setting slip to 0 when the
comparison should assume well-formed questions.

`src/js/15-experiments.js:77-91` — grasp success. An executed attempt draws a uniform number and succeeds when
it falls under `PAPER.graspByCat` for the object's category (cup 96.61%, bottle 85.25%, fork 80.77%, spoon
89.29%). The draw is keyed by the trial seed, not by the policy. The paper's rates are real-robot
measurements; the twin's contact is this coin flip. The comment does not say TODO-SOURCE. `docs/SPEC.md`
§3.3 labels the sampling as simulated. Removing it means a contact model, or the study's per-attempt
outcomes. Grasp % and full-task % are this draw, so they are sampled from the paper's category rates
and are not an out-of-sample prediction. Only the online target accuracy is out-of-sample among those rates.

`src/js/16-kinematics.js:17` — base shell height (TODO-SOURCE). `STRETCH.baseHeight` = 0.12 m. The datasheet
gives the 1.41 m overall and not a shell height. 0.12 m sits just above the 4 inch wheels. Removing it means
a published shell height or a measurement off the robot.

`src/js/16-kinematics.js:30-33` — fingertip station (TODO-SOURCE). The factory publishes the 0.52 m reach and
not a fingertip coordinate. The twin parks the tool at y = 0.28 m when the arm is retracted and at y = 0.80 m
when it is extended (retracted + 0.52 m), in the base frame with the arm along +y. Removing it means a
published fingertip frame. The wrist, lift, arm, gripper and head limits around those two lines cite the
guide, the datasheet or the URDF; those citations are the sourced numbers, and only the two TODO-SOURCE lines
are assumptions.

## 4. Out of sample

Seeds 1–5, this tree, after the balanced-proposal swap was removed. Perception was not refit. A number is
"close" here when it sits within about two percentage points of the paper, or within about 0.05 questions.
Several close rows are consequences of the fit or of the pairing; those are named.

**Close, and why.**

Mean \|S0\| is 2.476 against 2.49, and the multi-candidate rate is 46.57% against 46.10%. Those two match
because the bands were fitted to them.

Partial and ambiguous asked rates, 47.78 and 89.72, sit within about two points of the derived targets
46.62 and 91.65. Clear does not: 2.22 against the derived 3.13 is 0.91 points low, about 29%. The bands
were aimed at that row. The miss is not agreement, and the panel says so.

Overall asked rate is 46.57% for every clarifying policy, against the paper's 46.76–48.15. The offline
protocol is balanced across the three instruction types (72 each), so the overall rate is essentially the
mean of the three type rates, and the clear miss is partly cancelled by partial. It is out of sample as a
published cell and it is not an independent check.

ActivAsk's questions on asked trials are 1.923 against the paper's 1.91 offline, and 1.879 against 1.84
online. At \|S0\| = 2 the twin asks 1.00, as the paper and the ideal do. At \|S0\| = 4 ActivAsk asks 2.02
against 2.06 (ideal 2.00). At \|S0\| = 6 it asks 2.68 against 2.70 (ideal 2.67). ActivAsk still asks fewer
questions than first, random and VLM question on the same trials (2.12, 2.02, 2.10 offline). The policy that
minimises G inside K is doing what the paper's policy does; the proposal pool is attribute splits that
already contain a near-even cut, so the question count can land on the paper even though the questions are
not MiMo-VL-7B's.

Family accuracy, all methods pooled, is bottles 75.24 against 75.74, cups 72.06 against 74.02, mixed 78.15
against 80.58, utensils 73.12 against 71.39. Nothing in the bands was fitted to family.

Ambiguous pooled accuracy is 63.53 against 60.47. Pooled questions on ambiguous asked trials are 2.61 against
2.75.

From ε = 0.10 upward, ActivAsk's noise curve is 80.82 / 72.24 / 65.31 against the paper's 81.05 / 73.05 /
65.62. The curve falls with ε, and ActivAsk stays above the other three policies at every positive ε.

Online, the top-score policy's target accuracy averages 59.65 against the paper's 59.65, with 34.0 attempts
against 34 and 23.0 not executed against 23. The five seeds range from 56.14 to 64.91, so the match is the
mean, and the paper's interval is 46.70–71.38. VLM-question full-task rate is 80.00 against 80.70. Random
full-task rate is 50.88 against 50.88. Those full-task cells inherit the category-rate grasp draw, so the
match is not an out-of-sample grasp prediction. Online ActivAsk questions are the close cell already cited.

The ambiguous K curve now falls: mean minimum G is −0.628, −0.661, −0.673, −0.678, −0.680 at K = 1..5. The
paper falls from −0.649 to −0.670. Direction matches Sec. 5.3, because a larger uniform draw is more likely
to contain a balanced split and the forced insertion of that split is gone.

**Farther from the paper, and why.**

Clarifying accuracy is 86.85 offline against 90.74–92.13, and 88.07 online against 91.23 (VLM question) and
92.98 (ActivAsk). The four offline policies share one accuracy, and the two online clarifying policies share
one accuracy, because they see the same candidates and the same answers. The paper's spread of about one
point between those policies is a difference of questions and of VLM picks; this batch cannot produce it.
The level is a few points lower because a missed detection or a flipped repair leaves a wrong singleton, and
the score model is not the study's detector. Seed 4 alone is 83.80; the other four offline seeds are
87.50–87.96.

Top score is 60.00 against 53.70, and direct VLM is 60.37 against 53.70. On a bare noun the bands keep the
top box inside the named category (rule 2 above), and direct VLM collapses to that box when the instruction
has no modifiers. The paper's detector more often promotes a confusable. Random, which ignores the score, is
54.72 against 53.24.

The baseline question counts are shorter than the paper: first 2.12 against 2.37, random 2.02 against 2.39,
VLM question 2.10 against 2.30 (offline Q asked). The same pattern shows online (VLM question 2.08 against
2.25). The pool is an enumeration of attribute and position cuts, "first" is the lowest key in the draw, and
`vlmQ` prefers colour. Those rules find a short dialogue more often than the paper's VLM questions. ActivAsk's
reduction therefore looks smaller than the paper's 15–23% even though ActivAsk itself matches.

Pooled partial accuracy is 60.95 against 69.38, and pooled partial Q asked is 1.01 against 1.30. The
clarifying policies alone score 70.00 on partial instructions; the pooled figure is lower because top score,
random and direct VLM are in the pool and they do not ask. Clear pooled accuracy is 99.44 against 96.02,
which is rule 1: a specific phrase rarely keeps a second box, so almost every policy is correct.

At \|S0\| = 3 and \|S0\| = 5 the twin has 24 and 17 asked trials across all five seeds. ActivAsk's 1.52 at
\|S0\| = 3 sits under the ideal 1.67 and the paper's 1.73. Those two columns are too thin to read as a
disagreement.

At ε = 0 the sweep is 100% for every clarifying policy, against the paper's 98.98 / 93.88 / 96.94 / 98.98.
The twin keeps only trials whose target is already in S0 with \|S0\| ≥ 2, and a truthful answer on a real
partition cannot drop the target, so the filter plus the exact update resolves every such trial. Random
question stays high as ε grows (63.67 at ε = 0.20 against 56.58): a uniform draw among enumerated splits is
a stronger question than the paper's random VLM question. ActivAsk's lead over random question is therefore
smaller than in the paper.

Partial instructions are already near a perfect split at K = 1 (mean minimum G ≈ −0.692, and −ln 2 ≈ −0.693),
so K = 2..5 does not move them. The paper's partial series still falls, from −0.664 to −0.681. The twin's
ambiguous series falls more steeply than the paper's (−0.052 against −0.021). The paper's latency column
(3.49 s to 10.42 s) has no twin counterpart.

Online random target accuracy is 55.44 against 61.40. Online ActivAsk full-task rate is 80.00 against 87.72,
following the lower target accuracy (fewer executions) and a grasp rate of 90.86 against 94.34. Grasp rates
for the two clarifying policies match each other because they execute the same attempts and the coin flip is
keyed by the trial seed. Across policies the rates sit near 91% (top 90.71, random 91.63, clarifying 90.86).
The paper's random grasp rate is 82.86 and ActivAsk's is 94.34. The twin cannot reproduce that spread: every
policy draws from the same category table, and the only policy effect is which categories happen to be
executed. Grasp % and full-task % are sampled from the paper's category rates. They are not out-of-sample.
Only the online target accuracy is.
