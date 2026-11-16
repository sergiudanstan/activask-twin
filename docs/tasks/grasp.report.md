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
