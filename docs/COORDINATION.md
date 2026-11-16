# Coordination

Plan: `~/.claude/plans/ok-like-this-mini-curried-milner.md`. **Lead: Claude (herdr `wX:p1`).** Only the lead
merges into `main`, pushes, and sends prompts. Workers commit only on `feat/<name>` in
`~/code/activask-twin-wt/<name>`, touch only their own files, and never push.

| Task | Files | Owner | State |
|---|---|---|---|
| M0 scaffold + contracts | shell, 10, 12, 19, harness, tools | Claude | merged |
| scenes data (M6) | 11 | OpenCode `wX:p4` | merged |
| sweep (property test) | tests/sweep | OpenCode `wX:p4` | merged; found the repeated-question bug |
| reasoning (M2+M3) | 13, 14 | Grok `wX:p5` (moved from Codex: read-only sandbox, weekly limit) | merged |
| scene (M1) | 16 specs, 25, 26, 40 | Grok `wX:p2` | merged |
| experiments (M5) + calibration | 15, PER_* | Grok `wX:p5` | merged after adversarial review |
| grasp (M4) + r1 | 16, 41, 25, 40 | Grok `wX:p2` | merged after review (13 findings fixed) and re-check (0 penetrations > 0.5 mm in 10,038 grasps) |
| ui (M7a) + r1 | page, 50, 60, 65, 66 | Grok `wX:p6` (new tab) | merged after review (24 findings) |
| expui + r1 | 67, raw flags in 14 | Grok `wX:p5` | merged |
| docs | README, FIDELITY | Grok `wX:p5` | merged |
| integration + deploy | 20, 66 fixes, Pages | Claude | live: 01e1f0f |

Open: lateral clearance margin in the grasp corridor test (contacts of 0.5-2 mm allowed); FIDELITY.md line
references not re-verified after the r1 merges; README screenshot marker empty; the grasp r1 visual re-check did not
run (Claude usage limit), only the kinematic one.