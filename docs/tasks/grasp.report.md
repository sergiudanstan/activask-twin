# grasp (M4) report

Stretch IK, a grasp plan, waypoint segments, and the demo ticker. Logic in `src/js/16-kinematics.js` (prefix `kin`, `STRETCH` kept). Animation in `src/js/41-grasp.js` (prefix `grasp`). Published on `LOGIC`: `STRETCH`, `stretchFK`, `planGrasp`, `stretchIK`, `graspWaypoints`.

## What was built

- `STRETCH.tool` holds the wrist chain the mesh uses (`stow0` 0.012, `armLen0` 0.130, `pitch` 0.015, `roll` 0.030, `tip` 0.093, palm face 0.047 above the tip, suction-cup radius 0.011). `stretchFK(q)` returns the fingertip centre and the closing axis (gripper local +x) in the cell frame. `40-stretch.js` was left unchanged; the browser check below locks these copies to the mesh.
- `STRETCH.speed` times the segments (m/s or rad/s). Sourced where a default exists; the rest are marked `TODO-SOURCE` in the file.
- `planGrasp(obj)` returns `{ mode, p, yaw, width, approach }`. Cups and bottles are `compact`: a centre-height slice, width = diameter + 8 mm, clamped to the 0.15 m aperture. A cup handle (local +x) and a utensil's long axis are avoided: the fingers close on local +y. Forks and spoons are `pca` and close across `dims.w`. A bottle whose centre slice would put the palm in the body is raised until the palm face sits 4 mm above the cap; if the body is taller than the finger can clear, the grasp stays at the highest on-body point (paper Table 10, height and clearance). A utensil is millimetres thick, so its point is at least one cup radius above the table.
- `stretchIK(p, yaw)` solves a top-down wrist (pitch in `[−π/2, 0]`, roll 0) inside every `STRETCH` limit, or returns `null`. `q.x` is not clamped. The layout band, including the far edge y = 0.13, is reachable by opening the pitch off −90°. `stretchFK(stretchIK(p, yaw))` hits `p` within 2 mm.
- `graspWaypoints(obj, q0)` returns `Segment[]`: base move along x, then a `reobserve` segment exactly when that move exceeds 0.10 m (0.5 s, head aimed at the object's table point), then pregrasp (approach height, gripper at width + 40 mm), descend, close, lift (+0.12 m), retract (arm home). Each segment carries `q0` and `q1`. Duration is the slowest joint at `STRETCH.speed`, and at least 0.2 s. Times chain (`next.t0 === prev.t1`).
- `graspTicker(segs, objGroup, ok)` is `(t) => void` with no allocation inside the tick. It poses the robot with `setStretch` and carries the object from the end of close. `ok === false` holds the object through the lift, then eases it down to `TABLE.h`, sliding 35 mm along the closing axis over the retract. After a successful retract the object stays at the pose where that retract ended, so a later grasp does not drag it. Seeking backwards restores the table pose before close, because the tick is a pure function of `t`.
- `CHECKS` gains `{ name: "fingertip FK" }`. Registration is inside `queueMicrotask`, because `41-grasp.js` evaluates before `70-loop.js`.
- `?demo=grasp` clears `objRoot`, lays out `SCENES[0]` (six cups), and appends one bottle and one spoon so the close-ups have those categories. The extras stay hidden until their own first segment. `?slip=1` marks the first grasp `ok === false`. `window.graspDemo` is the concatenated segment list. The demo runs about 86.3 s.

## Checks

- `npm test`: **101 passed, 0 failed** (clarify, contracts, kinematics, perception, scenes). Ends `all checks passed`. Kinematics includes the IK round trip, joint limits, PCA closing direction, and waypoint order on all **204** offline objects at seed 1, plus the layout-band reach test and a large-bottle height test.
- `npm run perturb`: **all 18 caught**. The three new ones are `top-down pitch flattened` (`kinDown` forced to 0), `reobserve threshold raised` (`kinBaseMove` 0.10 → 5), and `grasp clearance wider than the aperture` (`kinClearance` 0.008 → 0.20). The three original Stretch-range perturbations are unchanged.
- Browser, port 8791, `?demo=grasp`, views iso / table / robot at 4.7 s (pregrasp), 6.0 s (closed), 7.2 s (lifted): **0 console errors**. `pc.checks()` ok, fingertip FK **max 0.00 mm**. `window.pc.renderInfo()`: `{"calls":259,"triangles":170039}` (whole frame, shadows included). HQ fps about 1.6 is SwiftShader and is not a device measurement.
- Close-ups (cell frame): cup side at 6.05 s, palm 4 mm above the rim and suction tips on either side of the mouth, handle outside the fingers; cup lift at 7.2 s, cup in the fingers; bottle front at 72.0 s, fingers flanking the shoulder, palm face about 4 mm above the mouth; spoon at 81.4 s, tips across the handle. Slip side at 8.2 s (`?slip=1`): the orange cup is clear of the table (base z 0.849 m) while the gripper has started back. At 10.7 s the same cup is on the table, 35 mm along the closing axis, and the gripper is retracted to y ≈ −0.47 m.

## Calibration

- Pitch 0, arm 0: fingertip y in the base frame is 0.280 m, equal to `gripY.retracted`. Full extension is 0.800 m, equal to `gripY.extended`.
- Four mesh poses (including a pitched wrist and a non-zero roll) match `stretchFK` to 0.00 mm. Scene positions convert as cellX = sceneX, cellY = −sceneZ, cellZ = sceneY.
- Demo, seed 1, home `{x:0, lift:0.86, arm:0, yaw:0, pitch:−0.55, roll:0, grip:0.07}`. First cup (medium, orange): pregrasp 1.41–4.89 s, descend 4.89–5.61, close 5.61–6.11 (tip z 0.792, grip 0.088), lift 6.11–7.37, retract 7.37–10.85. The sixth cup does not reobserve (base move under 0.10 m). The extra bottle closes 71.54–72.04 s (tip z 0.867, grip 0.063). The extra spoon closes 81.02–81.52 s (tip z 0.751, grip 0.046, mode pca).
- At the bottle close, fingertip z 0.867 is on the shoulder (body radius 27.5 mm, local radius there about 18 mm). Tip-to-tip is about 70 mm, so each suction cup sits roughly 9 mm off the glass. The palm does not enter the mouth. Width stays diameter + clearance, which is what the compact command and the test require.
- At the spoon close the fingers span the head width. The handle is narrower, so a small gap remains. Paper Table 10 already notes a spoon grasp shifted onto the edge or the handle boundary.

## Assumptions and TODO-SOURCE

- `40-stretch.js` still has its own literals (0.012, 0.130, 0.015, 0.030, 0.093). It is outside this task's file list. `STRETCH.tool` copies them, and the fingertip check fails if they drift.
- `baseHeight` 0.12 m and `gripY` 0.28 / 0.80 stay `TODO-SOURCE` from M1.
- Speeds: lift 0.095 m/s and wrist yaw 2.0 rad/s are the forum RobotParams dump (https://forum.hello-robot.com/t/ros-integration-for-custom-motion-profiles/702). Arm 0.14 m/s is the Stretch Body guide default (the Stretch 3 fast profile in `stretch_dex_teleop` `robot_move.py` is 0.18 m/s; the twin uses the guide default). Base 0.15 m/s is `TODO-SOURCE` (Stretch Body guide example `base.motion.default.vel_m`, https://docs.hello-robot.com/0.1/stretch_body_guide/). Pitch 2.0 rad/s, roll 2.0 rad/s, grip 0.08 m/s of aperture, and head 1.5 rad/s are `TODO-SOURCE`. Dex-teleop's fast pitch is 3.0 and fast roll is 4.5. The reobserve segment uses the fixed 0.5 s, not the head speed.
- Clearances, all `TODO-SOURCE`: `kinClearance` 0.008 m, `kinOpenMargin` 0.04 m, `kinLiftOff` 0.12 m, `kinAbove` 0.025 m, `kinGap` 0.004 m, `kinMinSeg` 0.2 s. The 8 mm clearance puts the suction-cup mouth on a cylindrical surface. The slip slide is 35 mm.
- `kinBaseMove` 0.10 m and `kinReobserve` 0.5 s come from the task brief. The fetched paper text describes a re-observe after a large base move and does not give these two numbers.
- `graspWaypoints` does not sample success. The trial runner should draw `ok` from `PAPER.graspByCat` and pass it to `graspTicker`. `?slip=1` forces the first object to slip.
- `SCENES[0]` is `off-cups-01` (cups only). The demo appends the first bottle and the first spoon of the first offline scene that contains each, laid out with seed 1. That first sample lands on the same pose for all three footprints, (0.122, 0.013, yaw −0.23). The bottle is the small clear glass one (h 0.17 m, no lid). It stays hidden until the cups have been picked, so the shared spot is free. The large-bottle raise is the separate test, not this demo object.
- A finished grasp freezes at its retract pose (near y = −0.46, still at the lift height). Later frames show those objects in the air beside the base. They are not parented to the gripper.

## Open questions

- Whether the `TODO-SOURCE` speeds should move to the dex-teleop `fastest_stretch_3` profile (base aside, that profile is lift 0.2, arm 0.18, yaw/pitch 3.0, roll 4.5).
- Whether a bottle grasp that has been raised onto the neck should shrink `width` to the local radius. Doing that would leave the compact rule "diameter + clearance", which the test locks.
- The spoon gap on the handle. Closing to `dims.w` matches "fingers close across the narrow dimension" measured at the head. A handle-width close would need a second dimension the logic does not have.
- Re-observe at 0.10 m / 0.5 s is the brief. Say if the paper's re-observe is a different threshold.

## r1

Revision of the M4 section above. Where the two disagree, this section is the one that matches the code. Superseded M4 claims: centre-height cups, width = body diameter + 8 mm, the 9 mm bottle gap, the spoon handle gap, objects parked in the air, `kinLiftOff` 0.12 m, the 35 mm slip slide, `40-stretch.js` keeping its own wrist literals, arm 0.14 m/s presented as a Stretch Body guide default, and the 86.3 s demo. Open questions 2 and 3 (local bottle width, spoon handle width) are closed here. Open question 1 (whether to adopt `fastest_stretch_3`) and open question 4 (the 0.10 m / 0.5 s re-observe) are unchanged. The four refuted review items were left alone.

`LOGIC` now also publishes `OBJ_SHAPE`, `objRadiusAt`, `utensilWidthAt`, `kinToolPoint`, `kinGripPoints`, `kinHitsSolid`. A successful `planGrasp` includes `ok: true`. `graspWaypoints` still returns `Segment[]` on success (`Array.isArray`); on failure both return `{ ok: false, reason }`.

### R1, R2 — collision-free motion

`graspWaypoints(obj, q0, others = [])`. `others` is every other laid-out object still on the table. Order: **clear** (lift only, before any arm, yaw, or base motion, so the lowest `kinGripPoints` sample over the pitch from `q0` to the grasp pitch is at least the tallest object top + `kinSafe` 0.02 m) → base move along x → **reobserve** exactly when `|dx| > 0.10` m, for 0.5 s, head on the object's table point → **pregrasp** at that safe lift, grip = width + 0.04 m → **descend** (lift only) → **close** → **lift** (lift only) until the held object's bottom clears the tallest neighbour in the retract corridor + 0.02 m → **retract** at that height. The corridor is the held footprint discs, swept by the arm's −y retract, plus the finger endpoints. If the clear lift exceeds `STRETCH.lift.max` the reason is `lift cannot clear the table`. If the corridor lift does, the reason is `lift cannot clear the retract corridor`. An empty corridor still lifts by `kinSafe`.

The test samples every segment at ≤ 8 mm of fingertip travel (joint-uniform, not eased), every scene, seeds 1..5, from home and chained. Neither fingertip, palm, nor the held footprint may enter another object's solid (cylinder or disc-chain × height). Fingertips may enter the target only from descend start through close, and the solid test uses the analytic local radius so a finger sitting on the surface is not an intrusion. Result: **3072** successes and **38** explicit failures, every failure `lift cannot clear the retract corridor` (19 from home, the same 19 again on the chained pass). Seed-1 offline: 204 objects, 0 failures. A separate check puts a small cup in front of a large bottle and requires 20 mm of corridor clearance; that check is what catches `kinSafe` forced to 0, because an exact touch is not an intrusion.

### R3 — grasp height

Twin assumption, stated in the `16-kinematics.js` header and tied to paper Table 10 "height and clearance constraints". The palm face is `tool.palm` (47 mm) above the fingertip, so a centre slice puts the palm inside any body taller than about 86 mm. The grasp starts at the centre, rises until the palm clears the top, then keeps rising while a higher slice is wider by more than 0.4 mm. Measured `z / H` on `DIMS` (H is the body height, not the lid):

| | small | medium | large |
| --- | --- | --- | --- |
| cup, no lid | 0.993 | 1.000 | 1.000 |
| cup, lid | 0.995 | 0.996 | 1.031 |
| bottle, no lid | 0.747 | 0.795 | 0.828 |
| bottle, lid | 1.018 | 1.010 | 1.008 |

Cups end on the rim (a lidded large cup walks onto the wider lid, z = 0.1186 m against body H 0.115 m). Lidless bottles stop on the neck taper, above the shoulder at 0.66 H. Lidded bottles sit on the cap.

### R4, R8 — local width, fingertips touch

Width is `2 * objRadiusAt(obj, zLocal) + kinClearance` (0.008 m), not the body diameter. With the suction-cup mouth the gap per side is `clearance/2 + cupX − mouth` = −0.2 mm, inside the 2 mm contact band. The offline sweep checks that gap on every laid-out object, and a DIMS probe of every size, with and without a lid, measures the same −0.2 mm. Bottle spans at the grasp: no lid 0.0387 / 0.0320 / 0.0297 m, with lid 0.0256 / 0.0262 / 0.0302 m. The old "about 9 mm off the glass" was the diameter applied at the neck.

### R5, R7 — utensils

A fork or spoon is grasped at the handle centre along local x, closing across `utensilWidthAt` there. Fork handle centre x = −0.22 L, width 0.42·W, height 0.85·T. Spoon handle centre x = −0.16 L, width `min(0.38·W, 0.012)`, height 0.72·T. z is 1 mm under the handle top (fork 0.0092 / 0.0109 / 0.0118 m, spoon 0.0091 / 0.0105 / 0.0120 m). The twin replaces PCA of a depth slice by the object's known yaw and these analytic widths; that is stated in the header. The suction-cup radius is 11 mm, so a thin handle puts the cup equator near the table. The shots show a slight table kiss on the fork and the spoon. That is the documented trade for staying on the handle.

### R6 — demo state

`graspTicker(segs, objGroup, ok, releaseAt)`. If `releaseAt` is set, `t >= releaseAt` restores the table pose. If it is omitted, the object stays at the parked retract pose (paper "grasp, lift, and retain" for a single trial). The demo sets `releaseAt` to this grasp's `retract.t1` for every object except the last, which stays held. A previously carried object is back on its table pose when the next grasp starts.

### R9 — explicit failure

Unreachable IK, or a span ≤ 4 mm, returns `{ ok: false, reason: "unreachable" }`. The demo skips a non-array waypoint result and does not read `segs[0].t0`. The test feeds a cup at y = 2.

### R10, R11, R12 — sources

The three original perturbation find-strings are byte-identical: `lift: Object.freeze({ min: 0.20, max: 1.29 })`, `gripY: Object.freeze({ retracted: 0.28, extended: 0.80 })`, `d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.322 })`. Also unchanged: `const kinClearance = 0.008;`, `const kinDown = -Math.PI / 2;`, `const kinBaseMove = 0.10;`.

- **R10.** Arm 0.14 m/s is `TODO-SOURCE`. No checked page states that default. The Stretch 3 fast profile in `stretch_dex_teleop` `robot_move.py` (`fastest_stretch_3`) is 0.18 m/s and is not used: https://github.com/hello-robot/stretch_dex_teleop/blob/main/robot_move.py . Base 0.15 m/s stays `TODO-SOURCE`; https://docs.hello-robot.com/0.1/stretch_body_guide/ is the RE1-era guide and now 404s. Lift 0.095 m/s and yaw 2.0 rad/s are the forum RobotParams dump, and the comment now says that thread is Stretch RE2, not Stretch 3: https://forum.hello-robot.com/t/ros-integration-for-custom-motion-profiles/702 .
- **R11.** The lift comment now says the live URDF `joint_lift` upper is 1.1 and that 1.095 is commented out. The numeric `lift.max` stays 1.29 (0.195 + 1.095). Against the live stop, 0.195 + 1.1 = 1.295, so 1.29 is 5 mm low, marked `TODO-SOURCE`. Head tilt still mixes the URDF lower −1.53 rad with the guide-diagram upper +90° (URDF upper is 0.79 rad, different zero), now `TODO-SOURCE`. `arm.retracted` 0.255 is `TODO-SOURCE`: `joint_arm_l4` xyz 0.2547 m is a fixed link offset, not a retracted length.
- **R12.** https://hello-robot.com/stretchgripper3-specs returns 404. The aperture 0.15 m stays, the `kinGrip` URL string stays (so the old citation text is still in the file), and the comment above it marks `TODO-SOURCE`. https://hello-robot.com/stretch-3-whats-new does not state the aperture. Pitch 2.0, roll 2.0, grip 0.08, and head 1.5 stay `TODO-SOURCE`.

### R13 — slip

After `lift.t1` the arm stays at `lift.q1` for 0.25 s while the grip opens by 0.02 m. The object then slides straight down for 0.35 s with `u*u`, from the lifted height to `TABLE.h`, at the lifted xy (the lift is vertical, so that is the home xy). No 35 mm lateral glide. The arm then retracts with the gripper still open. `?slip=1` marks the first successful demo grasp `ok === false` and adds `graspOpenDur + graspDropDur` (0.6 s) to that retract, so the dwell finishes before the next grasp.

### Single source of truth

`40-stretch.js` reads `STRETCH.tool` for `armLen0`, `stow0`, `pitch`, `roll`, `tip`, `cupX`, and `cupY`. The other four sleeve lengths stay mesh-only. `25-objects.js` builds cup, bottle, fork, and spoon meshes from the profile helpers in `16-kinematics.js`. `setStretch` and the ticker still allocate nothing.

### Checks

- `npm test`: **105 passed, 0 failed**. Ends `all checks passed`. Includes local contact within 2 mm and collision-free order on 204 offline objects (0 explicit failures), the 20 mm corridor check, the out-of-reach failure, and the 3072 / 38 sweep above.
- `npm run perturb`: **all 20 caught**. New: `safe-height margin removed` (`kinSafe` 0.02 → 0, 2 checks failed) and `width taken from body diameter` (`return 2 * objRadiusAt(obj, zLocal)` → `return dimsOf(obj).d`, 1 check failed). The previous 18 still catch.
- Browser, port 8791, one Chrome. `--clean` hides the overlay, drawer, and rail; the page header and the timeline stay (the shot tool is lead-owned). **0 console errors** on every shot. A non-quick iso / table / robot pass: `pc.checks()` ok, fingertip FK **max 0.00 mm**, `window.pc.renderInfo()` `{"calls":275,"triangles":176363}`. HQ fps is SwiftShader and is not a device measurement.
- Close-ups, looked at. Cup at 9.43 s (`_shots/grasp/cup-rim/cam_9.43.png`): both suction cups on the rim of the medium orange cup; the table view at the same time puts the gripper on that cup. Bottle at 79.45 s: both cups on the neck, palm above the cap, no penetration of the glass. Fork at 92.42 s and spoon at 110.14 s: fingers on the handle, slight table kiss. Slip at 9.80 s: grip opened, a small gap at the rim, cup still up. Slip at 10.40 s: cup seated on the table under the grasp point, fingers above it and open. Mixed scene `off-mixed-01` at 6.11 s (mid-pregrasp): gripper high above the clutter, fingers clear of every object.
- Demo, seed 1, `?demo=grasp`: end **112.76 s**, 9 grasps (six cups plus a bottle, a fork, and a spoon), 0 skips. First cup close 8.93–9.43 s. `?slip=1` end **113.36 s** (retract of the first grasp 9.64–13.72 s; open 9.64–9.89, drop 9.89–10.24). `?mix=1` is `off-mixed-01`, end **109.93 s**, 8 grasps, 0 skips.

### Still TODO-SOURCE

`kinClearance` 0.008 m, `kinOpenMargin` 0.04 m, `kinAbove` 0.025 m, `kinSafe` 0.02 m, `kinGap` 0.004 m, `kinMinSeg` 0.2 s, base 0.15 m/s, arm 0.14 m/s, pitch 2.0, roll 2.0, grip 0.08, head 1.5, gripper aperture 0.15 m, `lift.max` against the live 1.1 m URDF stop, the mixed head-tilt zeros, `arm.retracted` 0.255 m, `baseHeight` 0.12 m, and `gripY` 0.28 / 0.80. `kinBaseMove` 0.10 m and `kinReobserve` 0.5 s remain the brief. Success sampling from `PAPER.graspByCat` is still the caller's job.
