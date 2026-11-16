# Task: expui (Experiments panel) · Grok · port 8793

Read `_common.md` first. Worktree `~/code/activask-twin-wt/expui`, branch `feat/expui`, created from your
`feat/experiments` branch (so `runBatch`, `summarize`, `wilson`, `epsSweep`, `kSweep` are there). A parallel worker
owns `page.html`, `50`, `60`, `65`, `66` (task `ui`); you must not edit those.

**Files:** new `src/js/67-expui.js` only (prefix `exu`), plus your report. It renders into `#exp` (the Experiments
card body, already in `page.html`) and fills the twin cells of the Paper-vs-twin table: every element matching
`[data-twin="<policy id>"]` inside `#report` gets the twin's offline accuracy (Wilson CI in a `title`).

## Panel
- Controls: set (offline / online), seed, ε, K, slip; "Run batch" (runs `runBatch` synchronously, it takes ~40 ms;
  disable the button while it runs) and "Copy batch CSV" (one row per trial).
- Tables, every twin number labelled *simulated* beside the paper's (`PAPER`):
  offline per policy: acc % ± CI, asked %, Q all, Q on asked trials; online per policy: target acc, attempts,
  grasp %, full-task %, non-executed; by instruction type.
- Charts as inline SVG (no libraries; use the CSS variables of the page for colours; readable in light and dark):
  1. mean questions by |S0| = 2..6: ideal reference, paper ActivAsk, twin ActivAsk, twin firstQ/randomQ/vlmQ;
  2. accuracy vs ε (0..0.2): paper and twin for the four clarifying policies (`epsSweep`);
  3. mean minimum G vs K = 1..5 for partial and ambiguous (`kSweep`) beside `PAPER.kSweep`.
- Run one offline batch automatically on load (after the page is ready: `queueMicrotask`), so the Paper table's twin
  column is filled without a click.
- Register `CHECKS.push({ name: "experiments panel", run: () => ({ ok, detail }) })`: the twin column has 7 numbers
  and the three charts exist.

## Checks
`npm test` + `npm run perturb` green; shots with `--query "panels=exp,report"` (and the same in dark: add
`theme` by clicking is not possible headless, so also check `prefers-color-scheme` is handled by CSS variables);
0 console errors; `pc.checks()` ok. Look at the PNGs: axes labelled, legends, nothing overlapping, numbers readable
at the drawer width (≈ 340 px). Report as usual.
