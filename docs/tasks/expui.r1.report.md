# Report: expui r1 · Grok

Branch `feat/expui-r1` from main `337c858`. Files: `src/js/14-clarify.js` (U14 only), `src/js/67-expui.js`, `tests/clarify.test.mjs`, `README.md`, `docs/FIDELITY.md`. Did not edit `60`, `65`, `66`, `50`, or `page.html`.

## What changed

- U14. Every proposal from `proposeQuestions` keeps `raw` (the four validity flags of the text and branches before repair), `valid` (after repair), and booleans `repaired` and `fallback`. With slip 0, `raw` equals `valid` and both booleans are false. A damaged proposal keeps the failing flag on `raw` while `valid` is all true. `repaired` and `fallback` are mutually exclusive.
- U12. Online grasp % and full-task % are labelled "sampled from the paper's category rates (not out-of-sample)". The cell tag is the short word "sampled" so the digits stay readable in the 360 px drawer; the column title and the note under the table use the full phrase. Only target accuracy is tagged out-of-sample. Tries and skip are twin counts and are not tagged out-of-sample.
- U13. The asked-rate paper cell is the derived figure, with the derivation on the line under it (`derived 1.79 × 7/4` and the same for partial and ambiguous). The twin line shows the five-seed value and the residual. Clear is fitted · −0.91 pt. The note states the three residuals and says a residual is not agreement. Mean |S0| and the multi-candidate rate stay calibrated, agreement by construction.
- U24. The Paper-vs-twin header (`#report h3`) reads "paper: 216 trials per method · twin column: 5-seed mean of 216 trials per policy per seed". The same sentence is the experiments headline. The twin column header stays "Twin acc %" plus the sim mark. The full sentence does not fit that 18% column.

## Numbers

Recomputed on this main from the logic block, the same way `tests/run.mjs` loads it. Seeds 1–5, `runBatch` / `epsSweep` / `kSweep`, unweighted mean of the per-seed rates. They match `docs/tasks/docs.report.md`. Offline five batches: 0.17 s.

Clear asked rate 2.222 against derived 1.79 × 7/4 = 3.1325, residual −0.910 pt, −29%. Partial 47.778 against 46.62, +1.16 pt. Ambiguous 89.722 against 91.6475, −1.93 pt. Headline accuracies unchanged: top 60.00, random 54.72, direct VLM 60.37, clarifying policies 86.85.

## Checks

- `npm test`: 166 passed, 0 failed, 7 files, ends "all checks passed".
- `npm run perturb`: all 22 caught. New one: "raw flags copied from valid" (1 check failed, the slip 0.3 test). Slip 0 still passes under that copy, which is why the slip 0.3 test is the one that catches it. At slip 0.3 the suite saw 45 of 160 proposals with a false `raw` flag.
- `node tools/shots.mjs --port 8811 --query "panels=exp,report" --view iso --t 1 --out _shots/expui-r1`: console errors 0. `pc.checks()` ok (headcam boxes, experiments panel: 7 twin accuracies and 3 charts).
- Same query in light and dark (`at-theme` set before load). Dark `--ink` is `#ece6e1`. Both: console errors 0, `pc.checks()` ok. Report header states the 5-seed mean. Asked table shows the × 7/4 derivation and the clear residual, and does not say agreement by construction. Switching the set to online and pressing Run batch leaves the Paper column at 60.00, 54.72, 60.37, 86.85. The online note uses the sampled phrase. Grasp and full cells are tagged sampled. Target cells are tagged out-of-sample.

## Decisions

- The sampled badge on the cell is the word "sampled". The required sentence is the note and the tooltip. A full-sentence badge wraps over the digits in this drawer.
- Tries and skip are not called out-of-sample. The review's sentence names target accuracy as the only out-of-sample online rate.
- The Paper column header is not rewritten with the long sentence. The section header carries it. `60-ui.js` is the other worker's file; this module sets the header text after that card renders.
- `index.html` is generated. It was rebuilt for the checks and is not in the commit.
- No perception retune. The clear miss stays visible.

## TODO-SOURCE

None new. The seven existing `TODO-SOURCE` comments are unchanged. `docs/FIDELITY.md` still names each of them, and it now cites `raw` at `src/js/14-clarify.js:323`.

## Open questions

- The Clarify card still paints `valid` only (`60-ui.js`). `raw`, `repaired`, and `fallback` are on the proposal for that worker to render. This task was the logic side.
- The "fitted · −0.91 pt" tag wraps to two lines in the asked column. The residual is also in the note under the table.
