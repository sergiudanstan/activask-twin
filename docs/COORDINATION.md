# Coordination

Plan: `~/.claude/plans/ok-like-this-mini-curried-milner.md`. **Lead: Claude (herdr `wX:p1`).** Only the lead
merges into `main`, pushes, and sends prompts. Workers commit only on `feat/<name>` in
`~/code/activask-twin-wt/<name>`, touch only their own files, and never push.

| Task | Files | Owner | Branch | State |
|---|---|---|---|---|
| M0 scaffold + contracts | shell, 10, 12, 19, tests harness, tools | Claude | main | done |
| scene (M1) | 16 (specs), 25, 26, 40 | Grok `wX:p2` | feat/scene | dispatched |
| reasoning (M2+M3) | 13, 14 | Codex `wX:p3` | feat/reasoning | dispatched |
| scenes data (M6) | 11 | OpenCode `wX:p4` | feat/scenes | dispatched |
| grasp (M4) | 16 (IK), 41 | Grok | feat/grasp | after scene |
| experiments (M5) | 15 | Codex | feat/experiments | after reasoning + scenes |
| integration + deploy (M7) | 60, 70, page | Claude | main | last |
