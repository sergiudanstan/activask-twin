# Task: scene (M1) · Grok · port 8791

Read `_common.md` first. Worktree `~/code/activask-twin-wt/scene`, branch `feat/scene`.

**Files:** `src/js/16-kinematics.js` (constants only in this task), `src/js/25-objects.js`, `src/js/26-room.js`
(replace the M0 placeholder), `src/js/40-stretch.js`, `tests/kinematics.test.mjs`. Prefixes: `kin`, `obj`, `lab`, `stretch`.

## 1. Stretch 3 specs (`16-kinematics.js`, logic block: no DOM, no three.js)
Collect the published Hello Robot Stretch 3 numbers and put them in `const STRETCH = Object.freeze({...})` with the
source URL in a comment on each line (docs.hello-robot.com hardware guide, Stretch 3 datasheet): footprint and base
height, mast height, lift range, telescoping-arm retracted length and extension, number of arm segments, wrist
(DexWrist 3) yaw / pitch / roll ranges, gripper opening, head pan / tilt ranges, D435i mount position, overall height,
payload. Anything you cannot source: write a reasonable value and `// TODO-SOURCE`. Publish with
`Object.assign(LOGIC, { STRETCH })`. Tests: ranges are ordered (min < max), the lift reaches the table top
(`TABLE.h`), the arm reach covers the object band of `layoutScene` from `ROBOT.base`, and the head camera height is
within 5 cm of `CAM_POSE.pos[2]`. If it is not, report the sourced height (the lead updates `CAM_POSE`). At least 2
perturbations.

## 2. Room and table (`26-room.js`)
A calm university robotics lab: light floor, two walls, a window or ceiling lights, a shelf or cart at the back.
The test table must have its top exactly at `TABLE` (1.20 × 0.70, top surface z = 0.74), with legs and an apron, and a
light top so the objects read well in the head camera. Budget: 60 draw calls.

## 3. Objects (`25-objects.js`)
`makeObject(o)` returns a THREE.Group named `o.id`, origin at the object's base centre, built in the cell frame
(z up; the caller sets position x, y, TABLE.h and rotation yaw). Sizes from `dimsOf(o)`. Realistic, recognisable:
- cup: lathe profile with wall thickness and rim; a handle when `o.handle`; a lid (travel-mug style) when `o.lid`.
- bottle: lathe body with shoulder and neck; a cap when `o.lid`, an open neck otherwise.
- fork: flat handle and four tines; spoon: handle and bowl (shallow dish). Lie flat on the table.
- colour from `o.color` (define `OBJ_COLORS` for every `ATTRS.color`, "clear" = transparent glass/plastic),
  material from `o.material` (ceramic glossy, glass transmissive, plastic satin, metal brushed, paper matte).
- `objGallery()`: with `?gallery` in the URL, lay out every category × size and a few colour/material/handle/lid
  variants on the table, so you can shoot them. Budget: 40 draw calls for an 8-object scene.

## 4. Stretch 3 model (`40-stretch.js`)
Recognisable Stretch 3: round-cornered mobile base with wheels and bumper, slim mast, lift carriage, telescoping
arm (nested segments), DexWrist 3, the compliant gripper with suction-cup-like fingertips, head with pan/tilt and
the D435i (two lenses and IR projector visible), cable details. Base at `ROBOT.base`, arm extends along +y.
- `setStretch(q)`, q = `{ x, lift, arm, yaw, pitch, roll, grip, pan, tilt }`, all within `STRETCH` limits.
  Default pose: arm retracted, lift so the gripper is above the table, head looking at `CAM_POSE.look`.
- `stretchHeadCam()` returns `{ pos, look }` of the D435i optical centre in the cell frame for the current pose.
  At the default pose it must equal `CAM_POSE` within 2 cm.
- No allocations inside `setStretch`. Every moving part has a stable `.name`. Budget: 60 draw calls.

## Check
`npm test`, `npm run perturb`, and shots of `iso`, `robot`, `table` plus close-ups of the gripper, the head camera,
a cup with a handle and lid, a fork, and a spoon (add `--query gallery=1` for the gallery). 0 console errors. Report with the draw-call numbers from
`window.pc.renderInfo()` (the shots tool prints it).
