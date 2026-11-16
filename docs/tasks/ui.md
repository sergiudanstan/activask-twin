# Task: ui (M7a) · Grok · port 8792

Read `_common.md` first. Worktree `~/code/activask-twin-wt/ui`, branch `feat/ui` (from main: scene, objects, Stretch,
perception and clarify are merged; grasp (M4) and experiments (M5) are being built in parallel, see their briefs in
`docs/tasks/`). This task turns the shell into the working twin. The lead keeps `70-loop.js` (`TICKERS`, `CHECKS`,
`setTimeline`, `seek`, `setPlaying`, `window.pc`), `20`-`22`, the logic block, and the tools.

**Files:** `src/page.html` (panel bodies, small CSS additions), `src/js/50-views.js` (views only),
`src/js/60-ui.js` (you own it now), new `src/js/65-app.js` (prefix `app`) and `src/js/66-headcam.js` (prefix `hc`).

## 1. Scene and trial (65-app.js)
- Clarify panel top: selectors for set (offline/online), scene (id + family), instruction (the scene pool, grouped by
  type), policy (all 7 `POLICIES`; online set: the four online ones), ε (0-0.2), K (1-5), seed, and a "New trial"
  button (random scene + instruction + target, new seed). Hidden intended target: drawn uniformly from the
  instruction's `matches` (paper protocol); in Interactive mode the viewer may click an object to set it secretly.
- Build the 3D objects of the laid-out scene with `makeObject` in a `MODULES.objects` group (position x, y, `TABLE.h`,
  rotation yaw about z), rebuilding on scene change (dispose old geometry/materials).
- Auto mode: `runTrial(...)` → compose the timeline with `setTimeline`: listen (the instruction, 1.5 s), perceive
  (head looks, k candidates, 1.0 s), per round ask (2.5 s) + answer (1.2 s), resolved / unresolved (0.8 s), then
  grasp: if `graspWaypoints` exists (`typeof graspWaypoints === "function"`, M4 may not be merged yet) append its
  segments and push `graspTicker(...)` onto `TICKERS`, otherwise one placeholder "grasp" segment. Wrong or
  unresolved targets are not executed (operator verification, Sec. 4.3). Play from 0.
- Interactive mode: the robot asks the selected proposal (per policy) and waits; Yes / No buttons (keys Y / N) call
  `updateState`; next round's proposals come from `proposeQuestions`; when resolved, show "I think you mean …" and
  the outcome (correct only if the viewer set a target), then grasp as in Auto. Optional browser speech
  (`speechSynthesis`) for the question, off by default, toggle in the panel.

## 2. Panels (60-ui.js)
- Clarify: candidate state S_t as chips (display number, label, colour swatch; eliminated ones struck through),
  the round's K proposals as a table: text, yes/no branch sizes, p_yes, p_no, G (3 decimals), validity flags, a star
  on the selected one; the dialogue history; outcome. A one-line formula note: G = p_yes ln p_yes + p_no ln p_no.
- Live: scene, instruction type, |S0|, questions so far, outcome, policy; plus τ and K.
- Grasp: `planGrasp` / `stretchIK` result for the resolved target when available (mode, width, yaw, joint values),
  "not executed" otherwise.
- Now overlay rows (`uiSetNow(lane, label, cmd)`) follow the current segment; the timeline canvas `#lanes` draws
  the segments coloured by kind with hover tips.
- CSV: "Copy trials CSV" copies every trial of this session (scene, instruction, type, policy, ε, K, |S0|,
  questions, outcome, resolved, target).

## 3. Head camera (66-headcam.js)
Render the scene from `stretchHeadCam()` with a `PerspectiveCamera` matching `CAM` (vfov 42°, 16:9) into a
640 × 360 render target and draw it into `#cam-canvas` (only while the Camera panel is open, ≤ 5 Hz, no per-frame
allocations), then draw the candidate boxes (`Cand.box`) with display numbers and scores: active solid, eliminated
grey dashed, resolved highlighted. The boxes must enclose the objects in the picture. Register
`CHECKS.push({ name: "headcam boxes", ... })` that projects each candidate's object centre with the three.js camera
and checks it lies inside its box. Also floating number tags above the candidate objects in the 3D view (dimmed
when eliminated).

## 4. Views (50-views.js)
Re-aim the presets for the real scene: Room, Iso (whole robot incl. base + table), Robot (side), Table (not blocked
by the mast), Top, User (across the table, facing the robot), Head (the head camera's view).

## Checks
`npm test` + `npm run perturb` stay green; shots (0 console errors, `pc.checks()` ok) of: Auto trial mid-dialogue
(`--query "panels=clarify,camera"`, several `--t`), the Interactive flow (`--query mode=interactive`), each view;
close-up of the Camera panel boxes. Look at every PNG and fix what looks wrong. Report with screenshots listed.
