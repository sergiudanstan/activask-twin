# scene (M1) report

## Built

- `src/js/16-kinematics.js` publishes `STRETCH` on `LOGIC`. Ranges are metres or radians. Each field names one of `kinGuide`, `kinSheet`, `kinGrip`, `kinUrdf` (URLs at the top of the file).
- `src/js/26-room.js` replaces the M0 placeholder: light floor, back and left walls, window, whiteboard, shelf with bins, cart, two pendant lights, and the test table. The top face is the plane `z = TABLE.h` (1.20 × 0.70). Legs and an apron sit under a light top.
- `src/js/25-objects.js` exports `makeObject(o)`, `objGallery()`, and `OBJ_COLORS` for every `ATTRS.color`. Origin is the base centre, cell frame, z up. Cups are hollow lathes with a rim, a handle when `o.handle`, and a travel-mug lid when `o.lid`. Bottles have a shoulder and neck, a cap when `o.lid`. Forks have a flat handle and four tines. Spoons have a handle and a shallow bowl. Utensils lie on the table. `?gallery` lays out every category × size plus colour, material, handle, and lid variants. Without it, eight hand-placed objects sit on the table.
- `src/js/40-stretch.js` is a Stretch 3: rounded base, bumper, two driven wheels, caster, lidar, mast, lift, five nested arm sleeves, DexWrist yaw/pitch/roll, compliant fingers with open suction-cup tips, head pan/tilt, D435i body with two lenses and an IR projector, and two cables. `setStretch(q)` clamps every joint except `x` and allocates nothing. `stretchHeadCam()` returns the D435i optical centre in the cell frame. Default pose is retracted, lift 0.86 m, pitch −0.55 rad, grip 0.07 m, head aimed at `CAM_POSE.look`.
- Each 3D module hides itself when `?solo=` names something else.

## Checks

- `npm test`: 23 passed, 0 failed (contracts 16, kinematics 7). Ends `all checks passed`.
- `npm run perturb`: all 7 perturbations CAUGHT (4 existing contract ones, 3 in `tests/kinematics.test.mjs`: lift ends swapped, arm extended reach shortened, camera height dropped by 30 cm).
- Shots on port 8791, 0 console errors: `_shots/scene/iso_1.0.png`, `table_1.0.png`, `robot_1.0.png`, plus close-ups under `_shots/scene/{grip,head,cup,fork,spoon}/` and the gallery under `_shots/scene/gallery/`. SwiftShader, so the fps lines (about 1–2 fps) are not a device measurement. `hqStats` tripped the HQ watchdog in software GL.
- `window.pc.renderInfo()` as printed by the shots tool: `{"calls":1,"triangles":1}`. That is the composer OutputPass. `WebGLRenderer` resets `info` at the start of every `render`, and OutputPass is the last one. A hook on the scene `render` itself (shadow map and colour together) counted 276 calls for the full cell.
- Mesh counts, one mesh per colour draw before the shadow map: room 50 (budget 60), objects 16 in the 8-object scene (budget 40), stretch 37 (budget 60). The gallery is larger than 8 objects and is not the budget case.

## Calibration

- Sourced D435i colour optical centre, pan = tilt = 0, base frame: `(0.003, 0.045, 1.322)` m from the uncalibrated URDF FK. `|1.322 − 1.30| = 22 mm`, inside the 5 cm gate. `CAM_POSE` does not need a height change.
- The mesh parks the optical centre on `CAM_POSE`, not on that URDF xy. Measured `stretchHeadCam()` at the default pose: pos `(0, −0.66, 1.30)`, look `(0, −0.06, 0.74)`. Both match `CAM_POSE` well inside 2 cm.
- Pitch 0 fingertip, measured on `stretch-fingertip`: world `(0, −0.34, 0.86)` retracted and `(0, 0.18, 0.86)` at arm 0.52 m. That is `ROBOT.base` plus `gripY` 0.28 / 0.80. Default pose (pitch −0.55) puts the tip at `(0, −0.358, 0.796)`, about 56 mm above the table.

## Assumptions and TODO-SOURCE

- `baseHeight: 0.12` is TODO-SOURCE. The datasheet gives only the 1.41 m overall. 0.12 m is a shell just above the 4 inch wheels.
- `gripY` retracted 0.28 / extended 0.80 is TODO-SOURCE. Hello Robot publishes a 0.52 m reach, not a fingertip coordinate. The pair is retracted plus the reach, and it covers the `layoutScene` band from `ROBOT.base`. The mesh was built so the pitch-0 fingertip matches it, and the measurement above confirms that.
- Footprint axes are not labelled on the datasheet "33 × 34 cm". The URDF wheel joints are 0.3407 m apart, so x (across the wheels) is 0.34 m and y (along the arm) is 0.33 m.
- `lift` is the absolute arm-axis height, 0.20 to 1.29 m. URDF `joint_lift` is 0 to 1.095 m with the carriage at z = 0.195 when the joint is 0. Rounded. The hardware guide does not restate the travel in text.
- `mastHeight` 1.33 m is the URDF `joint_head` origin along the mast. The datasheet overall height is 1.41 m (respeaker near z = 1.40).
- `arm.retracted` 0.255 m is the URDF `joint_arm_l4` offset 0.2547 m. The guide says the retracted arm and wrist fit in the footprint.
- Wrist and head ranges are the Stretch 3 hardware-guide degrees, converted with `Math.PI / 180`. Gripper aperture 0.15 m is the gripper product page. Payload 2 kg is the datasheet and the guide.
- The arm sleeve lengths and extension shares are a visual telescope. They are not factory link drawings. They keep a stepped nose when stowed and still overlap at 0.52 m.
- `wheelDiameter` 0.1016 m (4 inch, hardware guide) is extra, used by the wheels.
- `q.x` is not clamped. The twin base slides along the table; Stretch has no matching prismatic stop.
- The eight demo objects are placed by hand. They do not go through `layoutScene`.
- `clear` and `material: "glass"` use a transmissive `MeshPhysicalMaterial`. Ceramic is clearcoat, plastic is satin, metal uses `brushRough`, anything else is matte paper.

## Open questions

- Head tilt. The hardware-guide diagram is −25° to +90°. That stop cannot aim `CAM_POSE` (about −43°). The published URDF `joint_head_tilt` lower limit is −1.53 rad, which does include the table view. The twin uses −1.53 rad as the lower stop and the guide's +90° as the upper stop. Say if the clamp should stay at the diagram's −25° instead. The default pose would then be outside the clamp and `stretchHeadCam()` could not hit `CAM_POSE`.
- The URDF is `stretch_forcesight/stretch_uncalibrated.urdf`. It reads as an RE2 / dex-wrist file, not a Stretch-3-only model. It supplied the camera FK, the mast offset, the lift travel, and the retracted-arm offset. Joint angles otherwise follow the Stretch 3 guide.
- `docs.hello-robot.com` no longer hosts the Stretch 3 guide (the live docs have moved on to Stretch 4). The citations are the hardware-guide repo markdown, the datasheet PNG rev 2.14.2024, and the gripper spec page.
- URDF camera y in the twin base frame is about +0.045 m (forward of the base origin). `CAM_POSE` is 0.04 m behind the base origin. Height was the gated number, so the mesh follows `CAM_POSE`. Say if the optical centre should move forward to the URDF mount instead.
