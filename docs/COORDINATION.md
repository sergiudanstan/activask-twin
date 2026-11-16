# Coordination

Plan: `~/.claude/plans/ok-like-this-mini-curried-milner.md`. **Lead: Claude (herdr `wX:p1`).** Only the lead
merges into `main`, pushes, and sends prompts. Workers commit only on `feat/<name>` in
`~/code/activask-twin-wt/<name>`, touch only their own files, and never push.

| Task | Files | Owner | Branch | State |
|---|---|---|---|---|
| M0 scaffold + contracts | shell, 10, 12, 19, tests harness, tools | Claude | main | done (e1b460c, af204e0 layout fix) |
| scenes data (M6) | 11 | OpenCode `wX:p4` | feat/scenes | merged (d6a3176): 56 scenes, 336 instructions, 189 unique offline texts |
| reasoning (M2+M3) | 13, 14 | Grok `wX:p5` (moved from Codex: read-only sandbox outside its cwd, weekly limit 1 %) | feat/reasoning | merged (5c71972): 86 checks, 12 perturbations |
| scene (M1) | 16 (specs), 25, 26, 40 | Grok `wX:p2` | feat/scene | merged (2e6fd38): sourced Stretch 3 specs, lab, objects, robot |
| experiments (M5) | 15, PER_SCORE calibration | Grok `wX:p5` | feat/experiments | in progress |
| grasp (M4) | 16 (IK), 41 | Grok `wX:p2` | feat/grasp | in progress |
| ui (M7a) | page, 50, 60, 65, 66 | Grok `wX:p6` (new tab) | feat/ui | in progress |
| integration + deploy (M7) | 70, review, Pages | Claude | main | last |