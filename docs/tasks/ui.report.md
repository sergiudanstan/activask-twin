# ui (M7a) report

## Built

- `src/js/65-app.js` (prefix `app`) runs a trial from the Clarify selectors. Set is offline or online. Scene shows id and family. Instructions are the scene pool, grouped by type. Policy is all 7 `POLICIES` offline, and only the four with `online: true` on the online set. ε is 0–0.2, K is 1–5, plus a seed and New trial. New trial stays in the current set and draws a scene, an instruction index, and a seed from `rng` (no `Math.random`).
- Auto draws the hidden target uniformly from the instruction's `matches`, calls `runTrial`, and plays from 0. The timeline is listen 1.5 s, perceive 1.0 s, then ask 2.5 s and answer 1.2 s per round, then resolved or unresolved 0.8 s. A correct outcome appends motion. Anything else is not executed (operator verification, Sec. 4.3).
- Interactive asks the policy's selected proposal and waits. Yes / No (buttons and Y / N) call `updateState`. The next round comes from `proposeQuestions` with slip 0.05. When |S| ≤ 1 it shows "I think you mean …" and an outcome. Correct only if the viewer clicked an object. Speech uses `speechSynthesis`, off by default.
- If `graspWaypoints` exists, its segments are appended and `graspTicker(...)` is pushed on `TICKERS`. It does not exist on this branch, so a correct trial gets one placeholder grasp segment of 2.4 s and the arm stays at the home pose. The Grasp panel says that, and it says "not executed" only when the trial will not grasp.
- Objects are `makeObject` groups in `MODULES.objects` at `(x, y, TABLE.h)`, yaw about z. Rebuilding disposes geometries. Shared `objMatCache` materials are kept. Sprite materials are disposed. `?gallery` leaves the gallery in place.
- `src/js/60-ui.js` paints candidate chips (display number, label, colour swatch, eliminated struck through, resolved highlighted), the K proposals (text, yes/no sizes, p_yes, p_no, G to 3 decimals, E/D/L/W flags, a star on the selected row), dialogue, and outcome. The formula line is `G = p_yes ln p_yes + p_no ln p_no`. Live shows scene, instruction type, |S0|, questions, outcome, policy, τ, and K. Now rows follow the current segment. `#lanes` draws one bar per segment, coloured by kind, with a hover tip. Copy trials CSV writes every session row (scene, instruction, type, policy, ε, K, |S0|, questions, outcome, resolved, target). Auto logs at build. Interactive logs at finish. Leaving an interactive trial after at least one answer logs it as unresolved.
- `src/js/66-headcam.js` renders `stretchHeadCam()` with a PerspectiveCamera (vfov 42°, aspect 16:9, near 0.05) into a 640×360 target and blits `#cam-canvas` only while the Camera panel is open, at most 5 Hz, with no per-frame allocations. `Cand.box` is drawn on top: active solid in the object colour, eliminated grey dashed, resolved thickened. Number tags float above candidates in the 3D view and dim when eliminated. They are hidden while the head image is rendered, and they are parented to the scene so the cell-frame rotation does not lay them flat.
- `CHECKS` includes `headcam boxes`. It projects each candidate's object centre with that three.js camera and requires the pixel inside `Cand.box` (3 px slack).
- `src/js/50-views.js` aims Room, Iso (base and table), Robot (side, camera kept inside the left wall), Table (from the user side of the mast), Top, User (across the table, facing the robot), and Head (fov 42, near 0.05). Keys 1–7. The hint says 1–7 and Y/N.
- Boot is `queueMicrotask` in 60, 65, and 66. `setTimeline` is not called while the module is evaluating. `setMode` is wrapped so a mode change rebuilds the trial, and the call from `70-loop.js` during evaluation does not.

## Checks

- `npm test`: 93 passed, 0 failed (5 files). Ends `all checks passed`. The UI is outside the `@@logic-start` / `@@logic-end` block, so `tests/run.mjs` does not execute it and this task adds no logic test.
- `npm run perturb`: all 15 existing perturbations CAUGHT. No UI perturbation, for the same reason.
- Shots on port 8792, 0 console errors, `pc.checks()` ok on every run. `headcam boxes`: `5 centres inside, max outside 0.00 px` on the default trial. SwiftShader, so the fps lines (about 1–3 fps) are not a device measurement. HQ tripped the software-GL watchdog. `renderInfo` on these stills was `{"calls":262,"triangles":164761}` for the main frame. The head-camera pass runs in a ticker, before `renderer.info.reset()`, so those draws are not in that count.
- Screenshots (gitignored under `_shots/`):
  - Auto, `panels=clarify,camera`, iso: `_shots/ui/auto/iso_1.0.png`, `iso_4.0.png`, `iso_7.5.png`, `iso_11.0.png`, `iso_15.0.png`
  - Interactive: `_shots/ui/interactive/iso_0.5.png`, `iso_3.2.png`
  - Views: `_shots/ui/views/room_1.0.png`, `iso_1.0.png`, `robot_1.0.png`, `table_1.0.png`, `top_1.0.png`, `user_1.0.png`, `head_1.0.png` (`robot_1.0.png` is the reshoot after the wall fix)
  - Camera panel: `_shots/ui/camera/iso_4.0.png` (five solid boxes), `iso_15.0.png` (four grey dashed, orange highlighted, Still in S = 1)
  - Grasp placeholder: `_shots/ui/grasp/iso_15.0.png`
  - Close-ups: `_shots/ui/close/cam_4.0.png` (large orange cup), `_shots/ui/cluster/cam_4.0.png`

## Calibration

- Default trial, seed 1, `off-cups-01`, "pick up my cup", ActivAsk, K 4, ε 0. Target drawn from `matches` is the large orange cup. |S0| = 5 (the medium orange cup is on the table and has no chip, tag, or box). Three questions: medium → no, blue → no, orange → yes. Outcome `correct`, belief "I think you mean the orange large cup." Clock 16.8 s: listen, see, three ask/answer pairs, ok, grasp 2.4 s.
- Head-camera centres sit inside `Cand.box` with 0.00 px outside on that trial, so the vfov-42 / 16:9 camera matches `camProject` closely enough at the default head pose. Boxes in the panel enclose the cups. The medium orange cup, which never became a candidate, has no box.
- Robot view camera is cell `(-2.25, -0.20, 1.05)` looking at `(0.20, -0.50, 0.70)`. `x = -2.70` was outside the left wall (`lab-wall-left` at x = −2.45) and the picture was the wall. Iso, table, user, top, and head were already inside the room.

## Assumptions and TODO-SOURCE

- Placeholder grasp duration 2.4 s is a twin assumption. The paper does not give a segment time, and `graspWaypoints` is not on this branch.
- ε is simulated operator noise inside `runTrial`. Interactive Yes/No is the viewer's answer and is not flipped. The CSV still records ε.
- Interactive outcome is `none` when the robot resolves but the viewer never clicked a target, and when there are no candidates. `unresolved` is |S| ≠ 1. `correct` / `wrong` compare the resolved object's id with the clicked id.
- A click after the interactive trial has finished rewrites the outcome and the CSV row. It does not start a grasp.
- While the viewer is answering, the timeline is listen 1.5 s + perceive 1.0 s + one 6 s ask, and it pauses on that ask. The question and the Yes/No buttons are shown as soon as the proposal exists, including during the listen clock. On finish the full per-round timeline replaces it.
- Non-clarifying policies (`top`, `random`, `directVLM`) do not ask. Interactive reads `runTrial(...).resolved` with a dummy target and then judges against the viewer's click.
- Round seed is `(seed + (rounds + 1) * 0x9e3779b1) >>> 0`. Slip is 0.05, the same value `runTrial` uses.
- `Cand.box` is the fixed `CAM_POSE` pinhole. The check uses the live `stretchHeadCam()` pose. They match at the home pose, and the placeholder grasp does not move the head. A later grasp that moves the head can fail this check if `pc.checks()` runs after `play()`.
- Scene change selects the first ambiguous instruction in the new pool. New trial picks any instruction in the pool.
- No `TODO-SOURCE` was added. No paper number was invented.

## Open questions

- `graspTicker(segs, group, ok)` is called with the whole timeline, dialogue segments included, each carrying the home pose in `q0` and `q1`. Say if M4 wants only the motion suffix.
- Should interactive ε ever flip the viewer's Yes/No, or is logging it enough?
- Once the head moves, should `headcam boxes` keep comparing against `Cand.box` from `CAM_POSE`, or should the overlay be reprojected from the live head?
- The Experiments card is one sentence until M5 fills `#exp`.
