## How to work (same for every task)

You are a worker. Claude (herdr pane `wX:p1`) is the lead: it merges, pushes and talks to the user. **Do not ask
the user anything** and do not wait for confirmation; decide, note the decision in your report, and continue.

1. Work ONLY in your git worktree `~/code/activask-twin-wt/<name>` (branch `feat/<name>`). Never edit
   `~/code/activask-twin` (the lead's checkout). `node_modules` is already linked in your worktree.
2. Read first: `docs/SPEC.md` (all of it), `src/js/10-contracts.js`, `src/js/12-paper.js`, and for 3D work
   `src/js/21-materials.js` (`M`, `mat`, `phys`, `procTex`) and `src/js/22-geom.js` (`mesh box vcyl rod rbox
   extrudeXY extrudeXZ lathe tubeAlong labelPlane moduleRoot`).
3. Touch ONLY the files listed in your task (plus your test file and `docs/tasks/<name>.report.md`). Keep the
   API names from SPEC §6; prefix every other module-scope name with your prefix.
4. Build and check often:
   ```sh
   npm test                    # must end "all checks passed"
   npm run perturb             # every perturbation CAUGHT (yours included: at least 2 per logic module)
   node tools/shots.mjs --port <port> --view iso,table,robot --t 1 --out _shots/<name>     # 3D tasks: 0 console errors
   ```
   For 3D work also shoot close-ups (`--cam x,y,z --target x,y,z --clean`, cell frame, 0.2–0.5 m away), open
   the PNGs, and judge them like a picky engineer; iterate until they look right.
   One Chrome at a time on this machine: never run two browser tools in parallel.
5. Commit on your branch only: `git add <your files> && git commit -m "<Task>: <what> (M1)"`. Do NOT push, merge
   or rebase.
6. Write `docs/tasks/<name>.report.md`: what you built (bullets), test and perturbation counts, console errors,
   calibration numbers or measurements, every assumption and every `TODO-SOURCE`, open questions for the lead.
7. When finished, print exactly one line: `DONE <name>`. If blocked: `BLOCKED <name>: <reason>`.
