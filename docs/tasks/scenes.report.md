# Report: scenes (M6) · OpenCode · data only

Branch `feat/scenes`, worktree `~/code/activask-twin-wt/scenes`. Files touched: `src/js/11-scenes.js` (new),
`tests/scenes.test.mjs` (lead-provided, committed unedited), rebuilt `index.html`, this report.

## What I built

- `src/js/11-scenes.js`: pure data, no functions, no randomness — `SCENES` (56 scenes, objects without x/y/yaw,
  ids `o1..oN`) and `INSTRUCTIONS` (pool per scene id), published with `Object.assign(LOGIC, { SCENES, INSTRUCTIONS })`.
  No other module-scope names, so nothing besides the API names needed the `sc` prefix.
- 36 offline scenes (9 per family: cups ×6 objects, bottles ×4, utensils 3× four forks / 3× four spoons / 2:4, 3:3, 4:2
  six-object, mixed ×8) and 20 online scenes (5 per family: bottles ×3, utensils 2× four forks / 2× four spoons / 1× 4f+2s).
- 336 instructions: exactly 2 clear + 2 partial + 2 ambiguous per scene (112 per type). Every ambiguous pool uses only
  categories with ≥ 2 objects; matches list every object of the noun whose attributes equal all mods.
- Natural texts, lowercase, digit-free, 9 leading verbs (pick up, grab, get me, hand me, pass me, bring me, take, fetch,
  lift); every mod word appears literally in the text ("handle", "lid", colour/size/material words). Mods are always
  truthy (no `handle: false` / `lid: false` entries).
- Same-category objects always differ in ≥ 1 attribute and deliberately overlap one attribute (two orange cups, two
  metal forks, two clear bottles …), so every scene has real partial instructions.
- Generation/validation was scripted once (temp dir, not committed): matches computed from mods, then every acceptance
  rule plus realism rules re-checked before emitting the literal file.

## Test and perturbation counts

- `npm test`: **33 passed, 0 failed** (contracts.test.mjs + scenes.test.mjs), ends "all checks passed".
- `npm run perturb`: **6 of 6 CAUGHT**, including both perturbations of my module — "an online scene relabelled
  offline" fails 3 checks, "a clear instruction relabelled partial" fails 2 checks.
- Console errors: not applicable (data-only task; no browser run, no `tools/shots.mjs` shots).

## Calibration numbers

- Offline instructions 216 = 36 × 6; **189 unique offline texts — exactly `PAPER.offlineSet.uniqueInstructions` (189)**.
  Achieved by keeping all 144 clear/partial texts unique and reusing 8+8+14+15 = 45 ambiguous texts across the 72
  ambiguous entries (27 deliberate repeats). Test needs ≥ 150.
- Per-method protocol support: 2 instructions per type per scene → 72 per type per method = 216 trials/policy, matching
  the paper's 1512 offline trials across 7 methods and its near-equal type split (503/503/506).
- Online: 120 instructions; 108 unique texts of 120 (reuse across sets is fine; the test only counts offline).
- Objects over all 56 scenes: 311 total — 120 cups, 79 bottles, 58 forks, 54 spoons. All 10 colours (incl. clear),
  all 5 materials, all 3 sizes in use.

## Assumptions (twin assumptions, labelled in the module header)

1. **Material realism** (task directive, not test-enforced): cups are ceramic or paper (paper never has a handle,
   ceramic never lidded), bottles glass or plastic, utensils metal or plastic; metal utensils are grey, "clear" is
   used only for bottles. No plastic cups.
2. **Exactly 2+2+2 instructions per scene**: the paper's 216 trials/policy with near-equal types implies 72 per type =
   36 scenes × 2; pools stay small and deterministic.
3. **Partial-instruction feasibility constraint** (affects composition choice): a partial needs 2 ≤ matches < all of
   the category, so a category with exactly 2 objects in a scene can never have a partial. Hence every mixed scene has
   ≥ 3 of some category: 3 cups + 2 bottles + 3 utensils (split 2+1), or 2 cups + 2 bottles + 4 utensils with a 3+1 or
   1+3 split (never 2+2); in the 2:4 / 4:2 utensil scenes partials use the 4-object side. The lead may want this in mind
   when reading perception calibration (partial queries never occur for 2-object categories).
4. **Ambiguous reuse**: ambiguous texts repeat across scenes (27 repeats) to hit the paper's 189 unique count; clear
   and partial texts never repeat offline.
5. Online scenes are distinct data (different attribute mixes), not copies of offline ones.
6. Instruction texts are lowercase (as in the task's example); the test lowercases before matching, so this is safe.

## TODO-SOURCE

- None. All counts/families/types come from the paper's Sec. 4.1 description or `PAPER`; object attribute values are
  synthetic protocol data, labelled "twin-assumed" in the module header comment.

## Decisions for the lead

- Committed the rebuilt `index.html` together with `src/js/11-scenes.js`: `tests/run.mjs` reads `index.html` by default
  and `npm test` rebuilds it anyway; committing it keeps a fresh checkout of the branch testable and the artifact in
  sync with `src/js` (the repo already tracks it from M0).
- The one-off generator script lives outside the repo (temp dir); the checked-in file is hand-readable plain data.

## Open questions

- If `15-experiments.js` wants 3 instructions per type per scene (to sample more variety), pools can be extended
  without breaking the test (≥ 2 required); current pools are minimal-by-design to match the 216-trial protocol.
- `13-perception.js` may want to know: partial instructions exist for sizes/materials/colours/handles/lids, but never
  for a 2-object category (see assumption 3).
