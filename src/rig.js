// Skeleton rig for the exercise figures.
//
// A pose is authored the way a coach would describe it: where the hips are,
// where the feet are planted, how far the torso is leaning. Limb joints are
// then solved with two-bone inverse kinematics, so feet stay on the floor and
// knees and elbows always connect to the segments either side of them.
//
// Angles are degrees. Two conventions, both measured from a parent joint:
//   up(a):   0 = straight up,   +90 = forward (+x)
//   down(a): 0 = straight down, +90 = forward (+x)

const D2R = Math.PI / 180;

export const SEG = { shin: 24, thigh: 24, torso: 30, neck: 11, uarm: 17, farm: 16, foot: 11, head: 7 };

const up = (p, L, a) => [p[0] + L * Math.sin(a * D2R), p[1] - L * Math.cos(a * D2R)];
const dn = (p, L, a) => [p[0] + L * Math.sin(a * D2R), p[1] + L * Math.cos(a * D2R)];

// Two-bone IK. Returns [joint, end]; end is clamped into reach so a limb
// never stretches past its own length.
function ik2(root, target, L1, L2, sign) {
  let dx = target[0] - root[0];
  let dy = target[1] - root[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const max = L1 + L2 - 0.01;
  const min = Math.abs(L1 - L2) + 0.01;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  else if (d < min) { dx *= min / d; dy *= min / d; d = min; }
  const end = [root[0] + dx, root[1] + dy];
  const a1 = (d * d + L1 * L1 - L2 * L2) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
  const ux = dx / d, uy = dy / d;
  const mx = root[0] + ux * a1, my = root[1] + uy * a1;
  const joint = [mx + sign * -uy * h, my + sign * ux * h];
  return [joint, end];
}

// Build one frame of world-space joint positions from a pose.
export function solve(p) {
  const hip = p.hip;
  const neck = up(hip, SEG.torso, p.torso);
  const head = up(neck, SEG.neck, p.torso + (p.head || 0));

  const leg = (foot, sign, toe, ang) => {
    let knee, ankle;
    if (foot) {
      [knee, ankle] = ik2(hip, foot, SEG.thigh, SEG.shin, sign);
    } else {
      knee = dn(hip, SEG.thigh, ang[0]);
      ankle = dn(knee, SEG.shin, ang[1]);
    }
    return { knee, ankle, toe: dn(ankle, SEG.foot, toe) };
  };
  const arm = (hand, sign, ang) => {
    let elbow, wrist;
    if (hand) {
      [elbow, wrist] = ik2(neck, hand, SEG.uarm, SEG.farm, sign);
    } else {
      elbow = dn(neck, SEG.uarm, ang[0]);
      wrist = dn(elbow, SEG.farm, ang[1]);
    }
    return { elbow, hand: wrist };
  };

  const legN = leg(p.fN, p.kneeN ?? -1, p.toeN ?? 88, p.legAN || [0, 0]);
  const legF = leg(p.fF, p.kneeF ?? -1, p.toeF ?? 88, p.legAF || [0, 0]);
  const armN = arm(p.hN, p.elbN ?? 1, p.armAN || [4, 2]);
  const armF = arm(p.hF, p.elbF ?? 1, p.armAF || [4, 2]);

  return { hip, neck, head, legN, legF, armN, armF };
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (a, b, t) => (a && b ? [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] : a || b || null);

function lerpPose(A, B, t) {
  const o = {};
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  keys.forEach((k) => {
    const a = A[k], b = B[k];
    if (Array.isArray(a) || Array.isArray(b)) {
      if (Array.isArray(a) && Array.isArray(b) && typeof a[0] === 'number') o[k] = lerpPt(a, b, t);
      else o[k] = t < 0.5 ? a : b;
    } else if (typeof a === 'number' && typeof b === 'number') o[k] = lerp(a, b, t);
    else o[k] = a === undefined ? b : a;
  });
  return o;
}

/* ------------------------------------------------------------------ */
/* Poses. Each kind: { a, b, gear, prop, ms }                          */
/* Floor y = 110. A standing figure's hip sits at y = 62.              */
/* ------------------------------------------------------------------ */

const hang = { armAN: [5, 3], armAF: [5, 3] };
const feetF = (x) => [x, 110];

export const POSES = {
  /* ---- lower body ---- */
  goblet: {
    ms: 1500, gear: { type: 'db', at: 'goblet' },
    a: { hip: [50, 62], torso: 6, fN: [52, 110], fF: [45, 110], hN: [62, 50], hF: [56, 51], elbN: 1, elbF: 1 },
    b: { hip: [40, 80], torso: 30, fN: [52, 110], fF: [45, 110], hN: [60, 62], hF: [54, 63], elbN: 1, elbF: 1 },
  },
  split: {
    ms: 1500, gear: { type: 'db', at: 'both' }, prop: { type: 'box', x: 6, y: 86, w: 26, h: 24 },
    a: { hip: [48, 62], torso: 8, fN: [52, 110], fF: [19, 86], kneeF: -1, toeF: 60, ...hang },
    b: { hip: [42, 77], torso: 13, fN: [52, 110], fF: [19, 86], kneeF: -1, toeF: 60, ...hang },
  },
  lunge: {
    ms: 1600, gear: { type: 'db', at: 'both' },
    a: { hip: [52, 62], torso: 5, fN: [60, 110], fF: [44, 110], ...hang },
    b: { hip: [46, 80], torso: 7, fN: [74, 110], fF: [24, 110], kneeF: -1, toeF: 55, ...hang },
  },
  stepup: {
    ms: 1600, gear: { type: 'db', at: 'both' }, prop: { type: 'box', x: 58, y: 88, w: 40, h: 22 },
    a: { hip: [44, 66], torso: 10, fN: [68, 88], fF: [36, 110], ...hang },
    b: { hip: [66, 46], torso: 6, fN: [68, 88], fF: null, legAF: [-34, -14], toeF: 70, ...hang },
  },
  calf: {
    ms: 1100, gear: { type: 'db', at: 'near' }, prop: { type: 'box', x: 10, y: 104, w: 54, h: 12 },
    a: { hip: [50, 66], torso: 3, fN: [52, 114], fF: [45, 114], toeN: 76, toeF: 76, ...hang },
    b: { hip: [50, 54], torso: 3, fN: [52, 102], fF: [45, 102], toeN: 128, toeF: 128, ...hang },
  },
  rdl: {
    ms: 1700, gear: { type: 'db', at: 'both' },
    a: { hip: [50, 62], torso: 5, fN: [50, 110], fF: [43, 110], ...hang },
    b: { hip: [58, 66], torso: 74, fN: [50, 110], fF: [43, 110], ...hang },
  },
  slrdl: {
    ms: 1800, gear: { type: 'db', at: 'near' },
    a: { hip: [50, 62], torso: 6, fN: [50, 110], fF: [43, 110], ...hang },
    b: { hip: [58, 64], torso: 80, fN: [50, 110], fF: null, legAF: [78, 84], toeF: 150, ...hang },
  },
  thrust: {
    ms: 1400, gear: { type: 'db', at: 'hip' }, prop: { type: 'mat' },
    a: { hip: [48, 94], torso: 112, head: 8, fN: [14, 108], fF: [16, 103], kneeN: 1, kneeF: 1, toeN: -74, toeF: -74,
         armAN: [96, 86], armAF: [96, 86] },
    b: { hip: [48, 78], torso: 126, head: -6, fN: [14, 108], fF: [16, 103], kneeN: 1, kneeF: 1, toeN: -74, toeF: -74,
         armAN: [96, 86], armAF: [96, 86] },
  },

  /* ---- trunk ---- */
  plank: {
    ms: 2400, prop: { type: 'mat' },
    a: { hip: [60, 90], torso: -84, head: -4, fN: [104, 102], fF: [100, 105], kneeN: -1, kneeF: -1, toeN: 128, toeF: 128,
         hN: [22, 104], hF: [22, 100], elbN: -1, elbF: -1 },
    b: { hip: [60, 94], torso: -88, head: 2, fN: [104, 102], fF: [100, 105], kneeN: -1, kneeF: -1, toeN: 128, toeF: 128,
         hN: [22, 104], hF: [22, 100], elbN: -1, elbF: -1 },
  },
  roller: {
    ms: 2000, gear: { type: 'roller', at: 'near' }, prop: { type: 'mat' },
    a: { hip: [68, 82], torso: -70, head: -8, legAN: [6, 98], legAF: [10, 100], toeN: 96, toeF: 96,
         hN: [42, 100], hF: [42, 96], elbN: -1, elbF: -1 },
    b: { hip: [62, 92], torso: -86, head: 4, legAN: [6, 98], legAF: [10, 100], toeN: 96, toeF: 96,
         hN: [6, 102], hF: [6, 98], elbN: -1, elbF: -1 },
  },

  /* ---- push ---- */
  floorpress: {
    ms: 1500, gear: { type: 'db', at: 'both' }, prop: { type: 'mat' },
    a: { hip: [42, 98], torso: 92, head: 4, fN: [20, 104], fF: [20, 100], kneeN: -1, kneeF: -1, toeN: -82, toeF: -82,
         hN: [60, 90], hF: [60, 94], elbN: -1, elbF: -1 },
    b: { hip: [42, 98], torso: 92, head: 4, fN: [20, 104], fF: [20, 100], kneeN: -1, kneeF: -1, toeN: -82, toeF: -82,
         hN: [72, 66], hF: [72, 70], elbN: -1, elbF: -1 },
  },
  pushup: {
    ms: 1500, prop: { type: 'box', x: 72, y: 78, w: 30, h: 32 },
    a: { hip: [48, 92], torso: 66, head: 6, fN: [18, 106], fF: [14, 108], kneeN: -1, kneeF: -1, toeN: 60, toeF: 60,
         hN: [80, 78], hF: [80, 82], elbN: -1, elbF: -1 },
    b: { hip: [44, 96], torso: 70, head: 10, fN: [18, 106], fF: [14, 108], kneeN: -1, kneeF: -1, toeN: 60, toeF: 60,
         hN: [80, 78], hF: [80, 82], elbN: 1, elbF: 1 },
  },
  bandpress: {
    ms: 1400, gear: { type: 'band', at: 'backHands' },
    a: { hip: [44, 62], torso: 4, fN: [46, 110], fF: [39, 110], hN: [58, 46], hF: [56, 50], elbN: -1, elbF: -1 },
    b: { hip: [44, 62], torso: 4, fN: [46, 110], fF: [39, 110], hN: [82, 42], hF: [80, 46], elbN: -1, elbF: -1 },
  },
  lateral: {
    ms: 1400, gear: { type: 'db', at: 'both' },
    a: { hip: [50, 62], torso: 3, fN: [52, 110], fF: [45, 110], armAN: [8, 6], armAF: [8, 6] },
    b: { hip: [50, 62], torso: 3, fN: [52, 110], fF: [45, 110], armAN: [58, 56], armAF: [58, 56] },
  },
  triceps: {
    ms: 1400, gear: { type: 'db', at: 'both' }, prop: { type: 'mat' },
    a: { hip: [42, 98], torso: 92, head: 4, fN: [20, 104], fF: [20, 100], kneeN: -1, kneeF: -1, toeN: -82, toeF: -82,
         hN: [62, 78], hF: [62, 82], elbN: -1, elbF: -1 },
    b: { hip: [42, 98], torso: 92, head: 4, fN: [20, 104], fF: [20, 100], kneeN: -1, kneeF: -1, toeN: -82, toeF: -82,
         hN: [74, 68], hF: [74, 72], elbN: -1, elbF: -1 },
  },

  /* ---- pull ---- */
  row: {
    ms: 1400, gear: { type: 'db', at: 'near' }, prop: { type: 'box', x: 4, y: 82, w: 34, h: 28 },
    a: { hip: [66, 70], torso: 104, head: -10, fN: [70, 110], fF: [22, 82], kneeF: 1, toeF: 70,
         hN: [34, 98], hF: [24, 82], elbN: -1, elbF: -1 },
    b: { hip: [66, 70], torso: 104, head: -10, fN: [70, 110], fF: [22, 82], kneeF: 1, toeF: 70,
         hN: [48, 76], hF: [24, 82], elbN: -1, elbF: -1 },
  },
  bandrow: {
    ms: 1400, gear: { type: 'band', at: 'handsFeet' }, prop: { type: 'mat' },
    a: { hip: [36, 88], torso: 14, fN: [86, 104], fF: [86, 100], kneeN: -1, kneeF: -1, toeN: 120, toeF: 120,
         hN: [76, 82], hF: [76, 86], elbN: -1, elbF: -1 },
    b: { hip: [36, 88], torso: 6, fN: [86, 104], fF: [86, 100], kneeN: -1, kneeF: -1, toeN: 120, toeF: 120,
         hN: [52, 80], hF: [52, 84], elbN: 1, elbF: 1 },
  },
  pullapart: {
    ms: 1500, gear: { type: 'band', at: 'hands' },
    a: { hip: [48, 62], torso: 3, fN: [48, 110], fF: [41, 110], hN: [80, 44], hF: [78, 47], elbN: -1, elbF: -1 },
    b: { hip: [48, 62], torso: 3, fN: [48, 110], fF: [41, 110], hN: [86, 40], hF: [20, 48], elbN: -1, elbF: 1 },
  },
  reardelt: {
    ms: 1500, gear: { type: 'db', at: 'both' },
    a: { hip: [56, 66], torso: 72, fN: [50, 110], fF: [43, 110], hN: [78, 88], hF: [74, 92], elbN: -1, elbF: -1 },
    b: { hip: [56, 66], torso: 72, fN: [50, 110], fF: [43, 110], hN: [96, 62], hF: [62, 60], elbN: -1, elbF: -1 },
  },
  curl: {
    ms: 1400, gear: { type: 'db', at: 'both' },
    a: { hip: [50, 62], torso: 4, fN: [52, 110], fF: [45, 110], armAN: [6, 4], armAF: [6, 4] },
    b: { hip: [50, 62], torso: 4, fN: [52, 110], fF: [45, 110], armAN: [10, 142], armAF: [10, 142] },
  },
  hammer: {
    ms: 1400, gear: { type: 'db', at: 'both', neutral: true },
    a: { hip: [50, 62], torso: 4, fN: [52, 110], fF: [45, 110], armAN: [4, 2], armAF: [4, 2] },
    b: { hip: [50, 62], torso: 4, fN: [52, 110], fF: [45, 110], armAN: [6, 136], armAF: [6, 136] },
  },

  /* ---- conditioning ---- */
  run: {
    ms: 620,
    a: { hip: [50, 60], torso: 12, fN: [70, 96], fF: [32, 96], kneeF: -1, toeN: 70, toeF: 110,
         armAN: [-42, -96], armAF: [40, 96] },
    b: { hip: [50, 58], torso: 12, fN: [34, 92], fF: [70, 100], kneeF: -1, toeN: 110, toeF: 70,
         armAN: [40, 96], armAF: [-42, -96] },
  },
  intervals: {
    ms: 520, prop: { type: 'mat' },
    a: { hip: [50, 60], torso: 8, fN: [56, 110], fF: [44, 76], kneeF: -1, toeF: 150,
         armAN: [-50, -100], armAF: [46, 100] },
    b: { hip: [50, 58], torso: 8, fN: [54, 76], fF: [46, 110], kneeN: -1, toeN: 150,
         armAN: [46, 100], armAF: [-50, -100] },
  },
  mobility: {
    ms: 2400, prop: { type: 'mat' },
    a: { hip: [72, 80], torso: -72, head: -34, legAN: [4, 96], legAF: [8, 98], toeN: 96, toeF: 96,
         hN: [26, 104], hF: [26, 100], elbN: -1, elbF: -1 },
    b: { hip: [72, 88], torso: -94, head: 30, legAN: [4, 96], legAF: [8, 98], toeN: 96, toeF: 96,
         hN: [26, 104], hF: [26, 100], elbN: -1, elbF: -1 },
  },
};

export const KINDS = Object.keys(POSES);

// Sample a kind into N frames of solved joint positions.
export function frames(kind, n = 11) {
  const P = POSES[kind] || POSES.goblet;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(solve(lerpPose(P.a, P.b, t)));
  }
  return out;
}

export function meta(kind) {
  const P = POSES[kind] || POSES.goblet;
  return { gear: P.gear || null, prop: P.prop || null, ms: P.ms || 1400 };
}

// Where the equipment sits, derived from a solved frame.
export function gearPoints(frame, gear) {
  if (!gear) return null;
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);
  const nH = frame.armN.hand, fH = frame.armF.hand;
  if (gear.type === 'db') {
    const bars = [];
    const push = (h, e) => bars.push({ p: h, rot: ang(e, h) + 90 });
    if (gear.at === 'near') push(nH, frame.armN.elbow);
    else if (gear.at === 'both') { push(nH, frame.armN.elbow); push(fH, frame.armF.elbow); }
    else if (gear.at === 'goblet') bars.push({ p: [(nH[0] + fH[0]) / 2, (nH[1] + fH[1]) / 2], rot: 0 });
    else if (gear.at === 'hip') bars.push({ p: [frame.hip[0] + 2, frame.hip[1] - 6], rot: 0 });
    return { type: 'db', bars };
  }
  if (gear.type === 'roller') return { type: 'roller', p: nH };
  if (gear.type === 'band') {
    if (gear.at === 'hands') return { type: 'band', a: nH, b: fH, bow: 0 };
    if (gear.at === 'handsFeet') return { type: 'band', a: nH, b: frame.legN.ankle, c: fH, d: frame.legF.ankle };
    if (gear.at === 'backHands') return { type: 'band', a: nH, b: frame.neck, c: fH, behind: true };
  }
  return null;
}
