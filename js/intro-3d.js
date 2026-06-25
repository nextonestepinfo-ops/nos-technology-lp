// intro-3d.js : Introセクション右側の小さな3D。
// 中央のガラス質コアへ、日々のタスク（小パネル）が螺旋を描いて吸い込まれ＝AIが肩代わり、
// その上に“戻った時間”が光の粒子となって立ち上る。サイトの世界観（暗×ブルー/シアン）に統一。
// 画面内に入った時だけ描画（パフォーマンス配慮）。WebGL不可時は呼ばれない（main.js側でガード）。
import * as THREE from "three";
import { pointer, prefersReducedMotion } from "./utils.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.45, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function initIntro3D(canvas) {
  if (!canvas) return false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(46, 1, 0.1, 100); cam.position.set(0, 0, 7);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2230, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(3, 5, 6); scene.add(dir);
  const pm = new THREE.PointLight(0x36c5ff, 16, 30); pm.position.set(-4, 2, 4); scene.add(pm);
  const pb = new THREE.PointLight(0x3d8bff, 14, 30); pb.position.set(4, -2, 3); scene.add(pb);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const group = new THREE.Group(); scene.add(group);

  // 中央コア：ガラス/メタル質の結晶（自発光）
  const coreMat = new THREE.MeshPhysicalMaterial({ color: 0x121a33, metalness: .5, roughness: .14, clearcoat: 1, clearcoatRoughness: .1, emissive: 0x1a5cff, emissiveIntensity: .55, envMapIntensity: 1.5 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), coreMat);
  group.add(core);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, 1), new THREE.MeshBasicMaterial({ color: 0x36c5ff, wireframe: true, transparent: true, opacity: .18 }));
  group.add(wire);
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0x36c5ff, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(5, 5, 1); group.add(glow);

  // 周回タスク（小パネル）：螺旋を描いてコアへ吸い込まれ、消える＝肩代わり
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  const panelGeo = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.46, .1), { depth: .06, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1 });
  panelGeo.center();
  const NPANL = prefersReducedMotion ? 4 : 7;
  const panels = [];
  for (let i = 0; i < NPANL; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xeaf1ff, roughness: .35, metalness: .1, emissive: 0x2b6cff, emissiveIntensity: .35, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(panelGeo, mat);
    m.userData = { ang: (i / NPANL) * Math.PI * 2, p: i / NPANL, spd: 0.06 + Math.random() * 0.03, tilt: Math.random() * 0.6 - 0.3 };
    group.add(m); panels.push(m);
  }

  // “戻った時間”の上昇パーティクル
  const NP = prefersReducedMotion ? 40 : 110;
  const pp = new Float32Array(NP * 3), pv = new Float32Array(NP);
  const reset = (i, init) => {
    const r = Math.random() * 0.7;
    const a = Math.random() * 6.28;
    pp[i * 3] = Math.cos(a) * r; pp[i * 3 + 1] = (init ? Math.random() * 3 - 0.5 : -0.6); pp[i * 3 + 2] = Math.sin(a) * r;
    pv[i] = 0.004 + Math.random() * 0.01;
  };
  for (let i = 0; i < NP; i++) reset(i, true);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const ptsMat = new THREE.PointsMaterial({ color: 0x6fe0ff, size: .05, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(pg, ptsMat); group.add(pts);

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // 画面内だけ描画（パフォーマンス）
  let visible = true;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.05 });
    io.observe(canvas);
  }

  let rx = 0, ry = 0;
  function render(now) {
    const t = (now || 0) / 1000;
    if (visible) {
      rx += (pointer.nx * 0.3 - rx) * 0.05;
      ry += (pointer.ny * 0.2 - ry) * 0.05;
      group.rotation.y = t * 0.12 + rx;
      group.rotation.x = -ry * 0.6;
      core.rotation.y = t * 0.3; core.rotation.x = Math.sin(t * 0.5) * 0.2;
      core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);
      coreMat.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.08;
      wire.rotation.y = -t * 0.2; wire.rotation.z = t * 0.1;
      glowMat.opacity = 0.42 + Math.sin(t * 1.6) * 0.1;

      // タスクパネル：螺旋でコアへ吸い込まれて消える→リセット（肩代わりの反復）
      panels.forEach((m) => {
        const u = m.userData;
        if (!prefersReducedMotion) { u.p += u.spd * 0.016 * 16; u.ang += 0.01; }
        if (u.p >= 1) { u.p = 0; u.ang += 1.3; }
        const rad = 2.4 * (1 - u.p) + 0.15;
        const y = (0.8 - u.p * 1.0) + u.tilt;
        m.position.set(Math.cos(u.ang) * rad, y, Math.sin(u.ang) * rad);
        const sc = 0.5 + (1 - u.p) * 0.6;
        m.scale.setScalar(sc);
        m.rotation.set(u.tilt, u.ang + Math.PI / 2, 0);
        m.material.opacity = Math.min(1, (1 - u.p) * 1.6) * Math.min(1, u.p * 6); // 出現と吸込で両端フェード
      });

      // パーティクル上昇
      if (!prefersReducedMotion) {
        const a = pg.attributes.position;
        for (let i = 0; i < NP; i++) {
          pp[i * 3 + 1] += pv[i] * 16;
          if (pp[i * 3 + 1] > 2.6) reset(i, false);
        }
        a.needsUpdate = true;
      }
      renderer.render(scene, cam);
    }
    requestAnimationFrame(render);
  }
  if (prefersReducedMotion) { resize(); renderer.render(scene, cam); }
  requestAnimationFrame(render);

  // 配色追従（任意）：palette イベントでアクセント色を更新
  const hx = (s) => parseInt(s.slice(1), 16);
  window.addEventListener("palette", (e) => {
    const c = e.detail && e.detail.css; if (!c) return;
    coreMat.emissive.setHex(hx(c.blue)); glowMat.color.setHex(hx(c.mint));
    wire.material.color.setHex(hx(c.mint)); pm.color.setHex(hx(c.mint)); pb.color.setHex(hx(c.blue));
    ptsMat.color.setHex(hx(c.mint));
  });
  return true;
}
