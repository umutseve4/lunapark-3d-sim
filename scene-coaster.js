// ============================== RENDERING / SCENE ==============================
const $ = (id) => document.getElementById(id);
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const rand = (a, b) => a + Math.random() * (b - a);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe8ff, 120, 520);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(-95, 62, 125);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(5, 10, -4);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 8; controls.maxDistance = 420;

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x3d5a2a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
sun.position.set(-120, 160, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 110, bottom: -110, near: 10, far: 500 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
scene.add(sun);
const ambient = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambient);

// ---------- sky dome, stars, sun/moon ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x2f7fd6) }, horizon: { value: new THREE.Color(0xc7e6ff) }, bottom: { value: new THREE.Color(0x9cc9a0) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vP;
    void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(horizon, bottom, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(950, 32, 16), skyMat);
scene.add(sky);
const starGeo = new THREE.BufferGeometry(); {
  const a = [];
  for (let i = 0; i < 2200; i++) { const u = Math.random() * Math.PI * 2, v = Math.acos(rand(0.05, 1)); a.push(880 * Math.sin(v) * Math.cos(u), 880 * Math.cos(v), 880 * Math.sin(v) * Math.sin(u)); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
}
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
scene.add(new THREE.Points(starGeo, starMat));
const orb = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d0, fog: false, toneMapped: false }));
scene.add(orb);

// ---------- materials ----------
const M = {
  grass: new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 1 }),
  path: new THREE.MeshStandardMaterial({ color: 0xcdbb98, roughness: 0.95 }),
  plaza: new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: 0.9 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.75, roughness: 0.3 }),
  spine: new THREE.MeshStandardMaterial({ color: 0xe0362c, metalness: 0.4, roughness: 0.45 }),
  tie: new THREE.MeshStandardMaterial({ color: 0x8a1d18, metalness: 0.4, roughness: 0.5 }),
  support: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, metalness: 0.35, roughness: 0.55 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x9a9a96, roughness: 1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xeef1f5, metalness: 0.6, roughness: 0.35 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x3a3f48, metalness: 0.7, roughness: 0.4 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc87533, metalness: 0.8, roughness: 0.35 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2f6e2c, roughness: 0.9 }),
  window: new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0xffd27a, emissiveIntensity: 0, roughness: 0.3 }),
};
const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene, cast = true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
};
const cyl = (rt, rb, h, mat, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };
// cylinder between two points
const _up = new THREE.Vector3(0, 1, 0);
function beam(a, b, r, mat, parent = scene, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const m = cyl(r, r, L, mat, seg);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(_up, d.normalize());
  parent.add(m); return m;
}
function textSprite(text, w, h, bg = '#c81d25', fg = '#fff', border = '#ffd23f') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = border; g.lineWidth = 18; g.strokeRect(9, 9, c.width - 18, c.height - 18);
  g.fillStyle = fg; g.font = `900 ${Math.round(c.height * 0.5)}px "Segoe UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.15, roughness: 0.6 });
  signMats.push(mat);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
const signMats = [];

// ---------- light bulbs (instanced, glow at night, chase pattern in festival) ----------
const bulbSets = [];
const bulbGeo = new THREE.SphereGeometry(1, 8, 6);
function makeBulbs(parent, positions, colors, radius = 0.17, chaseSpeed = 1) {
  const mesh = new THREE.InstancedMesh(bulbGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => { m.makeScale(radius, radius, radius).setPosition(p); mesh.setMatrixAt(i, m); mesh.setColorAt(i, new THREE.Color(1, 1, 1)); });
  parent.add(mesh);
  bulbSets.push({ mesh, base: colors.map(c => new THREE.Color(c)), n: positions.length, chaseSpeed });
  return mesh;
}
const _c = new THREE.Color(), _off = new THREE.Color(0xb8b4a8);
function updateBulbs(t) {
  for (const S of bulbSets) {
    for (let i = 0; i < S.n; i++) {
      const base = S.base[i];
      let r = base.r, g = base.g, b = base.b;
      if (P.fest > 0.001) { _c.setHSL((i / S.n * 3 + t * 0.35 * S.chaseSpeed) % 1, 1, 0.55); r += (_c.r - r) * P.fest; g += (_c.g - g) * P.fest; b += (_c.b - b) * P.fest; }
      let k = P.bulbs * 2.2;
      if (P.fest > 0.001) k *= 1 - P.fest * 0.55 * (Math.sin(i * 0.9 - t * 7 * S.chaseSpeed) > 0.3 ? 1 : 0);
      else if (P.bulbs > 0.5) k *= 0.92 + 0.08 * Math.sin(i * 1.7 + t * 3);
      const off = 1 - Math.min(1, P.bulbs);
      _c.setRGB(_off.r * off * 0.8 + r * k, _off.g * off * 0.8 + g * k, _off.b * off * 0.8 + b * k);
      S.mesh.setColorAt(i, _c);
    }
    S.mesh.instanceColor.needsUpdate = true;
  }
}

// ---------- ground ----------
const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 64), M.grass);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(176, 40), M.plaza);
plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.03, -4); plaza.receiveShadow = true; scene.add(plaza);
const walk = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), M.path);
walk.rotation.x = -Math.PI / 2; walk.position.set(-14, 0.04, 44); walk.receiveShadow = true; scene.add(walk);
const front = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), M.path);
front.rotation.x = -Math.PI / 2; front.position.set(-14, 0.035, 28.5); front.receiveShadow = true; scene.add(front);

// ===================================================================================
//                                   ROLLER COASTER
// ===================================================================================
const CP = coasterControlPoints();
const TR = buildTrack(CP, 4000);
const marks = coasterMarks(CP), nS = (p) => nearestS(TR, p);
const ZONES = { launch: [nS(marks.launch[0]), nS(marks.launch[1])], lift: [nS(marks.lift[0]), nS(marks.lift[1])], brake: [nS(marks.brake[0]), nS(marks.brake[1])], stopS: nS(marks.stop) };
const train = makeTrain(TR, ZONES, { cars: 5, spacing: 3.1 });

// right-handed frame helpers: x = N×T (rider's left→right is -x … irrelevant for symmetric parts), y = N, z = T
function frameAt(k) { const t = TR.T[k], n = TR.Nr[k]; return { p: V(TR.P[k]), t: V(t), n: V(n), x: V(v3.cross(n, t)) }; }

// tube that follows the track frames (exact, seamless on the closed loop)
function frameTube(offX, offN, radius, mat, step = 3, radial = 8) {
  const rings = Math.floor(TR.N / step), pos = [], nor = [], idx = [];
  for (let r = 0; r < rings; r++) {
    const f = frameAt(r * step);
    const c = f.p.clone().addScaledVector(f.x, offX).addScaledVector(f.n, offN);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const d = f.x.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.n, Math.sin(a));
      pos.push(c.x + d.x * radius, c.y + d.y * radius, c.z + d.z * radius); nor.push(d.x, d.y, d.z);
    }
  }
  for (let r = 0; r < rings; r++) for (let j = 0; j < radial; j++) {
    const a = r * radial + j, b = ((r + 1) % rings) * radial + j, c = ((r + 1) % rings) * radial + (j + 1) % radial, d = r * radial + (j + 1) % radial;
    idx.push(a, b, d, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
const GAUGE = 0.56; // half distance between running rails
frameTube(GAUGE, 0, 0.085, M.rail);
frameTube(-GAUGE, 0, 0.085, M.rail);
frameTube(0, -0.5, 0.24, M.spine, 3, 10);

// cross-ties + vertical struts (instanced)
{
  const every = Math.round(1.1 / TR.ds), count = Math.floor(TR.N / every);
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.36, 0.1, 0.16), M.tie, count);
  const struts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), M.tie, count * 2);
  const m = new THREE.Matrix4(), q = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const f = frameAt(i * every);
    q.makeBasis(f.x, f.n, f.t);
    m.copy(q).setPosition(f.p.clone().addScaledVector(f.n, -0.12)); ties.setMatrixAt(i, m);
    for (const sx of [-1, 1]) {
      const rot = new THREE.Matrix4().makeRotationZ(sx * 0.85);
      m.copy(q).multiply(rot).setPosition(f.p.clone().addScaledVector(f.n, -0.3).addScaledVector(f.x, sx * 0.28));
      struts.setMatrixAt(i * 2 + (sx > 0 ? 1 : 0), m);
    }
  }
  ties.castShadow = struts.castShadow = true;
  scene.add(ties, struts);
}

// support columns – placed only where the vertical column would not intersect other parts of the track
{
  const cols = [], step = Math.round(5.5 / TR.ds);
  for (let k = 0; k < TR.N; k += step) {
    const f = frameAt(k);
    if (f.n.y < 0.55 || f.p.y < 1.2) continue;
    const top = f.p.clone().addScaledVector(f.n, -0.72);
    let blocked = false;
    for (let j = 0; j < TR.N; j += 3) {
      if (Math.min(Math.abs(j - k), TR.N - Math.abs(j - k)) * TR.ds < 9) continue; // ignore own neighbourhood
      const q = TR.P[j];
      if (Math.hypot(q[0] - top.x, q[2] - top.z) < 2.3 && q[1] < top.y - 0.6) { blocked = true; break; }
    }
    if (!blocked) cols.push(top);
  }
  const colMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.34, 1, 10).translate(0, 0.5, 0), M.support, cols.length);
  const foot = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), M.concrete, cols.length);
  const cap = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), M.support, cols.length);
  const m = new THREE.Matrix4();
  cols.forEach((c, i) => {
    m.makeScale(1, c.y, 1).setPosition(c.x, 0, c.z); colMesh.setMatrixAt(i, m);
    m.makeTranslation(c.x, 0.2, c.z); foot.setMatrixAt(i, m);
    m.makeTranslation(c.x, c.y, c.z); cap.setMatrixAt(i, m);
  });
  colMesh.castShadow = cap.castShadow = true; foot.receiveShadow = true;
  scene.add(colMesh, foot, cap);
}

// magnetic brake fins (copper) along the brake run & station tyres
{
  const fins = [], s0 = ZONES.brake[0], len = fwdDist(TR.L, ZONES.brake[0], ZONES.brake[1]);
  for (let d = 0; d < len; d += 1.4) fins.push(s0 + d);
  const fm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.32, 1.1), M.copper, fins.length);
  const m = new THREE.Matrix4(), q = new THREE.Matrix4();
  fins.forEach((s, i) => { const k = Math.floor((((s % TR.L) + TR.L) % TR.L) / TR.ds) % TR.N, f = frameAt(k); q.makeBasis(f.x, f.n, f.t); m.copy(q).setPosition(f.p.clone().addScaledVector(f.n, -0.28)); fm.setMatrixAt(i, m); });
  scene.add(fm);
}

// moving lift chain (links slide along the spine at chain speed)
const chainLinks = (() => {
  const len = fwdDist(TR.L, ZONES.lift[0], ZONES.lift[1]), n = Math.floor(len / 0.6);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.08, 0.36), M.darkSteel, n);
  scene.add(im); return { im, n, len, off: 0 };
})();
function updateChain(dt) {
  chainLinks.off = (chainLinks.off + train.liftV * dt) % 0.6;
  const m = new THREE.Matrix4(), q = new THREE.Matrix4();
  for (let i = 0; i < chainLinks.n; i++) {
    const s = ZONES.lift[0] + i * 0.6 + chainLinks.off;
    const f = sampleTrack(TR, s), t = V(f.t), n = V(f.n), x = V(v3.cross(f.n, f.t));
    q.makeBasis(x, n, t); m.copy(q).setPosition(V(f.p).addScaledVector(n, -0.2));
    chainLinks.im.setMatrixAt(i, m);
  }
  chainLinks.im.instanceMatrix.needsUpdate = true;
}

// station building
{
  const sx0 = -36, sx1 = 8, zc = 22;
  box(sx1 - sx0, 2.3, 4.2, M.concrete, (sx0 + sx1) / 2, 1.15, zc + 3.0);          // boarding platform
  box(sx1 - sx0, 2.3, 2.4, M.concrete, (sx0 + sx1) / 2, 1.15, zc - 2.6);          // exit platform
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1f4fa3, roughness: 0.6, metalness: 0.2 });
  const roof = box(sx1 - sx0 + 4, 0.5, 11, roofMat, (sx0 + sx1) / 2, 8.6, zc + 0.4);
  roof.rotation.x = 0.04;
  for (let x = sx0; x <= sx1; x += 11) for (const z of [zc - 3.6, zc + 4.9]) { const c = cyl(0.25, 0.25, 6.4, M.steel); c.position.set(x, 5.4, z); scene.add(c); }
  const back = box(sx1 - sx0, 6.2, 0.4, M.window, (sx0 + sx1) / 2, 5.4, zc + 5.1); back.material = M.window;
  const sign = textSprite('ULUDAĞ EKSPRES', 22, 2.6);
  sign.position.set((sx0 + sx1) / 2, 10.4, zc + 5.6); sign.rotation.y = Math.PI; scene.add(sign);
  const sign2 = sign.clone(); sign2.position.z = zc + 5.62; sign2.rotation.y = 0; scene.add(sign2);
  const bp = [], bc = [];
  for (let x = sx0 - 2; x <= sx1 + 2; x += 1.2) for (const z of [zc - 5.1, zc + 5.9]) { bp.push(new THREE.Vector3(x, 8.25, z)); bc.push(0xfff1c4); }
  makeBulbs(scene, bp, bc, 0.16, 0.6);
}

// ---------- train ----------
const carGroups = [], riders = [], couplers = [];
const carColors = [0xffc21a, 0xff3b30, 0x1e88e5, 0x2ecc71, 0xb05cff];
function makeCar(i) {
  const g = new THREE.Group(); g.matrixAutoUpdate = false;
  const bodyMat = new THREE.MeshStandardMaterial({ color: carColors[i], metalness: 0.45, roughness: 0.35 });
  const trim = M.darkSteel;
  box(1.3, 0.24, 2.4, trim, 0, 0.32, 0, g);                         // chassis
  box(1.5, 0.55, 2.3, bodyMat, 0, 0.72, 0, g);                       // tub
  if (i === 0) { const nose = box(1.5, 0.5, 0.9, bodyMat, 0, 0.75, 1.45, g); nose.rotation.x = -0.35; const hl = box(0.9, 0.12, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff6c8, toneMapped: false }), 0, 0.85, 1.86, g); hl.rotation.x = -0.35; headlights.push(hl); }
  for (const z of [0.55, -0.55]) {
    box(1.4, 0.75, 0.16, bodyMat, 0, 1.25, z - 0.38, g);           // seat back
    box(1.3, 0.08, 0.5, M.darkSteel, 0, 0.98, z - 0.05, g);          // seat
    const bar = box(1.1, 0.07, 0.07, M.steel, 0, 1.28, z + 0.35, g); // lap bar
    for (const x of [-0.34, 0.34]) {                                 // riders
      const r = new THREE.Group(); r.position.set(x, 1.0, z - 0.05);
      const shirt = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5), roughness: 0.8 });
      const skin = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.07, 0.45, rand(0.35, 0.7)), roughness: 0.8 });
      box(0.36, 0.5, 0.26, shirt, 0, 0.3, -0.05, r);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skin); head.position.set(0, 0.72, -0.03); r.add(head);
      const arms = [];
      for (const ax of [-0.22, 0.22]) {
        const pivot = new THREE.Group(); pivot.position.set(ax, 0.5, 0); r.add(pivot);
        box(0.09, 0.5, 0.09, shirt, 0, -0.25, 0, pivot, false); arms.push(pivot);
      }
      g.add(r); riders.push({ arms, car: i, phase: Math.random() * 6 });
    }
  }
  // bogies with road/guide wheels gripping both rails
  for (const z of [1.0, -1.0]) for (const x of [-GAUGE, GAUGE]) {
    const w = cyl(0.14, 0.14, 0.12, M.darkSteel, 10); w.rotation.z = Math.PI / 2; w.position.set(x, 0.17, z); g.add(w);
    const w2 = w.clone(); w2.position.y = -0.17; g.add(w2);
    const wb = box(0.08, 0.45, 0.4, M.darkSteel, x * 1.22, 0, z, g, false);
  }
  scene.add(g); return g;
}
const headlights = [];
for (let i = 0; i < train.cars; i++) carGroups.push(makeCar(i));
for (let i = 0; i < train.cars - 1; i++) {
  const c = cyl(0.07, 0.07, 1, M.steel, 8); scene.add(c);
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M.darkSteel), b2 = b1.clone(); scene.add(b1, b2);
  couplers.push({ c, b1, b2 });
}
const BOGIE = 1.0, _m = new THREE.Matrix4();
function placeTrain(t) {
  const L = TR.L;
  for (let i = 0; i < train.cars; i++) {
    const sc = train.s - i * train.spacing;
    // car body rides on two bogies -> its axis is the chord between them (correct on curves & loops)
    const ff = sampleTrack(TR, sc + BOGIE), fr = sampleTrack(TR, sc - BOGIE);
    const pf = V(ff.p), pr = V(fr.p);
    const fwd = pf.clone().sub(pr).normalize();
    const up = V(ff.n).add(V(fr.n)).normalize();
    up.addScaledVector(fwd, -up.dot(fwd)).normalize();
    const x = new THREE.Vector3().crossVectors(up, fwd);
    _m.makeBasis(x, up, fwd).setPosition(pf.add(pr).multiplyScalar(0.5));
    carGroups[i].matrix.copy(_m); carGroups[i].matrixWorldNeedsUpdate = true;
    carGroups[i].userData = { fwd, up, pos: new THREE.Vector3().setFromMatrixPosition(_m) };
  }
  // couplers: rear hitch of car i  <->  front hitch of car i+1 (both on the rail centre line)
  for (let i = 0; i < train.cars - 1; i++) {
    const s = train.s - i * train.spacing;
    const a = sampleTrack(TR, s - 1.25), b = sampleTrack(TR, s - train.spacing + 1.25);
    const pa = V(a.p).addScaledVector(V(a.n), 0.32), pb = V(b.p).addScaledVector(V(b.n), 0.32);
    const d = pb.clone().sub(pa), len = d.length();
    const C = couplers[i];
    C.c.position.copy(pa).addScaledVector(d, 0.5); C.c.scale.set(1, len, 1); C.c.quaternion.setFromUnitVectors(_up, d.normalize());
    C.b1.position.copy(pa); C.b2.position.copy(pb);
  }
  // riders: hands up on drops / airtime, down on the lift
  const g = gForce(TR, train.s, train.v);
  for (const r of riders) {
    const thrill = train.state === 'run' && train.v > 9 ? 1 : 0;
    const target = thrill ? -2.7 + 0.25 * Math.sin(t * 4 + r.phase) : -0.15;
    for (const a of r.arms) a.rotation.x += (target - a.rotation.x) * 0.08;
  }
  return g;
}

