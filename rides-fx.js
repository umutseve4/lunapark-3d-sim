// ===================================================================================
//                                   FERRIS WHEEL  (Bursa Gözü)
// ===================================================================================
const WHEEL = makeWheel(16, 18, 2.7);
const WH = 23;                                    // hub height
const wheelBase = new THREE.Group(); wheelBase.position.set(-44, 0, -3); scene.add(wheelBase);
const rotor = new THREE.Group(); rotor.position.y = WH; wheelBase.add(rotor);
{
  const R = WHEEL.R, HZ = 1.7;
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, metalness: 0.6, roughness: 0.3 });
  for (const z of [-HZ, HZ]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.22, 8, 128), rimMat); rim.position.z = z; rim.castShadow = true; rotor.add(rim);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(R - 1.4, 0.13, 6, 128), rimMat); rim2.position.z = z; rotor.add(rim2);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.32, 0.16, 6, 64), rimMat); inner.position.z = z; rotor.add(inner);
    for (let i = 0; i < WHEEL.n; i++) {
      const a = (i / WHEEL.n) * Math.PI * 2, a2 = ((i + 0.5) / WHEEL.n) * Math.PI * 2;
      const hub = new THREE.Vector3(Math.cos(a) * 1.0, Math.sin(a) * 1.0, z * 0.55);
      beam(hub, new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z), 0.09, rimMat, rotor, 6);       // radial spoke
      beam(new THREE.Vector3(Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32, z), new THREE.Vector3(Math.cos(a2) * (R - 1.4), Math.sin(a2) * (R - 1.4), z), 0.05, rimMat, rotor, 4); // truss diagonal
      beam(new THREE.Vector3(Math.cos(a2) * (R - 1.4), Math.sin(a2) * (R - 1.4), z), new THREE.Vector3(Math.cos(a2) * R, Math.sin(a2) * R, z), 0.06, rimMat, rotor, 4);
    }
  }
  // gondola axles (span both rims) – the pivot each cabin hangs from
  for (let i = 0; i < WHEEL.n; i++) {
    const a = (i / WHEEL.n) * Math.PI * 2;
    beam(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, -HZ), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, HZ), 0.11, M.darkSteel, rotor, 8);
  }
  const hub = cyl(1.3, 1.3, 2.4, M.darkSteel, 20); hub.rotation.x = Math.PI / 2; rotor.add(hub);
  // static axle + A-frame towers
  const axle = cyl(0.45, 0.45, 7.4, M.steel, 14); axle.rotation.x = Math.PI / 2; axle.position.y = WH; wheelBase.add(axle);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b59c3, metalness: 0.5, roughness: 0.4 });
  for (const z of [-3.4, 3.4]) {
    const top = new THREE.Vector3(0, WH, z);
    const fl = new THREE.Vector3(-9.5, 0, z * 1.9), fr = new THREE.Vector3(9.5, 0, z * 1.9);
    beam(fl, top, 0.42, legMat, wheelBase, 10); beam(fr, top, 0.42, legMat, wheelBase, 10);
    beam(fl.clone().lerp(top, 0.45), fr.clone().lerp(top, 0.45), 0.22, legMat, wheelBase);
    beam(fl.clone().lerp(top, 0.45), fr.clone().lerp(top, 0.0), 0.12, legMat, wheelBase);
    beam(fr.clone().lerp(top, 0.45), fl.clone().lerp(top, 0.0), 0.12, legMat, wheelBase);
    for (const p of [fl, fr]) box(2.2, 0.8, 2.2, M.concrete, p.x, 0.4, p.z, wheelBase);
  }
  box(14, 0.7, 6, M.concrete, 0, 0.35, 0, wheelBase);                          // boarding platform
  const s = textSprite('BURSA GÖZÜ', 10, 1.6, '#1d3fa0'); s.position.set(0, 2.2, 3.05); wheelBase.add(s);
  // bulbs on both rims + along spokes
  const bp = [], bc = [], pal = [0xffd75e, 0xff6b6b, 0x6bc5ff, 0xffffff];
  for (const z of [-HZ - 0.25, HZ + 0.25]) {
    for (let i = 0; i < 112; i++) { const a = i / 112 * Math.PI * 2; bp.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z)); bc.push(pal[i % 2 ? 0 : 3]); }
    for (let i = 0; i < WHEEL.n; i++) { const a = i / WHEEL.n * Math.PI * 2; for (let k = 1; k <= 6; k++) { const r = 1.5 + k * (R - 2) / 6.2; bp.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z * (0.55 + 0.45 * k / 6))); bc.push(pal[1 + (i % 3)]); } }
  }
  makeBulbs(rotor, bp, bc, 0.16, 1);
}
// gondolas (not children of the rotor: they hang freely under gravity – driven pendulum per cabin)
const gondolas = [];
for (let i = 0; i < WHEEL.n; i++) {
  const piv = new THREE.Group(); wheelBase.add(piv);
  const col = new THREE.Color().setHSL(i / WHEEL.n, 0.75, 0.55);
  const mat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.3, roughness: 0.4 });
  const L = WHEEL.Lh;
  for (const z of [-1.05, 1.05]) beam(new THREE.Vector3(0, 0, z), new THREE.Vector3(0, -L + 0.9, z * 0.85), 0.06, M.darkSteel, piv, 6); // hanger
  const sleeve = cyl(0.17, 0.17, 2.3, M.darkSteel, 8); sleeve.rotation.x = Math.PI / 2; piv.add(sleeve);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.6, 12), mat); roof.position.y = -L + 1.1; roof.castShadow = true; piv.add(roof);
  const cab = cyl(1.05, 1.0, 0.75, mat, 12); cab.position.y = -L - 0.35; piv.add(cab);                  // lower body
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.9, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xaad8ff, transparent: true, opacity: 0.25, roughness: 0.1, side: THREE.DoubleSide }));
  glass.position.y = -L + 0.4; piv.add(glass);
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; beam(new THREE.Vector3(Math.cos(a) * 1.0, -L + 0.0, Math.sin(a) * 1.0), new THREE.Vector3(Math.cos(a) * 1.0, -L + 0.85, Math.sin(a) * 1.0), 0.04, M.darkSteel, piv, 4); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false })); lamp.position.y = -L + 0.75; piv.add(lamp);
  gondolas.push({ piv, lamp });
}
function placeGondolas() {
  rotor.rotation.z = WHEEL.phi;
  WHEEL.gond.forEach((q, i) => {
    const a = WHEEL.phi + q.alpha;
    gondolas[i].piv.position.set(Math.cos(a) * WHEEL.R, WH + Math.sin(a) * WHEEL.R, 0);
    gondolas[i].piv.rotation.z = q.th;
  });
}

// ===================================================================================
//                                   CAROUSEL
// ===================================================================================
const carousel = new THREE.Group(); carousel.position.set(14, 0, -4); scene.add(carousel);
const carRot = new THREE.Group(); carousel.add(carRot);
const horses = [];
{
  const base = cyl(9.6, 10, 0.7, M.concrete, 40); base.position.y = 0.35; carousel.add(base);
  const deck = cyl(9.2, 9.2, 0.3, new THREE.MeshStandardMaterial({ color: 0x8b2c2c, roughness: 0.7 }), 40); deck.position.y = 0.85; carRot.add(deck);
  const center = cyl(1.6, 1.6, 6.4, new THREE.MeshStandardMaterial({ color: 0xfff1d6, roughness: 0.5 }), 20); center.position.y = 4; carRot.add(center);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, vertexColors: true });
  const cg = new THREE.ConeGeometry(10.4, 3.6, 32, 1, true);
  { const c = [], p = cg.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const s = Math.floor((a + Math.PI) / (Math.PI * 2) * 16) % 2; c.push(...(s ? [0.9, 0.12, 0.15] : [1, 0.96, 0.9])); } cg.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
  const canopy = new THREE.Mesh(cg, canopyMat); canopy.position.y = 8.9; canopy.castShadow = true; carRot.add(canopy);
  const valance = cyl(10.4, 10.4, 0.9, new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.5, side: THREE.DoubleSide }), 40); valance.position.y = 6.8; carRot.add(valance);
  const flag = box(0.06, 1.2, 0.9, new THREE.MeshStandardMaterial({ color: 0xff3b30 }), 0, 11.5, 0.45, carRot);
  beam(new THREE.Vector3(0, 10.5, 0), new THREE.Vector3(0, 12.2, 0), 0.06, M.steel, carRot);
  const horseCols = [0xffffff, 0x3b2a20, 0xd9a066, 0x222222, 0xf5e0c3];
  for (const ring of [{ r: 7.5, n: 12 }, { r: 4.6, n: 8 }]) for (let i = 0; i < ring.n; i++) {
    const a = i / ring.n * Math.PI * 2 + (ring.r < 5 ? 0.2 : 0);
    const h = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: horseCols[(i + ring.n) % horseCols.length], roughness: 0.5 });
    const saddle = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / ring.n, 0.8, 0.5) });
    box(0.5, 0.55, 1.5, mat, 0, 0, 0, h);
    const neck = box(0.35, 0.8, 0.4, mat, 0, 0.45, 0.7, h); neck.rotation.x = 0.5;
    box(0.32, 0.32, 0.7, mat, 0, 0.85, 0.95, h);
    box(0.52, 0.12, 0.6, saddle, 0, 0.32, -0.05, h);
    for (const [lx, lz, rx] of [[-0.17, 0.55, -0.6], [0.17, 0.55, -0.9], [-0.17, -0.6, 0.6], [0.17, -0.6, 0.8]]) { const leg = box(0.11, 0.75, 0.11, mat, lx, -0.5, lz, h); leg.rotation.x = rx; }
    const tail = box(0.08, 0.6, 0.08, horseCols[3] === 0 ? mat : M.darkSteel, 0, -0.1, -0.8, h); tail.rotation.x = -0.6;
    const pole = cyl(0.06, 0.06, 6, M.copper, 8); pole.position.set(Math.cos(a) * ring.r, 3.9, Math.sin(a) * ring.r); carRot.add(pole);
    h.position.set(Math.cos(a) * ring.r, 2.2, Math.sin(a) * ring.r);
    h.rotation.y = -a; // face tangential direction of travel
    carRot.add(h); horses.push({ h, ph: i * 1.3 + ring.r });
  }
  const bp = [], bc = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; bp.push(new THREE.Vector3(Math.cos(a) * 10.5, 6.4, Math.sin(a) * 10.5)); bc.push(i % 2 ? 0xffe08a : 0xff8fb1); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; for (let k = 1; k < 5; k++) { bp.push(new THREE.Vector3(Math.cos(a) * 10.4 * (1 - k / 5), 7.1 + 3.6 * k / 5, Math.sin(a) * 10.4 * (1 - k / 5))); bc.push(0xfff3c4); } }
  makeBulbs(carRot, bp, bc, 0.15, 1.6);
}
let carouselAng = 0, carouselOm = 0;

// ===================================================================================
//                         SCENERY: stalls, lamps, trees, gate, balloons
// ===================================================================================
{
  const stallCols = [0xff5e5b, 0x2ec4b6, 0xffbe0b, 0x8338ec, 0x3a86ff, 0xfb5607];
  const names = ['PAMUK ŞEKER', 'MISIR', 'DONDURMA', 'İSKENDER', 'LIMONATA', 'ATIŞ'];
  for (let i = 0; i < 6; i++) {
    const x = 38 + i * 9.5, z = 8;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI; scene.add(g);
    box(6.4, 2.6, 4, new THREE.MeshStandardMaterial({ color: 0xf7f1e3, roughness: 0.8 }), 0, 1.3, 0, g);
    box(6.0, 1.3, 0.1, M.window, 0, 2.0, 2.02, g);
    const roof = box(7.2, 0.25, 5.2, new THREE.MeshStandardMaterial({ color: stallCols[i], roughness: 0.6 }), 0, 3.5, 0.4, g); roof.rotation.x = -0.18;
    const sgn = textSprite(names[i], 5.6, 1.1, '#' + stallCols[i].toString(16).padStart(6, '0')); sgn.position.set(0, 4.5, 1.6); g.add(sgn);
    const bp = [], bc = []; for (let k = 0; k < 12; k++) { bp.push(new THREE.Vector3(-3.3 + k * 0.6, 3.15, 2.95)); bc.push(k % 2 ? 0xffd166 : 0xffffff); }
    makeBulbs(g, bp, bc, 0.12, 2);
  }
  // lamp posts
  const lampPos = [];
  for (let x = -64; x <= 84; x += 16) for (const z of [-21, 13]) lampPos.push([x, z]);
  for (let z = 30; z <= 60; z += 10) for (const x of [-22, -6]) lampPos.push([x, z]);
  const bp = [], bc = [];
  for (const [x, z] of lampPos) {
    const p = cyl(0.12, 0.18, 5, M.darkSteel, 8); p.position.set(x, 2.5, z); scene.add(p);
    bp.push(new THREE.Vector3(x, 5.25, z)); bc.push(0xffe2a6);
  }
  makeBulbs(scene, bp, bc, 0.4, 0.3);
  // trees (instanced) – kept clear of the coaster & rides
  const tp = [];
  let guard = 0;
  while (tp.length < 230 && guard++ < 6000) {
    const x = rand(-260, 260), z = rand(-200, 220);
    if (x > -110 && x < 125 && z > -48 && z < 33) continue;     // ride area
    if (x > -40 && x < 12 && z > 20 && z < 75) continue;       // entrance walk
    tp.push([x, z, rand(0.8, 1.6)]);
  }
  for (let i = 0; i < 26; i++) { const x = rand(62, 88), z = rand(-16, 2); tp.push([x, z, rand(0.7, 1.1)]); }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 6).translate(0, 1.5, 0), M.wood, tp.length);
  const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 6, 8).translate(0, 5.5, 0), M.leaf, tp.length);
  const m = new THREE.Matrix4();
  tp.forEach(([x, z, s], i) => { m.makeScale(s, s, s).setPosition(x, 0, z); trunk.setMatrixAt(i, m); crown.setMatrixAt(i, m); crown.setColorAt(i, new THREE.Color().setHSL(0.28 + rand(-0.04, 0.04), 0.5, rand(0.22, 0.34))); });
  crown.castShadow = trunk.castShadow = true;
  scene.add(trunk, crown);
  // entrance gate
  const gx = -14, gz = 64;
  for (const x of [gx - 8, gx + 8]) { const t = cyl(0.8, 1.0, 11, new THREE.MeshStandardMaterial({ color: 0xc81d25, roughness: 0.5 }), 12); t.position.set(x, 5.5, gz); scene.add(t); const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0xffd23f })); top.position.set(x, 12.1, gz); scene.add(top); }
  const sgn = textSprite('LUNAPARK BURSA', 15, 2.6); sgn.position.set(gx, 9.4, gz + 0.3); scene.add(sgn);
  const sgnB = sgn.clone(); sgnB.rotation.y = Math.PI; sgnB.position.z = gz - 0.3; scene.add(sgnB);
  const gb = [], gc = []; for (let k = 0; k < 26; k++) { gb.push(new THREE.Vector3(gx - 7.5 + k * 0.6, 11, gz + 0.4)); gc.push(k % 3 ? 0xffd166 : 0xff4d6d); }
  makeBulbs(scene, gb, gc, 0.18, 1.2);
}
// floating balloons (bob in the wind)
const balloons = [];
for (let i = 0; i < 14; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.85, 0.55), roughness: 0.25 }));
  b.scale.y = 1.2; const x = rand(30, 90), z = rand(1, 6);
  b.position.set(x, rand(4, 6), z); scene.add(b); balloons.push({ b, x, z, ph: rand(0, 6) });
}

// a few real light sources for night (wheel, carousel, station, stalls)
const nightLights = [
  [new THREE.PointLight(0xff9a5a, 0, 90, 1.2), [-44, 22, 6]],
  [new THREE.PointLight(0xff7ac8, 0, 60, 1.2), [14, 9, -4]],
  [new THREE.PointLight(0xfff1c4, 0, 60, 1.2), [-14, 8, 22]],
  [new THREE.PointLight(0xffb85c, 0, 70, 1.2), [62, 6, 14]],
  [new THREE.PointLight(0xffe2a6, 0, 60, 1.2), [-14, 6, 48]],
].map(([l, p]) => { l.position.set(...p); scene.add(l); return l; });

// ===================================================================================
//                              CONFETTI  &  FIREWORKS
// ===================================================================================
const CONF_N = 2600;
const confGeo = new THREE.PlaneGeometry(0.34, 0.2);
const confetti = new THREE.InstancedMesh(confGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.35, emissive: 0x222222 }), CONF_N);
confetti.frustumCulled = false; scene.add(confetti);
const CF = Array.from({ length: CONF_N }, () => ({ p: new THREE.Vector3(0, -50, 0), v: new THREE.Vector3(), q: new THREE.Quaternion(), ax: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), spin: rand(3, 9), ph: rand(0, 6), term: rand(1.3, 2.6), alive: false, ground: 0 }));
const confPal = [0xff3b30, 0xffcc00, 0x34c759, 0x007aff, 0xaf52de, 0xff2d55, 0x5ac8fa, 0xffffff, 0xff9500];
CF.forEach((c, i) => confetti.setColorAt(i, new THREE.Color(confPal[i % confPal.length])));
function spawnConfetti(c, anyHeight) {
  const ctr = cameraMode === 'orbit' ? controls.target : camera.position;
  c.p.set(ctr.x + rand(-75, 75), anyHeight ? rand(2, 60) : rand(45, 65), ctr.z + rand(-75, 75));
  c.v.set(rand(-1, 1), -c.term, rand(-1, 1)); c.alive = true; c.ground = 0;
}
const _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _cm = new THREE.Matrix4(), _n = new THREE.Vector3();
let windStrength = 0.6;
function updateConfetti(dt, t) {
  const on = mode === 'fest';
  for (let i = 0; i < CONF_N; i++) {
    const c = CF[i];
    if (!c.alive) { if (on && Math.random() < 0.02) spawnConfetti(c, false); else { _cm.makeScale(0, 0, 0); confetti.setMatrixAt(i, _cm); continue; } }
    if (c.ground > 0) {           // resting on the ground for a while
      c.ground -= dt; if (c.ground <= 0) { if (on) spawnConfetti(c, false); else c.alive = false; }
    } else {
      // flat paper: drag depends on orientation (falls slower face-down) + flutter + wind
      _n.set(0, 0, 1).applyQuaternion(c.q);
      const face = Math.abs(_n.y);
      const term = c.term * (0.55 + 0.6 * (1 - face));
      const wx = windStrength * (1.2 + Math.sin(t * 0.3 + c.ph)), wz = windStrength * 0.5 * Math.cos(t * 0.23 + c.ph);
      c.v.x += ((wx + Math.sin(t * 2.3 + c.ph) * 1.4) - c.v.x) * Math.min(1, dt * 2.2);
      c.v.z += ((wz + Math.cos(t * 1.9 + c.ph) * 1.4) - c.v.z) * Math.min(1, dt * 2.2);
      c.v.y += (-term - c.v.y) * Math.min(1, dt * 3) - 9.81 * dt * 0.02;
      c.p.addScaledVector(c.v, dt);
      _q.setFromAxisAngle(c.ax, c.spin * dt); c.q.premultiply(_q);
      if (c.p.y <= 0.06) { c.p.y = 0.06; c.ground = rand(3, 7); c.q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rand(0, 6))); }
    }
    _cm.compose(c.p, c.q, _s); confetti.setMatrixAt(i, _cm);
  }
  confetti.instanceMatrix.needsUpdate = true;
}
// fireworks: rockets that burst into particle shells (gravity + drag + fade)
const FW_N = 6000;
const fwGeo = new THREE.BufferGeometry();
const fwPos = new Float32Array(FW_N * 3).fill(-9999), fwCol = new Float32Array(FW_N * 3);
fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
const fwPts = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
fwPts.frustumCulled = false; scene.add(fwPts);
const FW = Array.from({ length: FW_N }, () => ({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, r: 1, g: 1, b: 1, rocket: false }));
let fwPtr = 0, fwTimer = 0;
function fwAlloc() { const i = fwPtr; fwPtr = (fwPtr + 1) % FW_N; return i; }
function launchRocket() {
  const i = fwAlloc(), p = FW[i];
  const x = rand(-90, 100), z = rand(-90, -50);
  fwPos.set([x, 0, z], i * 3);
  Object.assign(p, { life: rand(1.6, 2.2), max: 2, vx: rand(-2, 2), vy: rand(36, 44), vz: rand(-2, 2), r: 1, g: 0.85, b: 0.6, rocket: true });
}
function burst(x, y, z) {
  const col = new THREE.Color().setHSL(Math.random(), 1, 0.6), col2 = new THREE.Color().setHSL(Math.random(), 1, 0.65);
  const n = 260, sp = rand(14, 20);
  for (let k = 0; k < n; k++) {
    const i = fwAlloc(), p = FW[i];
    const u = rand(-1, 1), a = rand(0, Math.PI * 2), s = Math.sqrt(1 - u * u), v = sp * rand(0.85, 1);
    fwPos.set([x, y, z], i * 3);
    const c = k % 3 ? col : col2;
    Object.assign(p, { life: rand(1.6, 2.6), max: 2.6, vx: s * Math.cos(a) * v, vy: u * v, vz: s * Math.sin(a) * v, r: c.r * 3, g: c.g * 3, b: c.b * 3, rocket: false });
  }
}
function updateFireworks(dt) {
  if (P.fest > 0.5) { fwTimer -= dt; if (fwTimer <= 0) { launchRocket(); fwTimer = rand(0.45, 1.3); } }
  for (let i = 0; i < FW_N; i++) {
    const p = FW[i]; if (p.life <= 0) continue;
    p.life -= dt;
    const drag = p.rocket ? 0 : 1.6;
    p.vy -= 9.81 * dt * (p.rocket ? 1 : 0.55);
    p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt; p.vz -= p.vz * drag * dt;
    fwPos[i * 3] += p.vx * dt; fwPos[i * 3 + 1] += p.vy * dt; fwPos[i * 3 + 2] += p.vz * dt;
    const f = Math.max(0, Math.min(1, p.life / p.max * 1.6));
    const tw = p.rocket ? 1 : (0.6 + 0.4 * Math.random());
    fwCol[i * 3] = p.r * f * tw; fwCol[i * 3 + 1] = p.g * f * tw; fwCol[i * 3 + 2] = p.b * f * tw;
    if (p.rocket && (p.vy < 4 || p.life <= 0)) { p.life = 0; burst(fwPos[i * 3], fwPos[i * 3 + 1], fwPos[i * 3 + 2]); }
    if (p.life <= 0) { fwPos[i * 3 + 1] = -9999; }
  }
  fwGeo.attributes.position.needsUpdate = true; fwGeo.attributes.color.needsUpdate = true;
}

// ===================================================================================
//                         MODES (day / night / festival) with smooth blending
// ===================================================================================
const MODES = {
  day:   { top: 0x2f7fd6, horizon: 0xc7e6ff, bottom: 0x9cc9a0, fog: 0xcfe8ff, sun: 2.6, sunCol: 0xfff2dd, hemi: 0.9, amb: 0.15, bulbs: 0.0, bloom: 0.12, stars: 0, exposure: 1.0, nl: 0, fest: 0, win: 0, orbCol: 0xfff6d0, orbPos: [-300, 380, 260] },
  night: { top: 0x02040f, horizon: 0x101c3e, bottom: 0x050a12, fog: 0x08101f, sun: 0.35, sunCol: 0x9fb4ff, hemi: 0.12, amb: 0.05, bulbs: 1.0, bloom: 0.95, stars: 1, exposure: 1.05, nl: 1, fest: 0, win: 1.4, orbCol: 0xe8eeff, orbPos: [260, 300, -380] },
  fest:  { top: 0x0d0026, horizon: 0x5b1a6e, bottom: 0x14061c, fog: 0x22102e, sun: 0.45, sunCol: 0xff9ad5, hemi: 0.22, amb: 0.08, bulbs: 1.15, bloom: 1.1, stars: 0.6, exposure: 1.1, nl: 1.3, fest: 1, win: 1.6, orbCol: 0xffd0f0, orbPos: [260, 300, -380] },
};
let mode = 'day';
const P = { top: new THREE.Color(), horizon: new THREE.Color(), bottom: new THREE.Color(), fog: new THREE.Color(), sunCol: new THREE.Color(), orbCol: new THREE.Color(), orbPos: new THREE.Vector3(), sun: 0, hemi: 0, amb: 0, bulbs: 0, bloom: 0, stars: 0, exposure: 1, nl: 0, fest: 0, win: 0 };
function snapMode(m) { const s = MODES[m]; for (const k of ['top', 'horizon', 'bottom', 'fog', 'sunCol', 'orbCol']) P[k].set(s[k]); P.orbPos.set(...s.orbPos); for (const k of ['sun', 'hemi', 'amb', 'bulbs', 'bloom', 'stars', 'exposure', 'nl', 'fest', 'win']) P[k] = s[k]; }
snapMode('day');
const _tc = new THREE.Color();
function blendMode(dt) {
  const s = MODES[mode], k = 1 - Math.exp(-dt * 2.2);
  for (const key of ['top', 'horizon', 'bottom', 'fog', 'sunCol', 'orbCol']) P[key].lerp(_tc.set(s[key]), k);
  P.orbPos.lerp(_v1.set(...s.orbPos), k);
  for (const key of ['sun', 'hemi', 'amb', 'bulbs', 'bloom', 'stars', 'exposure', 'nl', 'fest', 'win']) P[key] += (s[key] - P[key]) * k;
  skyMat.uniforms.top.value.copy(P.top); skyMat.uniforms.horizon.value.copy(P.horizon); skyMat.uniforms.bottom.value.copy(P.bottom);
  scene.fog.color.copy(P.fog);
  sun.intensity = P.sun; sun.color.copy(P.sunCol);
  sun.position.copy(P.orbPos).normalize().multiplyScalar(220);
  orb.position.copy(P.orbPos); orb.material.color.copy(P.orbCol);
  orb.scale.setScalar(mode === 'day' ? 1 : 0.7 + 0.3 * (1 - P.bulbs));
  hemi.intensity = P.hemi; ambient.intensity = P.amb;
  starMat.opacity = P.stars;
  bloom.strength = P.bloom;
  renderer.toneMappingExposure = P.exposure;
  nightLights.forEach((l, i) => l.intensity = P.nl * (i === 0 ? 70 : 45) * (P.fest > 0.5 ? 0.8 + 0.4 * Math.sin(clock.elapsedTime * 3 + i) : 1));
  if (P.fest > 0.05) nightLights.forEach((l, i) => l.color.setHSL((clock.elapsedTime * 0.1 + i * 0.2) % 1, 0.8, 0.6));
  M.window.emissiveIntensity = P.win;
  signMats.forEach(m => m.emissiveIntensity = 0.15 + P.win * 0.5);
  headlights.forEach(h => h.visible = true);
  gondolas.forEach(g => g.lamp.material.color.setScalar(0.4 + P.bulbs * 2));
}
const _v1 = new THREE.Vector3();
function setMode(m) {
  mode = m;
  $('mDay').classList.toggle('active', m === 'day'); $('mNight').classList.toggle('active', m === 'night'); $('mFest').classList.toggle('active', m === 'fest');
  if (m === 'fest') for (let i = 0; i < CONF_N; i++) if (!CF[i].alive && Math.random() < 0.55) spawnConfetti(CF[i], true);
}
$('mDay').onclick = () => setMode('day'); $('mNight').onclick = () => setMode('night'); $('mFest').onclick = () => setMode('fest');

// ---------- post-processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.12, 0.55, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ===================================================================================
//                                CAMERAS & UI
// ===================================================================================
let cameraMode = 'orbit';
const savedOrbit = { pos: camera.position.clone(), tgt: controls.target.clone() };
function setCam(m) {
  if (cameraMode === 'orbit' && m !== 'orbit') { savedOrbit.pos.copy(camera.position); savedOrbit.tgt.copy(controls.target); }
  if (m === 'orbit') { camera.position.copy(savedOrbit.pos); controls.target.copy(savedOrbit.tgt); camera.up.set(0, 1, 0); camera.fov = 55; }
  cameraMode = m; controls.enabled = m === 'orbit';
  camera.fov = m === 'coaster' ? 78 : m === 'wheel' ? 70 : 55; camera.updateProjectionMatrix();
  document.querySelectorAll('[data-cam]').forEach(b => b.classList.toggle('active', b.dataset.cam === m));
}
document.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => setCam(b.dataset.cam));
$('bTrain').onclick = () => { train.enabled = !train.enabled; if (!train.enabled && train.state === 'run') train.parkAfterLap = true; $('bTrain').textContent = train.enabled ? '⏸ Treni Park Et' : '▶ Treni Kaldır'; };
$('bWheel').onclick = () => { WHEEL.running = !WHEEL.running; $('bWheel').textContent = WHEEL.running ? '⏸ Dolabı Durdur' : '▶ Dolabı Başlat'; };
let timeScale = 1;
$('ts').oninput = (e) => { timeScale = +e.target.value; $('tsV').textContent = timeScale.toFixed(2) + '×'; };
$('wind').oninput = (e) => { windStrength = +e.target.value; WHEEL.wind = windStrength; $('windV').textContent = windStrength < 0.3 ? 'durgun' : windStrength < 1.2 ? 'hafif' : windStrength < 2.2 ? 'orta' : 'sert'; };
WHEEL.wind = windStrength;
addEventListener('keydown', (e) => {
  if (e.key === '1') setMode('day'); if (e.key === '2') setMode('night'); if (e.key === '3') setMode('fest');
  if (e.key === 'c' || e.key === 'C') { const order = ['orbit', 'coaster', 'wheel', 'cine']; setCam(order[(order.indexOf(cameraMode) + 1) % order.length]); }
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });

const _cq = new THREE.Quaternion(), _cpos = new THREE.Vector3(), _look = new THREE.Vector3();
function updateCamera(t) {
  if (cameraMode === 'coaster') {
    const d = carGroups[0].userData; if (!d.fwd) return;
    _cpos.copy(d.pos).addScaledVector(d.up, 1.95).addScaledVector(d.fwd, 0.6);
    camera.position.copy(_cpos);
    camera.up.copy(d.up);
    camera.lookAt(_look.copy(_cpos).addScaledVector(d.fwd, 10).addScaledVector(d.up, -1.4));
  } else if (cameraMode === 'wheel') {
    const g = gondolas[0].piv; g.updateMatrixWorld();
    _cpos.set(0, -WHEEL.Lh + 0.25, 0.55).applyMatrix4(g.matrixWorld);
    camera.position.copy(_cpos);
    camera.up.set(-Math.sin(g.rotation.z), Math.cos(g.rotation.z), 0); // horizon tilts with the cabin swing
    _look.set(0.25, -0.12, 1).applyAxisAngle(new THREE.Vector3(0, 0, 1), g.rotation.z).multiplyScalar(20).add(_cpos);
    camera.lookAt(_look);
  } else if (cameraMode === 'cine') {
    const a = t * 0.06;
    camera.up.set(0, 1, 0);
    camera.position.set(Math.cos(a) * 150, 48 + 18 * Math.sin(t * 0.11), Math.sin(a) * 120);
    camera.lookAt(5, 12, -4);
  }
}

// ===================================================================================
//                                    MAIN LOOP
// ===================================================================================
const clock = new THREE.Clock();
let acc = 0, simT = 0, lastG = { vert: 1, lat: 0 };
const FIXED = 1 / 240;
function stateLabel() {
  if (train.state === 'dwell') return train.enabled ? 'İstasyonda (biniş)' : 'Park edildi';
  if (inZone(TR.L, train.s, ZONES.lift) || inZone(TR.L, train.s - (train.cars - 1) * train.spacing, ZONES.lift)) return 'Zincirli yokuş';
  if (inZone(TR.L, train.s, ZONES.launch)) return 'Kalkış';
  if (inZone(TR.L, train.s, ZONES.brake)) return 'Fren hattı';
  return 'Serbest sürüş';
}
let hudT = 0;
function animate() {
  requestAnimationFrame(animate);
  const rdt = Math.min(clock.getDelta(), 0.1), dt = rdt * timeScale;
  const t = clock.elapsedTime;
  acc += dt;
  while (acc >= FIXED) {
    stepTrain(train, FIXED);
    stepWheel(WHEEL, FIXED, simT);
    simT += FIXED; acc -= FIXED;
  }
  lastG = placeTrain(simT);
  placeGondolas();
  updateChain(dt);
  // carousel spins up/down smoothly; horses ride the crank (sinusoidal bob)
  carouselOm += ((0.45) - carouselOm) * Math.min(1, dt * 0.5);
  carouselAng += carouselOm * dt; carRot.rotation.y = -carouselAng;
  horses.forEach(h => { h.h.position.y = 2.2 + 0.45 * Math.sin(carouselAng * 4 + h.ph); h.h.rotation.x = 0.08 * Math.cos(carouselAng * 4 + h.ph); });
  balloons.forEach(b => { b.b.position.x = b.x + Math.sin(simT * 0.7 + b.ph) * 0.3 * (0.5 + windStrength); b.b.position.y = 5 + Math.sin(simT * 1.1 + b.ph) * 0.4; });
  blendMode(rdt);
  updateBulbs(t);
  if (P.fest > 0.02 || CF.some(c => c.alive)) updateConfetti(dt, simT);
  updateFireworks(dt);
  updateCamera(simT);
  if (cameraMode === 'orbit') controls.update();
  composer.render();
  hudT -= rdt;
  if (hudT <= 0) {
    hudT = 0.1;
    const f = sampleTrack(TR, train.s);
    $('hState').textContent = stateLabel();
    $('hSpeed').textContent = (train.v * 3.6).toFixed(0) + ' km/h';
    $('hHeight').textContent = f.p[1].toFixed(1) + ' m';
    const gv = train.state === 'dwell' ? 1 : lastG.vert, gl = train.state === 'dwell' ? 0 : lastG.lat;
    $('hG').textContent = gv.toFixed(2) + ' g'; $('hLat').textContent = gl.toFixed(2) + ' g';
    document.querySelector('#gbar i').style.width = Math.max(2, Math.min(100, (gv + 1) / 6 * 100)) + '%';
    const k = Math.floor((((train.s % TR.L) + TR.L) % TR.L) / TR.ds) % TR.N;
    $('hBank').textContent = (TR.bank[k] * 180 / Math.PI).toFixed(0) + '°';
    $('hRpm').textContent = (WHEEL.Om * 60 / (2 * Math.PI)).toFixed(2) + ' rpm';
    $('hSwing').textContent = (Math.max(...WHEEL.gond.map(q => Math.abs(q.th))) * 180 / Math.PI).toFixed(1) + '°';
  }
}
setMode('day');
placeTrain(0); placeGondolas();
$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 700);
animate();
