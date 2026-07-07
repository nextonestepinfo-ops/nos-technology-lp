// service-hero.js : 各サービスページのヒーローに置く“制作ムービー風”シネマティック3Dシーン
// 中央の3Dパネル上で、サイト/AI/管理画面が「自動で組み上がっていく」ビルドアニメを繰り返し再生。
// カメラのゆるいドリー＋ポインター視差＋発光。配色は "palette" イベントで追従。
import * as THREE from "three";
import { pointer, prefersReducedMotion, lerp } from "./utils.js";

const hx = (s) => parseInt(s.slice(1), 16);

// パネル内の“制作中”UIを描く。p(0〜1)で左から組み上がり、tでライブ演出（スキャン光/カーソル点滅）。
// 各ページの内容に合わせた実プロダクト精度：
//   web    = 喫茶店の完成ページ（明るいテーマ）
//   system = 業務改善ツールのダッシュボード（売上・予約・時間帯）
//   ai     = システム開発のビルドコンソール（コード＋リリースパイプライン）
const JP = '"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",sans-serif';
const EN = '"Space Grotesk",sans-serif';

function drawBuild(x, kind, acc, p, t) {
  const W = 1024, H = 640;
  const mint = acc.mint, blue = acc.blue;
  const dark = kind !== "web";
  x.clearRect(0, 0, W, H);

  const bar = (xx, yy, ww, hh, col, r = 8) => { x.fillStyle = col; x.beginPath(); x.roundRect(xx, yy, ww, hh, r); x.fill(); };
  const stroke = (xx, yy, ww, hh, r, col, lw = 2) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.roundRect(xx, yy, ww, hh, r); x.stroke(); };
  const txt = (s, xx, yy, size, col, weight = 500, font = JP) => { x.fillStyle = col; x.font = `${weight} ${size}px ${font}`; x.fillText(s, xx, yy); };

  // 本体の背景
  if (dark) {
    const bgGrad = x.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#101a2e"); bgGrad.addColorStop(1, "#0a101f");
    x.fillStyle = bgGrad; x.fillRect(0, 0, W, H);
  } else {
    x.fillStyle = "#f8f5f0"; x.fillRect(0, 0, W, H);
  }

  // ブラウザ・クローム（常時）
  x.fillStyle = dark ? "#121a2e" : "#eef1f4"; x.fillRect(0, 0, W, 64);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(34 + i * 26, 32, 8, 0, 7); x.fill(); });
  bar(150, 16, 720, 32, dark ? "#0a1120" : "#ffffff", 16);
  txt({ web: "https://kissa-nos.jp", ai: "dev.nos-technology.jp — build console", system: "admin.your-shop.jp / 業務改善ツール" }[kind], 174, 38, 18, dark ? "#8fa0c0" : "#9aa3ad", 500, EN);

  const w = Math.max(0, Math.min(1, p));
  x.save(); x.beginPath(); x.rect(0, 64, W * w, H - 64); x.clip();

  const ink = dark ? "#eaf0fc" : "#241d15";
  const sub = dark ? "#8fa0c0" : "#8a7f70";
  const line = dark ? "#26324e" : "#e4ddd2";
  const surf = dark ? "#182240" : "#ffffff";
  const card = (xx, yy, ww, hh, r = 14) => { bar(xx, yy, ww, hh, surf, r); stroke(xx, yy, ww, hh, r, line, 1.5); };

  if (kind === "web") {
    // ===== 喫茶店の完成ページ =====
    txt("Kissa Nos", 70, 122, 27, ink, 800, EN);
    txt("メニュー", 320, 118, 17, sub); txt("こだわり", 420, 118, 17, sub); txt("アクセス", 520, 118, 17, sub);
    bar(830, 92, 124, 42, "#241d15", 21); txt("ご予約", 862, 120, 18, "#fff", 700);
    // 見出し＋キャレット
    txt("今日の一杯を、", 70, 250, 58, ink, 800);
    txt("丁寧に。", 70, 330, 58, ink, 800);
    if (Math.sin(t * 5) > 0) { x.fillStyle = blue; x.fillRect(318, 288, 5, 48); }
    txt("駅から歩いて3分。自家焙煎の小さな喫茶店です。", 70, 388, 21, sub);
    // CTA
    bar(70, 428, 200, 58, mint, 29); txt("ご予約する", 112, 465, 22, "#fff", 700);
    stroke(288, 428, 210, 58, 29, "#d8d0c4", 2); txt("メニューを見る", 322, 464, 19, sub, 600);
    // 写真：湯気の立つコーヒー
    const ph = x.createLinearGradient(620, 100, 960, 560);
    ph.addColorStop(0, "#c8a273"); ph.addColorStop(.55, "#8a5f3c"); ph.addColorStop(1, "#4c3320");
    x.fillStyle = ph; x.beginPath(); x.roundRect(620, 100, 340, 460, 20); x.fill();
    x.fillStyle = "rgba(255,248,238,.95)";
    x.beginPath(); x.ellipse(790, 420, 105, 30, 0, 0, 7); x.fill();
    x.beginPath(); x.roundRect(722, 310, 136, 100, [12, 12, 48, 48]); x.fill();
    x.strokeStyle = "rgba(255,248,238,.95)"; x.lineWidth = 15; x.beginPath(); x.arc(872, 348, 26, -1.2, 1.3); x.stroke();
    x.fillStyle = "#5a3d28"; x.beginPath(); x.ellipse(790, 314, 58, 15, 0, 0, 7); x.fill();
    x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 6; x.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const sx0 = 764 + i * 44, ph2 = t * 1.4 + i * 2;
      x.beginPath(); x.moveTo(sx0, 282);
      x.quadraticCurveTo(sx0 + Math.sin(ph2) * 14, 240, sx0 + Math.sin(ph2 + 1) * 10, 200);
      x.stroke();
    }
    // 店舗情報行
    txt("★ 4.8", 70, 566, 24, "#b9882e", 800, EN);
    txt("口コミ 214件", 168, 564, 18, sub);
    txt("水曜定休", 320, 564, 18, sub);
    txt("8:00 – 18:00", 440, 565, 19, sub, 600, EN);
  } else if (kind === "system") {
    // ===== 業務改善ツールのダッシュボード =====
    txt("今日の売上", 64, 122, 24, ink, 800);
    // ライブバッジ
    bar(220, 96, 190, 38, "rgba(54,197,255,.11)", 19);
    stroke(220, 96, 190, 38, 19, "rgba(54,197,255,.4)", 1.5);
    x.fillStyle = mint; x.beginPath(); x.arc(244, 115, 6, 0, 7); x.fill();
    txt("レジと自動連携", 260, 122, 16, mint, 700);
    txt("7/7（月） 18:04 更新", 780, 120, 16, sub, 500, EN);
    // KPI 3枚
    const kpi = [["売上", "¥68,500", "+8.2%", false], ["客数", "42", "+5", false], ["客単価", "¥1,630", "-1.1%", true]];
    kpi.forEach((k, i) => {
      const kx = 64 + i * 208;
      card(kx, 150, 192, 96, 14);
      txt(k[0], kx + 18, 182, 15, sub);
      txt(k[1], kx + 18, 226, 30, ink, 800, EN);
      txt(k[2], kx + 122, 182, 15, k[3] ? "#ff9a7a" : mint, 700, EN);
    });
    // 予約リスト（ハイライト巡回）
    const rows = [["10:00", "佐藤 美咲 様", "カット＋カラー", "確定", false], ["11:30", "田中 蓮 様", "メンズカット", "来店中", true], ["14:00", "山本 結衣 様", "縮毛矯正", "確定", false]];
    const hi = Math.floor(t * 0.6) % 3;
    rows.forEach((r, i) => {
      const ry = 280 + i * 78;
      card(64, ry, 560, 66, 12);
      if (i === hi) { x.fillStyle = "rgba(54,197,255,.07)"; x.beginPath(); x.roundRect(64, ry, 560, 66, 12); x.fill(); }
      txt(r[0], 86, ry + 42, 20, sub, 700, EN);
      txt(r[1], 172, ry + 30, 19, ink, 700);
      txt(r[2], 172, ry + 54, 15, sub);
      const on = r[4];
      bar(500, ry + 16, 100, 34, on ? mint : "rgba(61,139,255,.15)", 17);
      if (!on) stroke(500, ry + 16, 100, 34, 17, "rgba(61,139,255,.5)", 1.5);
      txt(r[3], on ? 522 : 526, ry + 39, 16, on ? "#06331f" : "#7fa7ee", 700);
    });
    // 時間帯別バー
    card(660, 280, 300, 232, 14);
    txt("時間帯別", 682, 312, 15, sub);
    const hs = [22, 34, 58, 88, 72, 40, 46, 64, 96, 70];
    hs.forEach((v, i) => {
      const bx = 684 + i * 26, bh = (v / 100) * 140;
      const bg2 = x.createLinearGradient(0, 480 - bh, 0, 480);
      bg2.addColorStop(0, mint); bg2.addColorStop(1, "rgba(61,139,255,.35)");
      x.fillStyle = bg2; x.beginPath(); x.roundRect(bx, 480 - bh, 18, bh, 4); x.fill();
    });
    txt("10時", 684, 502, 13, sub, 500, EN); txt("20時", 908, 502, 13, sub, 500, EN);
    // 下部ステータス
    bar(64, 542, 380, 40, "rgba(42,193,109,.1)", 20);
    txt("✓ 給与・勤怠に自動反映済み", 86, 568, 17, "#4adf9c", 700);
  } else {
    // ===== システム開発のビルドコンソール =====
    // 左：コードエディタ
    card(60, 96, 520, 466, 16);
    bar(60, 96, 520, 44, dark ? "#121a2e" : "#eee", 16);
    txt("app.ts", 92, 124, 16, ink, 700, EN);
    txt("api.ts", 170, 124, 16, sub, 500, EN);
    txt("schema.sql", 240, 124, 16, sub, 500, EN);
    // コード行（トークン風の色つきバー）
    const tokens = [
      [[0, 60, "#7f8ea0"], [70, 120, blue], [200, 90, mint]],
      [[20, 90, mint], [120, 150, "#9a8cff"], [280, 70, "#7f8ea0"]],
      [[20, 140, blue], [170, 60, "#7f8ea0"], [240, 120, mint]],
      [[40, 110, "#9a8cff"], [160, 190, "#7f8ea0"]],
      [[40, 80, mint], [130, 120, blue]],
      [[0, 50, "#7f8ea0"]],
      [[20, 130, blue], [160, 100, mint], [270, 130, "#9a8cff"]],
      [[40, 170, "#7f8ea0"], [220, 90, blue]],
      [[40, 100, mint], [150, 140, "#7f8ea0"]],
      [[20, 60, "#9a8cff"], [90, 180, blue]],
      [[0, 40, "#7f8ea0"]],
    ];
    const typed = Math.floor((t * 2.2) % (tokens.length + 4));
    tokens.forEach((ln, i) => {
      const ly = 172 + i * 34;
      txt(String(i + 1).padStart(2, "0"), 84, ly + 12, 14, "#3c4d72", 500, EN);
      if (i > typed) return; // まだ打たれていない行
      ln.forEach(([ox, ww, col]) => {
        x.globalAlpha = 0.85; bar(126 + ox, ly, ww, 14, col, 6); x.globalAlpha = 1;
      });
    });
    // タイピングカーソル
    if (typed < tokens.length && Math.sin(t * 7) > 0) {
      const ln = tokens[Math.min(typed, tokens.length - 1)];
      const endx = 126 + ln[ln.length - 1][0] + ln[ln.length - 1][1] + 8;
      x.fillStyle = mint; x.fillRect(endx, 172 + Math.min(typed, tokens.length - 1) * 34, 3, 16);
    }
    // 右：リリース・パイプライン
    card(610, 96, 354, 466, 16);
    txt("Release Pipeline", 636, 138, 20, ink, 700, EN);
    const stages = [["サンプル確認", "done"], ["POC・実地検証", "done"], ["本開発", "run"], ["納品・保守", "wait"]];
    const prog = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.35 + 0.55; // 55〜90%を往復
    stages.forEach((st, i) => {
      const sy = 172 + i * 92;
      // 接続線
      if (i < stages.length - 1) { x.strokeStyle = line; x.lineWidth = 2; x.beginPath(); x.moveTo(652, sy + 34); x.lineTo(652, sy + 70); x.stroke(); }
      // ステータス丸
      const state = st[1];
      x.beginPath(); x.arc(652, sy + 14, 13, 0, 7);
      if (state === "done") { x.fillStyle = mint; x.fill(); x.strokeStyle = "#06331f"; x.lineWidth = 3; x.beginPath(); x.moveTo(646, sy + 14); x.lineTo(651, sy + 19); x.lineTo(659, sy + 8); x.stroke(); }
      else if (state === "run") { x.strokeStyle = mint; x.lineWidth = 3; x.stroke(); x.fillStyle = mint; x.beginPath(); x.arc(652, sy + 14, 5 + Math.sin(t * 4) * 1.5, 0, 7); x.fill(); }
      else { x.strokeStyle = "#3c4d72"; x.lineWidth = 2.5; x.stroke(); }
      txt(st[0], 684, sy + 21, 19, state === "wait" ? sub : ink, 700);
      if (state === "run") {
        // 本開発の進捗バー
        bar(684, sy + 36, 240, 10, "#1c2842", 5);
        const pw = 240 * prog;
        const pg2 = x.createLinearGradient(684, 0, 684 + pw, 0);
        pg2.addColorStop(0, mint); pg2.addColorStop(1, blue);
        x.fillStyle = pg2; x.beginPath(); x.roundRect(684, sy + 36, pw, 10, 5); x.fill();
        txt(Math.round(prog * 100) + "%", 934, sy + 46, 15, mint, 700, EN);
      }
    });
    // ログ
    bar(636, 528, 302, 2, line, 1);
    txt("✓ tests 42 passed", 636, 552, 15, "#4adf9c", 600, EN);
    const blink = Math.sin(t * 6) > 0 ? "▶ deploy preview…" : "▶ deploy preview";
    txt(blink, 800, 552, 15, sub, 600, EN);
  }
  x.restore();

  // ライブ演出：スキャン光
  const sx = ((t * 0.4 * W) % W);
  const g = x.createLinearGradient(sx - 60, 0, sx + 60, 0);
  g.addColorStop(0, "rgba(60,139,255,0)"); g.addColorStop(.5, dark ? "rgba(60,139,255,.13)" : "rgba(60,139,255,.08)"); g.addColorStop(1, "rgba(60,139,255,0)");
  x.fillStyle = g; x.fillRect(0, 64, W, H - 64);
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
  // ExtrudeGeometryのUVは形状座標のままで0-1に収まらず、テクスチャが面の一部にしか
  // 乗らない（内容が隅に小さく表示されるバグの原因）。XYバウンディングで0-1へ正規化する。
  geo.computeBoundingBox();
  {
    const bb = geo.boundingBox, sx = 1 / (bb.max.x - bb.min.x), sy = 1 / (bb.max.y - bb.min.y);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) * sx, (pos.getY(i) - bb.min.y) * sy);
    uv.needsUpdate = true;
  }
  // ダーク画面（system/ai）は“発光する画面”として描く。ライティングで沈まない。
  const isDarkKind = kind !== "web";
  const face = isDarkKind
    ? new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .8, roughness: .6, metalness: 0, toneMapped: false })
    : new THREE.MeshStandardMaterial({ map: tex, roughness: .35, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ color: isDarkKind ? 0x2a3450 : 0xffffff, roughness: .25, metalness: .1 });
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
    // スマホ：上=パネル（フル輝度でフレームイン）/ 下=コピー の2ゾーン構成
    group.position.x = small ? 0 : 1.6;
    group.position.y = small ? 1.55 : 0;
    baseScale = small ? 0.52 : 1;
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
