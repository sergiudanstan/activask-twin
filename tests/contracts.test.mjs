// Contracts (10-contracts.js) and the paper transcription (12-paper.js).
export default function (L, check) {
  const P = L.PARAMS;
  check(P.tau === 0.38 && P.textThr === 0.30 && P.nmsIoU === 0.50 && P.maxDet === 100 && P.K === 4, "PARAMS match the paper (tau 0.38, text 0.30, NMS 0.50, 100 dets, K 4)");
  check(L.POLICIES.length === 7 && L.POLICIES.every((p) => L.PAPER.offline[p.id]), "7 policies, each with offline paper results");
  check(L.POLICIES.filter((p) => p.online).map((p) => p.id).join() === "top,random,vlmQ,activask", "online subset = top, random, VLM-selected, ActivAsk");
  check(L.PAPER.offline.activask.acc === 92.13 && L.PAPER.offline.activask.qAsked === 1.91, "ActivAsk offline 92.13 %, 1.91 questions on asked trials");
  check(L.PAPER.online.activask.full === 87.72 && L.PAPER.online.activask.targetAcc === 92.98, "ActivAsk online: 92.98 % target, 87.72 % full task");
  // the paper's 'ideal reference' is the mean depth of an optimal binary partition tree over n equally likely candidates
  const ideal = (n) => { const k = Math.floor(Math.log2(n)); return (n * k + 2 * (n - 2 ** k)) / n; };
  check([2, 3, 4, 5, 6].every((n) => Math.abs(L.PAPER.qByS0[n].ideal - ideal(n)) < 5e-4), "ideal questions vs |S0| = optimal binary tree depth (1, 1.667, 2, 2.4, 2.667)");
  check(Math.abs(L.PAPER.offlineSet.multiCandidate.n / L.PAPER.offlineSet.multiCandidate.of * 100 - L.PAPER.offlineSet.multiCandidate.pct) < 0.01, "multi-candidate rate 697/1512 = 46.10 %");
  const okObj = { id: "o1", cat: "cup", color: "orange", size: "medium", material: "ceramic", handle: true, lid: false };
  check(L.checkObject(okObj).length === 0, "checkObject accepts a valid cup");
  check(L.checkObject({ ...okObj, cat: "fork", handle: true }).length > 0, "checkObject rejects a fork with a handle");
  check(L.checkObject({ ...okObj, color: "teal" }).length > 0, "checkObject rejects an unknown colour");
  const r1 = L.rng(7), r2 = L.rng(7);
  check([1, 2, 3].every(() => r1() === r2()), "rng is deterministic per seed");
  const scene = { id: "t", set: "offline", family: "cups", objects: Array.from({ length: 8 }, (_, i) => ({ ...okObj, id: `o${i + 1}` })) };
  const a = L.layoutScene(scene, 3), b = L.layoutScene(scene, 3);
  check(JSON.stringify(a) === JSON.stringify(b), "layoutScene is deterministic");
  const T = L.TABLE, objs = a.objects;
  const discs = objs.map((o) => L.footprintDiscs(o, o.x, o.y, o.yaw));
  const inside = discs.flat().every(([u, v, q]) => Math.abs(u) + q <= T.w / 2 && Math.abs(v) + q <= T.d / 2);
  const apart = discs.every((A, i) => discs.every((B, j) => i >= j || A.every(([u, v, q]) => B.every(([u2, v2, q2]) => Math.hypot(u - u2, v - v2) > q + q2))));
  check(inside && apart, "layoutScene keeps 8 cups on the table without overlap");
  // camera: the look point projects to the image centre; every laid-out object is inside the image
  const c = L.camProject(L.CAM_POSE.look);
  check(Math.abs(c[0] - L.CAM.w / 2) < 1e-6 && Math.abs(c[1] - L.CAM.h / 2) < 1e-6, "camProject maps the look point to the image centre");
  const seen = objs.every((o) => { const q = L.camProject([o.x, o.y, T.h]); return q && q[0] > 0 && q[0] < L.CAM.w && q[1] > 0 && q[1] < L.CAM.h; });
  check(seen, "every laid-out object is inside the head-camera image");
  const left = L.camProject([-0.3, 0, T.h]), right = L.camProject([0.3, 0, T.h]);
  check(left[0] < right[0], "image u grows with cell x (left stays left)");
}
export const perturbations = [
  { name: "box threshold 0.38 -> 0.50", find: "tau: 0.38,", replace: "tau: 0.50," },
  { name: "ideal |S0|=5 reference 2.400 -> 2.500", find: "5: { ideal: 2.400", replace: "5: { ideal: 2.500" },
  { name: "camera right vector flipped", find: "let rx = fy, ry = -fx", replace: "let rx = -fy, ry = fx" },
  { name: "layout overlap test removed", find: "> q + q2 + LAYOUT_GAP", replace: "> -1" },
];
