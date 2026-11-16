// ================================================================ the paper's measured results (exact transcription)
// Robotics 15(8):154. Shown beside every simulated number in the UI; never overwritten by the twin.
const PAPER = Object.freeze({
  ref: "Yang, Haddon-Hill, Zielinska, Murata. ActivAsk: Free-Energy-Guided Clarification for Robotic Grasping Under Ambiguous Instructions. Robotics 2026, 15(8), 154.",
  url: "https://www.mdpi.com/2218-6581/15/8/154",
  // Table 2 / Table 4: offline set
  offlineSet: { trials: 1512, scenes: 36, perMethod: 216, clear: 503, partial: 503, ambiguous: 506,
    uniqueInstructions: 189, meanS0: 2.49, s0Range: [0, 8], multiCandidate: { n: 697, of: 1512, pct: 46.10 } },
  onlineSet: { trials: 228, scenes: 20, perMethod: 57, perMethodType: 19 },
  // Table 5: offline descriptive results by method (accuracy %, Wilson 95 % CI, asked %, mean Q all / asked, time s)
  offline: {
    top:       { n: 216, correct: 116, acc: 53.70, ci: [47.05, 60.23], asked: 0.00,  qAll: 0.00, qAsked: null, tMean: 6.77,  tMed: 5.00 },
    random:    { n: 216, correct: 115, acc: 53.24, ci: [46.59, 59.78], asked: 0.00,  qAll: 0.00, qAsked: null, tMean: 7.77,  tMed: 4.23 },
    directVLM: { n: 216, correct: 116, acc: 53.70, ci: [47.05, 60.23], asked: 0.00,  qAll: 0.00, qAsked: null, tMean: 40.59, tMed: 9.75 },
    firstQ:    { n: 216, correct: 197, acc: 91.20, ci: [86.67, 94.30], asked: 46.76, qAll: 1.11, qAsked: 2.37, tMean: 86.02, tMed: 29.55 },
    randomQ:   { n: 216, correct: 196, acc: 90.74, ci: [86.13, 93.93], asked: 46.76, qAll: 1.12, qAsked: 2.39, tMean: 90.71, tMed: 40.99 },
    vlmQ:      { n: 216, correct: 199, acc: 92.13, ci: [87.76, 95.03], asked: 47.22, qAll: 1.09, qAsked: 2.30, tMean: 77.69, tMed: 33.61 },
    activask:  { n: 216, correct: 199, acc: 92.13, ci: [87.76, 95.03], asked: 48.15, qAll: 0.92, qAsked: 1.91, tMean: 74.84, tMed: 42.46 },
  },
  // Sec. 5.1: offline results by instruction type (all methods pooled)
  byType: {
    clear:     { correct: 483, n: 503, acc: 96.02, asked: 1.79,  qAsked: null },
    partial:   { correct: 349, n: 503, acc: 69.38, asked: 26.64, qAsked: 1.30 },
    ambiguous: { correct: 306, n: 506, acc: 60.47, asked: 52.37, qAsked: 2.75 },
  },
  byFamily: { bottles: 75.74, cups: 74.02, mixed: 80.58, utensils: 71.39 },
  // Question-count comparison on asked trials: ActivAsk vs baselines, overall and ambiguous only
  qReduction: [
    { ctx: "overall",   vs: "firstQ",  a: 1.90, b: 2.36, pct: 19.45, holm: 0.00111 },
    { ctx: "overall",   vs: "randomQ", a: 1.84, b: 2.30, pct: 19.71, holm: 0.00131 },
    { ctx: "overall",   vs: "vlmQ",    a: 1.90, b: 2.25, pct: 15.47, holm: 0.00422 },
    { ctx: "ambiguous", vs: "firstQ",  a: 2.20, b: 2.85, pct: 22.91, holm: 0.000182 },
    { ctx: "ambiguous", vs: "randomQ", a: 2.16, b: 2.83, pct: 23.88, holm: 0.000182 },
    { ctx: "ambiguous", vs: "vlmQ",    a: 2.22, b: 2.83, pct: 21.43, holm: 0.000555 },
  ],
  // Mean questions by initial candidate count |S0| (ideal = optimal binary-partition reference)
  qByS0: {
    2: { ideal: 1.000, firstQ: 1.000, randomQ: 1.053, vlmQ: 1.000, activask: 1.000 },
    3: { ideal: 1.667, firstQ: 1.909, randomQ: 1.909, vlmQ: 1.909, activask: 1.727 },
    4: { ideal: 2.000, firstQ: 2.167, randomQ: 2.444, vlmQ: 2.222, activask: 2.056 },
    5: { ideal: 2.400, firstQ: 2.667, randomQ: 3.000, vlmQ: 2.000, activask: 2.333 },
    6: { ideal: 2.667, firstQ: 3.450, randomQ: 3.158, vlmQ: 3.550, activask: 2.700 },
  },
  // Robustness: accuracy (%) under simulated answer noise eps, N = 98 trials per policy
  noise: { eps: [0, 0.05, 0.10, 0.15, 0.20],
    firstQ: [98.98, 87.78, 77.75, 68.78, 60.76], randomQ: [93.88, 82.92, 73.14, 64.39, 56.58],
    vlmQ: [96.94, 86.40, 76.96, 68.50, 60.90], activask: [98.98, 89.68, 81.05, 73.05, 65.62] },
  // Proposal count K = 1..5 (Sec. 5.3): mean minimum EFE and mean latency (s)
  kSweep: { K: [1, 2, 3, 4, 5], ambMinG: [-0.649, -0.655, -0.656, -0.669, -0.670],
    partMinG: [-0.664, -0.661, -0.674, -0.675, -0.681], latency: [3.49, 5.43, 6.97, 8.37, 10.42] },
  // Appendix B: proposal informativeness per policy instruction (mean proposal EFE, mean minimum EFE)
  proposalEFE: { firstQ: [-0.5436, -0.5941], randomQ: [-0.5491, -0.6038], vlmQ: [-0.5255, -0.5852], activask: [-0.5377, -0.5886] },
  // Online real-robot results (%, Wilson 95 % CI); attempts and non-executed are counts of 57
  online: {
    top:      { targetAcc: 59.65, targetCi: [46.70, 71.38], attempts: 34, grasp: 88.24, graspCi: [73.38, 95.33], full: 52.63, fullCi: [39.92, 65.01], nonExec: 23, q: null },
    random:   { targetAcc: 61.40, targetCi: [48.43, 72.94], attempts: 35, grasp: 82.86, graspCi: [67.32, 91.90], full: 50.88, fullCi: [38.26, 63.38], nonExec: 22, q: null },
    vlmQ:     { targetAcc: 91.23, targetCi: [81.06, 96.19], attempts: 52, grasp: 88.46, graspCi: [77.03, 94.60], full: 80.70, fullCi: [68.66, 88.87], nonExec: 5,  q: 2.25 },
    activask: { targetAcc: 92.98, targetCi: [83.30, 97.24], attempts: 53, grasp: 94.34, graspCi: [84.63, 98.06], full: 87.72, fullCi: [76.75, 93.92], nonExec: 4,  q: 1.84 },
  },
  // Grasp outcomes by object category (online, all methods)
  graspByCat: {
    cup:    { attempts: 59, ok: 57, rate: 96.61, note: "Occasional depth-crop offset or slip on smooth curved surfaces." },
    bottle: { attempts: 61, ok: 52, rate: 85.25, note: "Depth-crop offset, height and clearance constraints, slip on smooth cylinders." },
    fork:   { attempts: 26, ok: 21, rate: 80.77, note: "Thin geometry; SAM mask or depth-boundary error; edge or tip contact." },
    spoon:  { attempts: 28, ok: 25, rate: 89.29, note: "Thin or curved geometry; grasp point shifted to edge or handle boundary." },
  },
});
Object.assign(LOGIC, { PAPER });
