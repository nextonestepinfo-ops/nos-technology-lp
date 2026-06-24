// hero-hybrid.js : ヒーローの A×B ハイブリッド 3D（インタラクティブ・パネル）
// 中央のAIコア（脈動する低ポリ結晶＋ワイヤー殻＋発光ハロー＋周回パーティクル）を、
// 周回するUIパネル（店舗サイト/予約管理/AI返信/地図）が囲み、コアから各パネルへ光が流れる。
// パネルはホバーで手前にズーム＋中身がビルドアニメ、クリックで対応セクションへ慣性スクロール。
// "palette" イベントで配色に追従。失敗時は main.js 側でCSS背景にフォールバック。
import * as THREE from "three";
import { pointer, prefersReducedMotion, lerp, clamp } from "./utils.js";

const hx = (s) => parseInt(s.slice(1), 16);

// 画像パネル：生成UI画像を ctx に貼り、ライブ演出（ビルドワイプ＋スキャン光＋LIVE）を重ねる。
// img未ロード時は手描きUI(drawUIWire)にフォールバック。
function drawUI(x, kind, acc, p, t = 0, img = null) {
  if (!(img && img.complete && img.naturalWidth)) { drawUIWire(x, kind, acc, p, t); return; }
  x.clearRect(0, 0, 512, 384);
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, 512, 384);
  // 画像をパネル(512×384)へカバー配置
  const cw = 512, ch = 384, ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
  let dw, dh, dx, dy;
  if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
  else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
  // p(0〜1)で左→右に“描き込まれる”ビルドワイプ
  const w = Math.max(0, Math.min(1, p));
  x.save(); x.beginPath(); x.rect(0, 0, cw * w, ch); x.clip();
  x.drawImage(img, dx, dy, dw, dh);
  x.restore();
  // ホバー中のライブ演出（青いスキャン光＋LIVE表示）
  if (t > 0) {
    const sx = (t * 0.55 * cw) % cw;
    const g = x.createLinearGradient(sx - 40, 0, sx + 40, 0);
    g.addColorStop(0, "rgba(26,92,255,0)"); g.addColorStop(.5, "rgba(26,92,255,.14)"); g.addColorStop(1, "rgba(26,92,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    // LIVE（背景ピルで画像内容に依らず視認できるように・右上）
    const blink = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 8));
    x.fillStyle = "rgba(255,255,255,.82)"; x.beginPath(); x.roundRect(cw - 80, 13, 66, 25, 12); x.fill();
    x.fillStyle = `rgba(42,193,109,${blink})`; x.beginPath(); x.arc(cw - 64, 26, 5, 0, 7); x.fill();
    x.fillStyle = "rgba(20,22,26,.7)"; x.font = "700 12px sans-serif"; x.fillText("LIVE", cw - 52, 30);
  }
}

// UIモックを ctx に手描き（画像フォールバック用）。p(0〜1)で左から“描き込まれる”ビルド表現、t>0でライブ演出。
function drawUIWire(x, kind, acc, p, t = 0) {
  x.clearRect(0, 0, 512, 384);
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, 512, 384);
  const mint = acc.mint, blue = acc.blue, ink = "#14161a", soft = "#aab2bd", bg = "#eef1f4";
  // 上部バー（常時）
  x.fillStyle = bg; x.fillRect(0, 0, 512, 54);
  x.fillStyle = mint; x.beginPath(); x.arc(40, 27, 9, 0, 7); x.fill();
  x.fillStyle = ink; x.font = "600 18px sans-serif";
  x.fillText({ site:"STORE SITE", admin:"予約 / 顧客 管理", reply:"AI 返信アシスト", map:"店舗マップ導線" }[kind], 62, 33);

  // 本文は左→右にワイプして“出来上がる”
  const w = Math.max(0, Math.min(1, p));
  if (w <= 0) return;
  x.save();
  x.beginPath(); x.rect(0, 54, 512 * w, 330); x.clip();

  const bar = (yy, ww, col, h = 14) => { x.fillStyle = col; x.beginPath(); x.roundRect(36, yy, ww, h, 7); x.fill(); };
  if (kind === "site") {
    x.fillStyle = ink; x.font = "800 44px sans-serif"; x.fillText("Beauty", 36, 140); x.fillText("Salon", 36, 188);
    bar(220, 260, soft, 12); bar(244, 200, soft, 12);
    x.fillStyle = mint; x.beginPath(); x.roundRect(36, 288, 150, 46, 23); x.fill();
    x.fillStyle = "#fff"; x.font = "700 18px sans-serif"; x.fillText("予約する", 74, 316);
    x.fillStyle = bg; x.beginPath(); x.roundRect(320, 96, 156, 238, 16); x.fill();
  } else if (kind === "admin") {
    for (let i = 0; i < 5; i++) {
      x.fillStyle = i % 2 ? "#f6f8fa" : "#fff"; x.fillRect(36, 84 + i * 46, 440, 46);
      x.fillStyle = i === 1 ? mint : soft; x.beginPath(); x.arc(60, 107 + i * 46, 8, 0, 7); x.fill();
      bar(98 + i * 46, 180, "#cdd4dc", 10);
      x.fillStyle = blue; x.beginPath(); x.roundRect(360, 96 + i * 46, 110, 22, 11); x.fill();
    }
  } else if (kind === "reply") {
    x.fillStyle = bg; x.beginPath(); x.roundRect(36, 80, 300, 52, 16); x.fill();
    bar(98, 210, "#cdd4dc", 10);
    x.fillStyle = blue; x.beginPath(); x.roundRect(150, 160, 326, 120, 16); x.fill();
    x.fillStyle = "#fff"; x.font = "600 16px sans-serif";
    x.fillText("ご予約ありがとうございます。", 172, 196); x.fillText("当日は10分前にご来店ください。", 172, 224);
    x.fillStyle = mint; x.font = "700 14px sans-serif"; x.fillText("✦ AI が文案を生成", 172, 262);
  } else {
    x.fillStyle = bg; x.fillRect(36, 72, 440, 250); x.strokeStyle = "#d7dde4"; x.lineWidth = 2;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(36, 100 + i * 40); x.lineTo(476, 100 + i * 40); x.stroke(); }
    x.fillStyle = blue; x.beginPath(); x.arc(300, 200, 16, 0, 7); x.fill();
    x.fillStyle = "rgba(63,109,240,.2)"; x.beginPath(); x.arc(300, 200, 40, 0, 7); x.fill();
    x.fillStyle = mint; x.beginPath(); x.moveTo(300, 176); x.lineTo(312, 200); x.lineTo(288, 200); x.closePath(); x.fill();
  }
  x.restore();

  // ホバー中のライブ表示（処理が動いている感：スキャン光＋LIVEドット）
  if (t > 0) {
    const sx = 36 + ((t * 0.55 * 470) % 470);
    const g = x.createLinearGradient(sx - 34, 0, sx + 34, 0);
    g.addColorStop(0, "rgba(26,92,255,0)"); g.addColorStop(.5, "rgba(26,92,255,.16)"); g.addColorStop(1, "rgba(26,92,255,0)");
    x.fillStyle = g; x.fillRect(0, 54, 512, 330);
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 8));
    x.fillStyle = `rgba(42,193,109,${blink})`; x.beginPath(); x.arc(490, 28, 5, 0, 7); x.fill();
    x.fillStyle = "rgba(20,22,26,.55)"; x.font = "600 11px sans-serif"; x.textAlign = "right"; x.fillText("LIVE", 480, 32); x.textAlign = "left";
  }
}

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function initHeroHybrid(canvas) {
  if (!canvas) return false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  cam.position.set(0, 0, 9.5);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6ee, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 1.05); dir.position.set(4, 6, 8); scene.add(dir);
  const pm = new THREE.PointLight(0x16b89a, 24, 40); pm.position.set(-5, 3, 5); scene.add(pm);
  const pb = new THREE.PointLight(0x3f6df0, 22, 40); pb.position.set(5, -3, 5); scene.add(pb);

  const group = new THREE.Group(); group.position.x = 1.7; group.rotation.x = -0.05; scene.add(group);

  // ---- 中央のAIコア ----
  const coreWrap = new THREE.Group(); group.add(coreWrap);
  const coreGeo = new THREE.IcosahedronGeometry(1.05, 2);
  const coreBase = coreGeo.attributes.position.array.slice(0);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .16, metalness: .4, flatShading: true, emissive: 0x0e9ab1, emissiveIntensity: .2 });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat); coreWrap.add(coreMesh);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x3f6df0, wireframe: true, transparent: true, opacity: .2 });
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 2), wireMat); coreWrap.add(wire);
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0x16b89a, transparent: true, opacity: .5, depthWrite: false });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(5.5, 5.5, 1); coreWrap.add(glow);
  const NP = prefersReducedMotion ? 80 : 220, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) {
    const r = 1.5 + Math.random() * 1.4, th = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1);
    pp[i * 3] = r * Math.sin(ph) * Math.cos(th); pp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); pp[i * 3 + 2] = r * Math.cos(ph);
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const ptsMat = new THREE.PointsMaterial({ color: 0x16b89a, size: .045, transparent: true, opacity: .85, depthWrite: false });
  const pts = new THREE.Points(pg, ptsMat); coreWrap.add(pts);

  // コアのホバー用：見えないプロキシ（変形しても安定して拾える）＋エネルギーリング
  coreMesh.userData = { en: "Nos Engine", jp: "AIコア" };
  const coreProxy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
  coreWrap.add(coreProxy);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x1a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 72), ringMat);
  scene.add(ring);
  let coreHover = 0, spinExtra = 0, baseEmissive = 0.2;
  const coreWorld = new THREE.Vector3();

  // ---- 周回するUIパネル（役割つき：ホバーで詳細、クリックで移動） ----
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function panelGeo(w, h) {
    const g = new THREE.ExtrudeGeometry(roundedRect(w, h, .16), { depth: .1, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 2 });
    g.center(); return g;
  }
  const defs = [
    { kind:"site",  w:2.5, h:1.85, pos:[2.9, 1.0, 0.3],  rot:[-.1, -.5, .03],  en:"Web Design",    jp:"店舗サイト制作",   target:"#works" },
    { kind:"admin", w:2.2, h:1.6,  pos:[-3.0, 1.3, -0.5], rot:[-.05, .42, -.04], en:"Admin System",  jp:"予約・顧客管理",   target:"#services" },
    { kind:"reply", w:2.1, h:1.55, pos:[2.7, -1.5, -0.2], rot:[.05, -.55, .02],  en:"AI Automation", jp:"AI業務自動化",     target:"#services" },
    { kind:"map",   w:1.95, h:1.45, pos:[-2.7, -1.2, 0.4], rot:[-.08, .5, .03],   en:"Growth",        jp:"集客・SNS導線",   target:"#services" },
  ];
  let currentAcc = { mint: "#16b89a", blue: "#3f6df0" };

  // パネルに貼る生成UI画像（kind別）。ロード完了後に該当パネルを再描画。
  const panelImg = {};
  defs.forEach((d) => {
    const im = new Image();
    im.src = `assets/panels/panel-${d.kind}.png`;
    panelImg[d.kind] = im;
  });

  const panels = defs.map((d) => {
    const geo = panelGeo(d.w, d.h);
    // パネルごとに専用キャンバス＋テクスチャ（ビルドアニメで描き替える）
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 384;
    const ctx = cv.getContext("2d");
    drawUI(ctx, d.kind, currentAcc, 1, 0, panelImg[d.kind]);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; tex.colorSpace = THREE.SRGBColorSpace;
    // 面は“発光する画面”として描く：emissiveMapで自発光させ、暗い3D空間でも色がクッキリ出る（光による白飛び/沈みを防ぐ）
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .92, roughness: .62, metalness: 0, transparent: true, toneMapped: false });
    const side = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .22, metalness: .12, transparent: true });
    const mesh = new THREE.Mesh(geo, [face, side]);
    mesh.position.set(...d.pos); mesh.rotation.set(...d.rot);
    mesh.userData = {
      kind: d.kind, en: d.en, jp: d.jp, target: d.target,
      home: new THREE.Vector3(...d.pos), baseRot: new THREE.Euler(...d.rot),
      ph: Math.random() * 6, ctx, tex,
      h: 0, progress: 1, wasHover: false, click: 0,
    };
    group.add(mesh); return mesh;
  });
  const redraw = (panel, p, t = 0) => { drawUI(panel.userData.ctx, panel.userData.kind, currentAcc, p, t, panelImg[panel.userData.kind]); panel.userData.tex.needsUpdate = true; };
  // 画像ロード完了で、対応パネルを完成形に描き直す（初期は手描きフォールバックで表示）
  panels.forEach((panel) => {
    const im = panelImg[panel.userData.kind];
    if (im && !im.complete) im.addEventListener("load", () => redraw(panel, panel.userData.progress));
  });

  // ---- コア→各パネルの結線＋流れる光 ----
  const lines = [], pulses = [], lineMats = [], pulseMats = [];
  panels.forEach(() => {
    const lm = new THREE.LineBasicMaterial({ color: 0x3f6df0, transparent: true, opacity: .32 });
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const ln = new THREE.Line(lg, lm); group.add(ln); lines.push(ln); lineMats.push(lm);
    const pmat = new THREE.MeshBasicMaterial({ color: 0x16b89a });
    const pl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pmat); group.add(pl); pulses.push(pl); pulseMats.push(pmat);
  });

  function n3(x, y, z) { return Math.sin(x * 1.7 + y * 0.3) * Math.cos(y * 1.5 + z * 0.7) * Math.sin(z * 1.3 + x * 0.5); }

  // 全画面・中央寄せレイアウト（オブジェクトを主役にするv2ヒーロー）
  const layout = canvas.dataset.layout || "side";
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
    const small = r.width < 860;
    if (layout === "center") {
      // オブジェクトを画面中央に置き、大きく見せる（文字は最小・3Dが主役）
      group.position.x = 0;
      group.scale.setScalar(small ? 0.6 : 1.0);
    } else {
      group.position.x = small ? 0 : 1.7;
      group.scale.setScalar(small ? 0.55 : 0.82);
    }
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- レイキャストでパネルを拾う ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick() {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((pointer.x - r.left) / r.width) * 2 - 1;
    ndc.y = -((pointer.y - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, cam);
    const hits = ray.intersectObjects(panels, false);
    return hits.length ? hits[0].object : null;
  }

  // ホバー中のパネルに追従する英語ラベル（3D座標を画面に投影）
  const curEl2 = document.getElementById("cursor");
  const tagEl = document.getElementById("heroTag");
  const tagEn = tagEl ? tagEl.querySelector(".en") : null;
  const tagJp = tagEl ? tagEl.querySelector(".jp") : null;
  const projV = new THREE.Vector3();
  let tagX = 0, tagY = 0, tagInit = false;
  function updateTag(panel) {
    if (!tagEl) return;
    if (!panel) { tagEl.classList.remove("is-show"); tagInit = false; return; }
    if (tagEn && tagEn.textContent !== panel.userData.en) tagEn.textContent = panel.userData.en;
    if (tagJp && tagJp.textContent !== panel.userData.jp) tagJp.textContent = panel.userData.jp;
    panel.getWorldPosition(projV); projV.project(cam);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const tx = (projV.x * 0.5 + 0.5) * cw, ty = (-projV.y * 0.5 + 0.5) * ch;
    // 切替時はスナップ、追従はスムージング（ジッター防止）
    if (!tagInit) { tagX = tx; tagY = ty; tagInit = true; }
    else { tagX += (tx - tagX) * 0.25; tagY += (ty - tagY) * 0.25; }
    tagEl.style.left = tagX + "px";
    tagEl.style.top = tagY + "px";
    tagEl.classList.add("is-show");
  }

  // クリックで対応セクションへ移動（その都度 pick して堅牢に）
  canvas.style.pointerEvents = "auto";
  canvas.addEventListener("click", () => {
    const obj = pick();
    if (!obj || !obj.userData.target) return;
    const t = document.querySelector(obj.userData.target);
    if (!t) return;
    obj.userData.click = 1; // クリック演出（前へ飛び出す）
    if (window.__lenis) window.__lenis.scrollTo(t, { offset: -10 });
    else t.scrollIntoView({ behavior: "smooth" });
  });

  let rx = 0, ry = 0;
  const cAttr = coreGeo.attributes.position;
  let hovered = null;

  function render(now) {
    const t = (now || 0) / 1000;
    // フォーカス量（いずれかのパネルにホバー中＝1へ）。全体の動きを鎮める。
    const focus = panels.reduce((mx, p) => Math.max(mx, p.userData.h), 0);
    const calm = 1 - Math.max(focus, coreHover * 0.55) * 0.9;
    rx = lerp(rx, pointer.nx * 0.5 * calm, 0.06);
    ry = lerp(ry, pointer.ny * 0.4 * calm, 0.06);
    group.rotation.y = Math.sin(t * 0.14) * 0.16 * calm + rx;
    group.rotation.x = -0.05 - ry;

    if (!prefersReducedMotion) {
      const amp = 0.16 + Math.sin(t * 1.2) * 0.05 + coreHover * 0.14;
      for (let i = 0; i < cAttr.count; i++) {
        const bx = coreBase[i * 3], by = coreBase[i * 3 + 1], bz = coreBase[i * 3 + 2];
        const d = 1 + amp * n3(bx * 1.6 + t * 0.6, by * 1.6 + t * 0.5, bz * 1.6 + t * 0.4);
        cAttr.array[i * 3] = bx * d; cAttr.array[i * 3 + 1] = by * d; cAttr.array[i * 3 + 2] = bz * d;
      }
      cAttr.needsUpdate = true; coreGeo.computeVertexNormals();
    }
    // ホバー時は回転加速・拡大・発光サージ・粒子拡散
    spinExtra += coreHover * 0.03;
    coreWrap.rotation.y = t * 0.2 + spinExtra;
    wire.rotation.y = -t * 0.26 - spinExtra * 1.4; wire.rotation.z = t * 0.12;
    pts.rotation.y = t * 0.05 + spinExtra * 0.5;
    pts.scale.setScalar(1 + coreHover * 0.55);
    coreMesh.scale.setScalar((1 + Math.sin(t * 1.6) * 0.04) * (1 + coreHover * 0.22));
    coreMat.emissiveIntensity = baseEmissive * (1 + coreHover * 2.2) + Math.sin(t * 1.6) * 0.04;
    glowMat.opacity = 0.42 + Math.sin(t * 1.6) * 0.1 + coreHover * 0.35;
    const gs = 5.5 * (1 + coreHover * 0.18); glow.scale.set(gs, gs, 1);
    // エネルギーリング（コア中心でビルボード、波及して消える）
    coreProxy.getWorldPosition(coreWorld);
    ring.position.copy(coreWorld);
    ring.quaternion.copy(cam.quaternion);
    const rp = (t * 0.9) % 1;
    const rscale = (0.8 + rp * 1.8) * group.scale.x;
    ring.scale.set(rscale, rscale, rscale);
    ringMat.opacity = coreHover * (1 - rp) * 0.7;

    // ホバー判定（パネル → 無ければ中央コア）
    hovered = pick();
    const coreHit = !hovered && ray.intersectObject(coreProxy, false).length > 0;
    coreHover = lerp(coreHover, coreHit ? 1 : 0, 0.12);
    updateTag(hovered || (coreHit ? coreMesh : null));
    if (curEl2) curEl2.classList.toggle("is-hover", !!hovered || coreHit);

    panels.forEach((m, i) => {
      const u = m.userData;
      const isH = m === hovered;
      // ホバー開始でビルドアニメを頭から
      if (isH && !u.wasHover) u.progress = 0;
      u.wasHover = isH;
      // ホバー寄り(0→1)
      u.h = lerp(u.h, isH ? 1 : 0, 0.15);
      // クリック演出の減衰
      u.click = lerp(u.click, 0, 0.08);

      // ビルド＋ライブ：ホバー中は毎フレーム描き替え（スキャン光が動く）、解除時は完成形に
      if (isH) { u.progress = Math.min(1, u.progress + 0.045); redraw(m, u.progress, t); }
      else if (u.progress !== 1) { u.progress = 1; redraw(m, 1, 0); }

      // 他パネルはフォーカス時に奥へ退いて減光（対象を引き立てる）
      const otherR = isH ? 0 : focus;

      // 位置・スケール・回転（ホバーで強く手前にズーム＋正面を向く）
      const floatY = Math.sin(t * 0.7 + u.ph) * 0.12 * (1 - u.h);
      const zBoost = u.h * 2.4 + u.click * 1.8 - otherR * 0.55;
      m.position.set(u.home.x * (1 - u.h * 0.45), (u.home.y + floatY) * (1 - u.h * 0.35), u.home.z + zBoost);
      m.scale.setScalar((1 + u.h * 0.62 + u.click * 0.28) * (1 - otherR * 0.08));
      m.rotation.x = u.baseRot.x * (1 - u.h);
      m.rotation.y = u.baseRot.y * (1 - u.h);
      m.rotation.z = u.baseRot.z * (1 - u.h) + Math.sin(t * 0.3 + i) * 0.02 * (1 - u.h);
      const op = 1 - otherR * 0.38;
      m.material[0].opacity = op; m.material[1].opacity = op;

      // 結線・流れる光（パネルへ）。ホバー対象は強調、他はフォーカス時に減光・パルス停止。
      const a = lines[i].geometry.attributes.position;
      a.setXYZ(0, 0, 0, 0); a.setXYZ(1, m.position.x, m.position.y, m.position.z); a.needsUpdate = true;
      lineMats[i].opacity = isH ? 0.75 : 0.3 * (1 - focus * 0.7);
      pulses[i].visible = isH || focus < 0.4;
      const pu = (t * 0.16 + i * 0.27) % 1;
      pulses[i].position.set(m.position.x * pu, m.position.y * pu, m.position.z * pu);
      pulses[i].scale.setScalar((0.7 + Math.sin(pu * Math.PI) * 0.7) * (isH ? 1.2 : 1));
    });

    renderer.render(scene, cam);
  }

  // ---- 配色適用（palette イベント）----
  function applyPalette(p) {
    const M = hx(p.css.mint), B = hx(p.css.blue), L = hx(p.css.lav);
    pm.color.setHex(M); pb.color.setHex(B);
    coreMat.emissive.setHex(L); baseEmissive = p.dark ? 0.45 : 0.2; coreMat.emissiveIntensity = baseEmissive; coreMat.metalness = p.dark ? 0.5 : 0.4;
    wireMat.color.setHex(B); wireMat.opacity = p.dark ? 0.3 : 0.2;
    glowMat.color.setHex(M); ptsMat.color.setHex(M);
    lineMats.forEach((m) => { m.color.setHex(B); m.opacity = p.dark ? 0.5 : 0.32; });
    pulseMats.forEach((m) => m.color.setHex(M));
    currentAcc = { mint: p.css.mint, blue: p.css.blue };
    panels.forEach((m) => redraw(m, m.userData.progress)); // 現在の進捗で塗り直し
  }
  window.addEventListener("palette", (e) => applyPalette(e.detail));

  // 配色はブランド固定（ネイビー×ブルー）で初期化
  applyPalette({ css: { mint: "#1a5cff", blue: "#3d8bff", lav: "#5b6bff" }, dark: false });

  if (prefersReducedMotion) {
    render(0);
  } else {
    const loop = (now) => { render(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  return true;
}
