// service-hero.js : 各サービスページのヒーローに置く“制作ムービー風”シネマティック3Dシーン
// 中央の3Dパネル上で、サイト/AI/管理画面が「自動で組み上がっていく」ビルドアニメを繰り返し再生。
// カメラのゆるいドリー＋ポインター視差＋発光。配色は "palette" イベントで追従。
import * as THREE from "three";
import { pointer, prefersReducedMotion, lerp } from "./utils.js";

const hx = (s) => parseInt(s.slice(1), 16);

// パネル内の“制作中”UIを描く。p(0〜1)で左から組み上がり、tでライブ演出（スキャン光/カーソル点滅）。
function drawBuild(x, kind, acc, p, t) {
  const W = 1024, H = 640;
  x.clearRect(0, 0, W, H);
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  const mint = acc.mint, blue = acc.blue, ink = "#14161a", soft = "#c2cad3", bg = "#eef1f4";
  // ブラウザ・クローム（常時）
  x.fillStyle = bg; x.fillRect(0, 0, W, 64);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(34 + i * 26, 32, 8, 0, 7); x.fill(); });
  x.fillStyle = "#fff"; x.beginPath(); x.roundRect(150, 16, 720, 32, 16); x.fill();
  x.fillStyle = "#9aa3ad"; x.font = "500 18px sans-serif";
  x.fillText({ web: "https://your-shop.jp", ai: "AI Assist Console", system: "admin.your-shop.jp" }[kind], 174, 38);

  const w = Math.max(0, Math.min(1, p));
  x.save(); x.beginPath(); x.rect(0, 64, W * w, H - 64); x.clip();
  const bar = (xx, yy, ww, hh, col, r = 8) => { x.fillStyle = col; x.beginPath(); x.roundRect(xx, yy, ww, hh, r); x.fill(); };

  if (kind === "web") {
    x.fillStyle = ink; x.font = "800 76px sans-serif"; x.fillText("Beauty Salon", 70, 210);
    bar(70, 250, 520, 18, "#dfe4ea"); bar(70, 286, 420, 18, "#dfe4ea");
    x.fillStyle = mint; x.beginPath(); x.roundRect(70, 340, 230, 64, 32); x.fill();
    x.fillStyle = "#fff"; x.font = "700 26px sans-serif"; x.fillText("予約する", 120, 380);
    bar(640, 150, 320, 410, bg, 18); // 画像枠
    x.fillStyle = "#dbe2ea"; x.beginPath(); x.arc(800, 320, 70, 0, 7); x.fill();
  } else if (kind === "ai") {
    bar(70, 120, 540, 86, bg, 18);
    bar(96, 150, 360, 16, "#cfd6de"); bar(96, 178, 240, 16, "#cfd6de");
    x.fillStyle = blue; x.beginPath(); x.roundRect(360, 250, 600, 220, 20); x.fill();
    x.fillStyle = "#fff"; x.font = "500 28px sans-serif";
    x.fillText("ご予約ありがとうございます。", 392, 318);
    x.fillText("当日は10分前にお越しください。", 392, 360);
    x.fillStyle = mint; x.font = "700 22px sans-serif"; x.fillText("✦ AI が文案を生成中…", 392, 420);
  } else {
    for (let i = 0; i < 6; i++) {
      x.fillStyle = i % 2 ? "#f6f8fa" : "#fff"; x.fillRect(70, 110 + i * 74, 600, 74);
      x.fillStyle = i === 1 ? mint : "#cfd6de"; x.beginPath(); x.arc(108, 147 + i * 74, 12, 0, 7); x.fill();
      bar(150, 138 + i * 74, 300, 16, "#cfd6de");
      x.fillStyle = blue; x.beginPath(); x.roundRect(560, 130 + i * 74, 90, 34, 17); x.fill();
    }
    bar(710, 110, 250, 250, bg, 18); // チャート枠
    x.strokeStyle = mint; x.lineWidth = 4; x.beginPath();
    for (let i = 0; i <= 6; i++) { const px = 730 + i * 35, py = 320 - (Math.sin(i + t) * 0.5 + 0.5) * 150; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  }
  x.restore();

  // ライブ演出：スキャン光＋カーソル点滅
  const sx = ((t * 0.4 * W) % W);
  const g = x.createLinearGradient(sx - 60, 0, sx + 60, 0);
  g.addColorStop(0, "rgba(60,139,255,0)"); g.addColorStop(.5, "rgba(60,139,255,.10)"); g.addColorStop(1, "rgba(60,139,255,0)");
  x.fillStyle = g; x.fillRect(0, 64, W, H - 64);
  if (Math.sin(t * 7) > 0) { x.fillStyle = "rgba(20,22,26,.6)"; x.fillRect(70 + w * 60, 460, 3, 30); }
}

export function initServiceHero(canvas, kind = "web") {
  if (!canvas) return false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  cam.position.set(0, 0, 9);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x20242c, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0); dir.position.set(4, 6, 8); scene.add(dir);
  const pm = new THREE.PointLight(0x36c5ff, 26, 50); pm.position.set(-6, 3, 5); scene.add(pm);
  const pb = new THREE.PointLight(0x3d8bff, 24, 50); pb.position.set(6, -3, 5); scene.add(pb);

  const group = new THREE.Group(); group.position.x = 1.6; scene.add(group);

  // ビルド用キャンバス＋テクスチャ
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 640;
  const ctx = cv.getContext("2d");
  let acc = { mint: "#36c5ff", blue: "#3d8bff" };
  drawBuild(ctx, kind, acc, 1, 0);
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; tex.colorSpace = THREE.SRGBColorSpace;

  // 角丸パネル
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(); const a = -w / 2, b = -h / 2;
    s.moveTo(a + r, b); s.lineTo(a + w - r, b); s.quadraticCurveTo(a + w, b, a + w, b + r); s.lineTo(a + w, b + h - r);
    s.quadraticCurveTo(a + w, b + h, a + w - r, b + h); s.lineTo(a + r, b + h); s.quadraticCurveTo(a, b + h, a, b + h - r);
    s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b); return s;
  }
  const geo = new THREE.ExtrudeGeometry(roundedRect(4.6, 2.875, .14), { depth: .12, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 });
  geo.center();
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: .35, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .25, metalness: .1 });
  const panel = new THREE.Mesh(geo, [face, side]);
  group.add(panel);

  // 発光ハロー
  function glowTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(.45, "rgba(255,255,255,.4)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0x36c5ff, transparent: true, opacity: .45, depthWrite: false });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(9, 7, 1); glow.position.z = -0.6; group.add(glow);

  // 周回パーティクル（シネマティックな奥行き）
  const NP = prefersReducedMotion ? 60 : 160, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { pp[i*3]=(Math.random()*2-1)*6; pp[i*3+1]=(Math.random()*2-1)*4; pp[i*3+2]=-Math.random()*4; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const ptsMat = new THREE.PointsMaterial({ color: 0x36c5ff, size: .04, transparent: true, opacity: .6, depthWrite: false });
  const pts = new THREE.Points(pg, ptsMat); group.add(pts);

  let baseScale = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
    const small = r.width < 860;
    group.position.x = small ? 0 : 1.6;
    baseScale = small ? 0.7 : 1;
    group.scale.setScalar(baseScale);
  }
  resize();
  window.addEventListener("resize", resize);

  // ヒーローのホバー＆スクロール進行で“画面の中へズームイン”
  const heroEl = canvas.closest(".hero");
  let hoverTarget = 0, hover = 0;
  if (heroEl) {
    heroEl.addEventListener("pointerenter", () => (hoverTarget = 1));
    heroEl.addEventListener("pointerleave", () => (hoverTarget = 0));
  }
  const heroProgress = () => {
    if (!heroEl) return 0;
    const h = heroEl.offsetHeight || 1;
    return Math.max(0, Math.min(1, (window.scrollY || window.pageYOffset || 0) / (h * 0.85)));
  };

  // ビルドの進行（0→1で組み上げ→保持→リセットを繰り返す）
  let phase = 0;
  let rx = 0, ry = 0, camZ = 9;
  function render(now) {
    const t = (now || 0) / 1000;
    hover = lerp(hover, hoverTarget, 0.08);
    const sp = heroProgress(); // 0→1 スクロール進行
    rx = lerp(rx, pointer.nx * 0.4, 0.05);
    ry = lerp(ry, pointer.ny * 0.3, 0.05);
    group.rotation.y = -0.18 + Math.sin(t * 0.2) * 0.06 + rx;
    group.rotation.x = -0.04 - ry;
    panel.position.y = Math.sin(t * 0.6) * 0.08 * (1 - hover * 0.5);
    // スクロールで奥→手前へドリーイン＋ホバーでさらに寄る（画面の中に入っていく感覚）
    const targetZ = 9 + Math.sin(t * 0.15) * 0.3 - sp * 3.2 - hover * 1.4;
    camZ = lerp(camZ, targetZ, 0.06);
    cam.position.z = Math.max(4.2, camZ);
    group.scale.setScalar(baseScale * (1 + hover * 0.05));
    pts.rotation.y = t * 0.03;
    glowMat.opacity = 0.4 + Math.sin(t * 1.4) * 0.08 + hover * 0.18;

    if (!prefersReducedMotion) {
      // ホバー中は構築が速まり“動いている”感を強める
      const speed = 1 + hover * 0.9;
      phase = (t * speed) % 4.5;
      const p = phase < 3 ? phase / 3 : 1;
      drawBuild(ctx, kind, acc, p, t * speed);
      tex.needsUpdate = true;
    }
    renderer.render(scene, cam);
  }

  function applyPalette(pal) {
    const M = hx(pal.css.mint), B = hx(pal.css.blue);
    pm.color.setHex(M); pb.color.setHex(B); glowMat.color.setHex(M); ptsMat.color.setHex(M);
    acc = { mint: pal.css.mint, blue: pal.css.blue };
    drawBuild(ctx, kind, acc, 1, 0); tex.needsUpdate = true;
  }
  window.addEventListener("palette", (e) => applyPalette(e.detail));

  if (prefersReducedMotion) { drawBuild(ctx, kind, acc, 1, 0); tex.needsUpdate = true; render(0); }
  else { const loop = (n) => { render(n); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  return true;
}
