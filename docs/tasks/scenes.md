# Task: scenes (M6) · OpenCode · data only

Read `_common.md` first. Worktree `~/code/activask-twin-wt/scenes`, branch `feat/scenes`.

**Files:** `src/js/11-scenes.js` only. Prefix `sc`. The acceptance test `tests/scenes.test.mjs` is already in your
worktree: **do not edit it**. Your work is done when `npm test` passes it and `npm run perturb` catches both
perturbations.

Write plain data (no randomness, no functions except a tiny helper if you need one), in exactly this style:
```js
// ================================================================ scenes and instruction pools (Sec. 4.1)
const SCENES = [
  { id: "off-cups-01", set: "offline", family: "cups", objects: [
    { id: "o1", cat: "cup", color: "orange", size: "medium", material: "ceramic", handle: true, lid: false },
    ...
  ] },
  ...
];
const INSTRUCTIONS = {
  "off-cups-01": [
    { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: ["o1", "o2", "o3", "o4", "o5", "o6"] },
    { text: "pick up the orange cup", type: "partial", noun: "cup", mods: { color: "orange" }, matches: ["o1", "o4"] },
    { text: "pick up the small blue cup with a lid", type: "clear", noun: "cup", mods: { color: "blue", size: "small", lid: true }, matches: ["o3"] },
  ],
  ...
};
Object.assign(LOGIC, { SCENES, INSTRUCTIONS });
```
Rules (the test checks every one):
- 36 offline scenes (ids `off-<family>-NN`, 9 per family) and 20 online scenes (ids `on-<family>-NN`, 5 per family).
- cups: 6 cups. bottles: 4 (offline) or 3 (online). utensils offline: 3 scenes with four forks, 3 with four spoons,
  3 with six objects with fork:spoon 2:4, 3:3, 4:2; online: 2 four-fork, 2 four-spoon, 1 with four forks + two spoons.
  mixed: 8 objects = 2–3 cups + exactly 2 bottles + forks/spoons (3–4 together).
- Allowed values: `cat` cup/bottle/fork/spoon; `color` white black red orange yellow green blue pink grey clear;
  `size` small/medium/large; `material` ceramic glass plastic metal paper. `handle` only on cups (true/false);
  `lid` only on cups and bottles (true/false); forks and spoons have neither key. Object ids o1..on in each scene.
- Objects of the same category in one scene must differ in at least one of colour, size, material, handle, lid.
  Make scenes realistic (ceramic or paper cups, glass or plastic bottles, metal or plastic utensils) and give
  same-category objects overlapping attributes, so partial instructions exist (two orange cups, two metal forks...).
- Every scene: at least 2 instructions of each type. `matches` = every object of category `noun` whose attributes
  equal all `mods`. clear = exactly 1 match; partial = mods non-empty and 2 ≤ matches < all of that category;
  ambiguous = mods empty, matches = all objects of that category (at least 2).
- Texts: natural English commands ("pick up my cup", "hand me the metal fork", "bring me the small green bottle"),
  contain the noun and every mod word (handle → "handle", lid → "lid"), no digits. Vary the verbs.
  At least 150 different texts over the offline scenes.
