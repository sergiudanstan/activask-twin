# ActivAsk Twin

Browser digital twin of **ActivAsk: Free-Energy-Guided Clarification for Robotic Grasping Under Ambiguous
Instructions** (Yang, Haddon-Hill, Zielinska, Murata, *Robotics* 15(8):154, 2026,
[mdpi.com/2218-6581/15/8/154](https://www.mdpi.com/2218-6581/15/8/154)).

A Hello Robot Stretch 3 hears "pick up my cup" with several cups on the table. It builds candidates, asks
yes/no questions chosen by expected free energy, narrows the candidates with each answer, and grasps only
when one target remains. Answer the questions yourself (Interactive) or let a simulated operator answer (Auto).

The decision logic follows the paper exactly; perception, the VLM and grasp physics are simulated, and every
simulated number is shown beside the paper's measured one.

Live: https://sergiudanstan.github.io/activask-twin/

```sh
npm install
npm test          # build index.html from src/ and run the logic checks
npm run perturb   # mutation checks: every perturbation must be caught
```
`index.html` is generated from `src/` by `tools/build.mjs`; do not edit it by hand. Contracts: `docs/SPEC.md`.
