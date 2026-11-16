# Task: grasp (M4) · Grok · port 8791

Read `_common.md` first. Worktree `~/code/activask-twin-wt/grasp`, branch `feat/grasp` (from main: your scene work,
the merged perception/clarify logic and the real SCENES are all there).

**Files:** `src/js/16-kinematics.js` (add to it; keep `STRETCH`), `src/js/41-grasp.js` (prefix `grasp`),
`tests/kinematics.test.mjs` (extend). Implement SPEC §3.3 (paper Sec. 3.5).

## Logic (`16-kinematics.js`, logic block, prefix `kin`)
- `stretchFK(q)` → fingertip centre [x, y, z] and closing direction, mirroring the dimensions `40-stretch.js` uses
  (share the numbers through `STRETCH`, do not duplicate them).
- `planGrasp(obj)` → `{ mode: "compact" | "pca", p: [x, y, z], yaw, width, approach }` for a laid-out object:
  compact (cup, bottle): centre-height slice, closing direction horizontal and perpendicular to a cup's handle
  (handle = local +x), width = diameter + clearance; respect the finger length and the gripper aperture
  (`STRETCH`), and say what happens for a tall bottle (paper: "height and clearance constraints").
  pca (fork, spoon): the major axis is the object's local x; the fingers close across the narrow dimension.
- `stretchIK(p, yaw)` → q for a top-down pose (wrist pitched down) within every `STRETCH` limit, or `null` when
  unreachable. `stretchFK(stretchIK(p, yaw))` must hit p within 2 mm.
- `graspWaypoints(obj, q0)` → `Segment[]` (SPEC §2): base move along x, then (when the base moved more than 0.10 m)
  a `reobserve` segment (head looks at the table again, 0.5 s, Sec. 3.5), then **pregrasp** (above the grasp point,
  gripper open to width + margin), **descend**, **close**, **lift**, **retract**. Durations from joint speeds
  (sourced Stretch speeds or `TODO-SOURCE`), each segment with q0/q1 so a ticker can interpolate with `ease`.
  Publish `stretchFK, planGrasp, stretchIK, graspWaypoints` on `LOGIC`.

## Animation (`41-grasp.js`)
- `graspTicker(segs, objGroup, ok)` returns a function `(t) => void` (no allocations inside) that poses the robot
  with `setStretch` along the segments, carries the object in the gripper from the end of **close** onward, and, when
  `ok === false` (a simulated slip), lets it slide out and settle back on the table after **lift**. The lead pushes
  the returned function onto `TICKERS` and loads the segments with `setTimeline(segs)` (both in `70-loop.js`).
- Register a check: `CHECKS.push({ name: "fingertip FK", run: () => ({ ok, detail }) })` comparing the 3D fingertip
  node's world position with `stretchFK(q)` for a few poses (≤ 5 mm).
- Demo with `?demo=grasp`: lay out `SCENES[0]` (`layoutScene`), build its objects with `makeObject`, pick each object
  in turn, and play its grasp. Start it from a `queueMicrotask` callback (the loop's `let` variables do not exist yet
  while the module is still evaluating).

## Checks
Tests: IK∘FK round trip on every object of every offline scene (seed 1), every pose within limits, the layout band
fully reachable, waypoint order pregrasp → descend → close → lift → retract with increasing times, a reobserve
segment exactly when the base moves more than 0.10 m, PCA closing across the narrow axis, width within the
aperture; at least 3 perturbations. Browser: shots with `--query demo=grasp` at several `--t` values (pregrasp,
closed, lifted) plus close-ups of the fingers around a cup, a bottle and a spoon; `pc.checks()` ok;
0 console errors. Report as before.
