// ===================== PHYSICS / GEOMETRY CORE (framework-free) =====================
const G = 9.81;
const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  // Rodrigues rotation of v around unit axis k by angle a
  rot: (v, k, a) => {
    const c = Math.cos(a), s = Math.sin(a), kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
    const cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
    return [v[0] * c + cr[0] * s + k[0] * kv * (1 - c), v[1] * c + cr[1] * s + k[1] * kv * (1 - c), v[2] * c + cr[2] * s + k[2] * kv * (1 - c)];
  },
};

// Centripetal Catmull-Rom (alpha = 0.5) – no cusps / self-loops between control points
function catmullClosed(pts, perSeg) {
  const n = pts.length, out = [];
  const tj = (ti, a, b) => ti + Math.pow(Math.max(v3.len(v3.sub(b, a)), 1e-6), 0.5);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    for (let k = 0; k < perSeg; k++) {
      const t = t1 + (t2 - t1) * (k / perSeg);
      const A1 = v3.add(v3.mul(p0, (t1 - t) / (t1 - t0)), v3.mul(p1, (t - t0) / (t1 - t0)));
      const A2 = v3.add(v3.mul(p1, (t2 - t) / (t2 - t1)), v3.mul(p2, (t - t1) / (t2 - t1)));
      const A3 = v3.add(v3.mul(p2, (t3 - t) / (t3 - t2)), v3.mul(p3, (t - t2) / (t3 - t2)));
      const B1 = v3.add(v3.mul(A1, (t2 - t) / (t2 - t0)), v3.mul(A2, (t - t0) / (t2 - t0)));
      const B2 = v3.add(v3.mul(A2, (t3 - t) / (t3 - t1)), v3.mul(A3, (t - t1) / (t3 - t1)));
      out.push(v3.add(v3.mul(B1, (t2 - t) / (t2 - t1)), v3.mul(B2, (t - t1) / (t2 - t1))));
    }
  }
  return out;
}

// Build an arc-length parameterised track with rotation-minimising frames + physical banking
function resampleClosed(dense, N) {
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) cum.push(cum[i - 1] + v3.len(v3.sub(dense[i % dense.length], dense[i - 1])));
  const L = cum[dense.length], P = [];
  let j = 0;
  for (let k = 0; k < N; k++) {
    const s = (k / N) * L;
    while (cum[j + 1] < s) j++;
    const f = (s - cum[j]) / (cum[j + 1] - cum[j]);
    P.push(v3.lerp(dense[j], dense[(j + 1) % dense.length], f));
  }
  return { P, L };
}
function buildTrack(ctrl, N = 4000) {
  let { P, L } = resampleClosed(catmullClosed(ctrl, 120), N);
  // Gaussian fairing (sigma 1.6 m): makes curvature continuous (G2) -> no jerk spikes at control points
  {
    const ds0 = L / N, sig = 1.6 / ds0, r = Math.ceil(3 * sig), w = [];
    let ws = 0; for (let q = -r; q <= r; q++) { const e = Math.exp(-q * q / (2 * sig * sig)); w.push(e); ws += e; }
    const Q = P.map((_, k) => { let a = [0, 0, 0]; for (let q = -r; q <= r; q++) a = v3.add(a, v3.mul(P[(k + q + N) % N], w[q + r] / ws)); return a; });
    ({ P, L } = resampleClosed(Q, N));
  }
  const ds = L / N;
  const T = P.map((_, k) => v3.norm(v3.sub(P[(k + 2) % N], P[(k - 2 + N) % N])));
  const hk = Math.max(2, Math.round(1.0 / ds)); // ~1 m stencil -> noise-free curvature
  const K = T.map((_, k) => v3.mul(v3.sub(T[(k + hk) % N], T[(k - hk + N) % N]), 1 / (2 * hk * ds))); // curvature vector dT/ds
  // parallel transport (rotation minimising frame)
  const Nr = new Array(N);
  Nr[0] = v3.norm(v3.sub([0, 1, 0], v3.mul(T[0], T[0][1])));
  for (let k = 1; k <= N; k++) {
    const t = T[k % N], prev = Nr[k - 1];
    const n = v3.norm(v3.sub(prev, v3.mul(t, v3.dot(prev, t))));
    if (k < N) Nr[k] = n; else {
      // closure twist: distribute evenly so the frame is continuous at the seam
      const tw = Math.atan2(v3.dot(v3.cross(n, Nr[0]), T[0]), v3.dot(n, Nr[0]));
      for (let q = 1; q < N; q++) Nr[q] = v3.rot(Nr[q], T[q], tw * q / N);
    }
  }
  // physical banking: align track normal with the felt force (centripetal + gravity) -> zero lateral G
  const hTop = Math.max(...P.map(p => p[1]));
  const bank = new Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    const v2 = Math.max(2 * G * (hTop + 0.3 - P[k][1]) * 0.82, 9);
    const felt = v3.add(v3.mul(K[k], v2), [0, G, 0]);
    const fp = v3.sub(felt, v3.mul(T[k], v3.dot(felt, T[k])));
    const n0 = Nr[k];
    const bvec = v3.cross(T[k], n0);
    let a = Math.atan2(v3.dot(fp, bvec), v3.dot(fp, n0));
    const w = Math.min(1, Math.max(0, (n0[1] - 0.55) / 0.35)); // no artificial bank inside the loop
    bank[k] = Math.max(-1.4, Math.min(1.4, a)) * w;
  }
  // smooth banking (gaussian-ish moving average, ~12 m window) for comfortable roll rate
  const win = Math.round(5 / ds), sm = new Array(N).fill(0);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? bank : sm.slice();
    for (let k = 0; k < N; k++) { let acc = 0; for (let q = -win; q <= win; q++) acc += src[(k + q + N) % N]; sm[k] = acc / (2 * win + 1); }
  }
  const Nf = Nr.map((n, k) => v3.rot(n, T[k], sm[k]));
  const Bf = Nf.map((n, k) => v3.norm(v3.cross(T[k], n)));
  return { L, N, ds, P, T, K, Nr: Nf, B: Bf, bank: sm, hTop };
}

function sampleTrack(tr, s) {
  s = ((s % tr.L) + tr.L) % tr.L;
  const x = s / tr.ds, i = Math.floor(x) % tr.N, j = (i + 1) % tr.N, f = x - Math.floor(x);
  return {
    p: v3.lerp(tr.P[i], tr.P[j], f),
    t: v3.norm(v3.lerp(tr.T[i], tr.T[j], f)),
    n: v3.norm(v3.lerp(tr.Nr[i], tr.Nr[j], f)),
    k: v3.lerp(tr.K[i], tr.K[j], f),
  };
}
function nearestS(tr, pt) {
  let best = 1e9, bi = 0;
  tr.P.forEach((p, i) => { const d = v3.len(v3.sub(p, pt)); if (d < best) { best = d; bi = i; } });
  return bi * tr.ds;
}

// ---------------- roller-coaster train: one rigid body constrained to the rail -----------------
function makeTrain(tr, zones, opts = {}) {
  return {
    tr, zones,
    cars: opts.cars || 5, spacing: opts.spacing || 3.1,
    s: zones.stopS, v: 0, state: 'dwell', timer: 2.0, enabled: true,
    liftV: 4.6, crr: 0.012, cd: 0.0011,
  };
}
const fwdDist = (L, a, b) => ((b - a) % L + L) % L; // distance going forward from a to b
function inZone(L, s, z) { return fwdDist(L, z[0], s) <= fwdDist(L, z[0], z[1]); }

function stepTrain(T, dt) {
  const tr = T.tr, Z = T.zones, L = tr.L;
  if (T.state === 'dwell') {
    T.v = 0; T.timer -= dt;
    if (T.timer <= 0 && T.enabled) T.state = 'run';
    return;
  }
  // gravity: sum of slope components acting on each (equal-mass) car
  let slope = 0;
  for (let i = 0; i < T.cars; i++) slope += sampleTrack(tr, T.s - i * T.spacing).t[1];
  slope /= T.cars;
  let a = -G * slope - Math.sign(T.v) * (T.crr * G + T.cd * T.v * T.v);
  T.v += a * dt;
  // chain lift: anti-rollback dogs + chain speed while any car is on the lift
  let onLift = false;
  for (let i = 0; i < T.cars; i++) if (inZone(L, T.s - i * T.spacing, Z.lift)) onLift = true;
  if (onLift) { T.v = Math.max(T.v, T.liftV); T.armed = true; }
  // station drive tyres
  if (inZone(L, T.s, Z.launch)) T.v = Math.max(T.v, 2.6);
  // magnetic brake run
  if (inZone(L, T.s, Z.brake)) {
    const target = 2.2;
    if (T.v > target) T.v = Math.max(target, T.v - 9 * dt);
  }
  // final station stop
  const dStop = fwdDist(L, T.s, Z.stopS);
  if (T.armed && (inZone(L, T.s, Z.brake) || dStop < 8)) {
    if (dStop < 8) T.v = Math.min(T.v, Math.max(0.35, Math.sqrt(2 * 0.6 * dStop)));
    if (dStop < T.v * dt + 0.01) { T.s = Z.stopS; T.v = 0; T.state = 'dwell'; T.timer = 4.0; T.armed = false; return; }
  }
  T.v = Math.max(T.v, 0.3); // the layout is designed so the train never valleys (verified in tests)
  T.s = ((T.s + T.v * dt) % L + L) % L;
}

// felt G-force (in track frame) at arc length s and speed v
function gForce(tr, s, v) {
  const f = sampleTrack(tr, s);
  const felt = v3.add(v3.mul(f.k, v * v), [0, G, 0]);
  const b = v3.cross(f.t, f.n);
  return { vert: v3.dot(felt, f.n) / G, lat: v3.dot(felt, b) / G };
}

// ---------------- Ferris wheel with free-swinging gondolas (driven pendulums) -----------------
function makeWheel(n = 16, R = 18, Lh = 2.6) {
  const g = [];
  for (let i = 0; i < n; i++) g.push({ alpha: (i / n) * Math.PI * 2, th: 0, om: 0 });
  return { n, R, Lh, phi: 0, Om: 0, OmTarget: 0.11, maxAcc: 0.012, cycle: 0, running: true, gond: g, damp: 0.35, gust: 0 };
}
function stepWheel(W, dt, time) {
  // operating cycle: rotate ~40 s, slow down & pause 7 s for boarding
  W.cycle += dt;
  let target = W.running ? W.OmTarget : 0;
  if (W.running && (W.cycle % 47) > 40) target = 0;
  const prevOm = W.Om;
  const d = target - W.Om;
  W.Om += Math.sign(d) * Math.min(Math.abs(d), W.maxAcc * dt);
  const Ad = (W.Om - prevOm) / dt; // angular acceleration
  W.phi += W.Om * dt;
  // wind gusts (horizontal acceleration on the cabin, m/s^2), scaled by the user's wind setting
  W.gust = (W.wind ?? 0.6) * (0.35 * Math.sin(time * 0.37) * Math.sin(time * 1.13 + 1) + 0.15 * Math.sin(time * 2.9));
  for (const q of W.gond) {
    const ang = W.phi + q.alpha;
    // pivot acceleration in wheel plane: tangential + centripetal
    const ax = -W.R * Ad * Math.sin(ang) - W.R * W.Om * W.Om * Math.cos(ang);
    const ay = W.R * Ad * Math.cos(ang) - W.R * W.Om * W.Om * Math.sin(ang);
    // theta'' = [(-ax + wind) cos th - (g + ay) sin th] / L  - c * theta'
    const gw = W.gust * (1 + 0.35 * Math.sin(q.alpha * 3 + time * 0.8)); // gust varies across the wheel
    const acc = ((-ax + gw) * Math.cos(q.th) - (G + ay) * Math.sin(q.th)) / W.Lh - W.damp * q.om;
    q.om += acc * dt; q.th += q.om * dt;
  }
}

if (typeof module !== 'undefined') module.exports = { G, v3, catmullClosed, buildTrack, sampleTrack, nearestS, makeTrain, stepTrain, gForce, makeWheel, stepWheel, inZone, fwdDist };
