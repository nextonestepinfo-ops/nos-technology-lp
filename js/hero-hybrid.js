// hero-hybrid.js : ヒーローの A×B ハイブリッド 3D（インタラクティブ・パネル）
// 中央のAIコア（脈動する低ポリ結晶＋ワイヤー殻＋発光ハロー＋周回パーティクル）を、
// 周回するUIパネル（店舗サイト/予約管理/AI返信/地図）が囲み、コアから各パネルへ光が流れる。
// パネルはホバーで手前にズーム＋中身がビルドアニメ、クリックで対応セクションへ慣性スクロール。
// "palette" イベントで配色に追従。失敗時は main.js 側でCSS背景にフォールバック。
import * as THREE from "three";
import { pointer, prefersReducedMotion, lerp, clamp } from "./utils.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

const hx = (s) => parseInt(s.slice(1), 16);

// パネルテクスチャ解像度（高解像度化で手描きUIの文字をくっきり）。手描きは512座標系で描き、ここでスケールする。
const TEX_W = 1024, TEX_H = 768;

// パネル面：パネルサイズ用に最適化した手描きUI（太く大きい要素・ブランド配色・ビルド/スキャン演出）。
// 512座標系で描いてテクスチャ解像度へスケール（リアル写真スクショは小サイズで白く潰れて読めないため手描きを採用）。
function drawUI(x, kind, acc, p, t = 0) {
  x.save();
  x.scale(TEX_W / 512, TEX_H / 384);
  drawUIWire(x, kind, acc, p, t);
  x.restore();
}

// パネルサイズ用に最適化した手描きUI（512×384座標系・業種非依存・太く大きく読める）。
// p(0〜1)で左→右に“描き込まれる”ビルド表現、t>0でライブ演出（スキャン光＋LIVE）。
function drawUIWire(x, kind, acc, p, t = 0) {
  x.clearRect(0, 0, 512, 384);
  // 背景：真っ白を避け淡いグラデ（白飛び防止・上質感）
  const page = x.createLinearGradient(0, 0, 0, 384);
  page.addColorStop(0, "#f6f8fb"); page.addColorStop(1, "#e8ecf3");
  x.fillStyle = page; x.fillRect(0, 0, 512, 384);
  const mint = acc.mint, blue = acc.blue, ink = "#14161a", soft = "#c2c9d3", line = "#e6e9ee", bg = "#e4e9f1";
  const pill = (px, py, pw, ph, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(px, py, pw, ph, ph / 2); x.fill(); };
  const rrect = (px, py, pw, ph, r, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.fill(); };

  // 上部バー（常時表示）：ミントの丸＋大きめタイトル
  x.fillStyle = bg; x.fillRect(0, 0, 512, 60);
  x.fillStyle = mint; x.beginPath(); x.arc(42, 30, 11, 0, 7); x.fill();
  x.fillStyle = ink; x.font = "700 22px sans-serif"; x.textBaseline = "alphabetic";
  x.fillText({ site: "WEB SITE", admin: "DASHBOARD", reply: "AI INBOX", map: "LOCAL MAP" }[kind], 66, 38);

  // 本文は左→右にワイプして“出来上がる”
  const w = Math.max(0, Math.min(1, p));
  if (w <= 0) return;
  x.save();
  x.beginPath(); x.rect(0, 60, 512 * w, 324); x.clip();

  const stroke = (px, py, pw, ph, r, col, lw = 2) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.stroke(); };
  const card = (px, py, pw, ph, r) => { x.fillStyle = "#ffffff"; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.fill(); x.strokeStyle = line; x.lineWidth = 1.5; x.stroke(); };
  if (kind === "site") {
    // 見出し2行＋サブ＋CTA(主)＋ゴースト(副)＋右の大ヒーロー画像＋下部チップ。制作中の“ローディング”が動く。
    rrect(36, 100, 300, 30, 9, ink); rrect(36, 142, 224, 30, 9, ink);
    if (t > 0 && (t % 1) < 0.5) { x.fillStyle = blue; x.fillRect(268, 142, 4, 30); } // 編集キャレット点滅（ホバー中のみ）
    rrect(36, 192, 252, 13, 6, soft); rrect(36, 214, 206, 13, 6, soft);
    pill(36, 252, 170, 52, mint);
    x.fillStyle = "#fff"; x.font = "700 21px sans-serif"; x.fillText("お問い合わせ", 58, 285);
    stroke(218, 252, 120, 52, 26, line); rrect(240, 272, 76, 12, 6, soft);
    const ga = t * 0.5;
    const g = x.createLinearGradient(356 + Math.sin(ga) * 40, 90, 476, 320 + Math.cos(ga) * 40); g.addColorStop(0, mint); g.addColorStop(1, blue);
    x.fillStyle = g; x.beginPath(); x.roundRect(356, 90, 120, 214, 16); x.fill();
    // ヒーロー画像内のローディングバー（周期で満ちる＝構築中の動き）
    const lp = t > 0 ? (t * 0.5) % 1 : 1;
    x.fillStyle = "rgba(255,255,255,.28)"; x.beginPath(); x.roundRect(372, 270, 88, 8, 4); x.fill();
    x.fillStyle = "rgba(255,255,255,.92)"; x.beginPath(); x.roundRect(372, 270, 88 * lp, 8, 4); x.fill();
    [36, 150, 264].forEach((cx0) => rrect(cx0, 332, 96, 30, 15, bg));
  } else if (kind === "admin") {
    // KPI（数値ティック）＋スパークライン（移動ドット）＋3行（ハイライト行が巡回・ステータスが処理中→確定）
    rrect(36, 80, 130, 14, 7, soft);
    stroke(36, 104, 135, 64, 12, line); stroke(184, 104, 135, 64, 12, line); stroke(332, 104, 148, 64, 12, line);
    const k1 = 1248 + Math.floor((0.5 + 0.5 * Math.sin(t * 0.8)) * 40);
    x.fillStyle = ink; x.font = "800 28px sans-serif"; x.fillText(k1.toLocaleString(), 52, 150);
    x.fillText(String(322 + Math.floor((t * 2) % 14)), 200, 150);
    x.fillStyle = mint; x.font = "700 13px sans-serif"; x.fillText("▲12%", 118, 150); x.fillText("▲8%", 250, 150);
    const sp = [[346, 150], [372, 134], [398, 142], [424, 120], [452, 128], [468, 116]];
    x.strokeStyle = mint; x.lineWidth = 3; x.beginPath(); sp.forEach((pt, i) => i ? x.lineTo(pt[0], pt[1]) : x.moveTo(pt[0], pt[1])); x.stroke();
    const dp = (t * 1.0) % (sp.length - 1), di = Math.floor(dp), fr = dp - di;
    x.fillStyle = blue; x.beginPath(); x.arc(sp[di][0] + (sp[di + 1][0] - sp[di][0]) * fr, sp[di][1] + (sp[di + 1][1] - sp[di][1]) * fr, 4.5, 0, 7); x.fill();
    const hi = Math.floor(t * 0.6) % 3;
    for (let i = 0; i < 3; i++) {
      const ry = 192 + i * 58, on = i === hi;
      if (on) { x.fillStyle = "#e9fbf4"; x.fillRect(24, ry - 6, 464, 52); }
      x.fillStyle = on ? mint : "#dde2e9"; x.beginPath(); x.arc(56, ry + 18, 16, 0, 7); x.fill();
      rrect(86, ry + 6, 150, 13, 6, soft); rrect(86, ry + 27, 200, 11, 5, "#d7dde4");
      pill(388, ry + 4, 92, 28, on ? "#cdd6e2" : blue);
      x.fillStyle = on ? "#7c8696" : "#fff"; x.font = "700 14px sans-serif"; x.fillText(on ? "処理中" : "確定", on ? 400 : 408, ry + 23);
    }
  } else if (kind === "reply") {
    // 受信＋送信(青)。送信文が“打ち込まれて”いき、AIバッジが脈動（生成中の動き）。
    rrect(36, 80, 270, 78, 18, "#e6eaf1");
    rrect(56, 100, 210, 12, 6, "#cdd4dc"); rrect(56, 122, 170, 12, 6, "#cdd4dc");
    rrect(150, 176, 326, 96, 18, blue);
    const tw = t > 0 ? (t * 0.55) % 1.6 : 1.6, lw = [284, 250, 180];
    x.fillStyle = "rgba(255,255,255,.92)";
    [196, 218, 240].forEach((yy, i) => { const pr = Math.max(0, Math.min(1, tw - i * 0.35)); if (pr > 0.02) { x.beginPath(); x.roundRect(172, yy, lw[i] * pr, 12, 6); x.fill(); } });
    const bp = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3));
    x.globalAlpha = bp; x.fillStyle = mint; x.font = "700 17px sans-serif"; x.fillText("✦ AIが文案を生成", 172, 300); x.globalAlpha = 1;
    stroke(36, 326, 388, 40, 20, line); rrect(56, 340, 160, 12, 6, soft);
    pill(436, 326, 40, 40, blue); x.fillStyle = "#fff"; x.font = "700 20px sans-serif"; x.fillText("→", 448, 352);
  } else {
    // 地図＋検索バー＋レーダー（拡大リング＋回転スイープ）＋ピン(バウンド)＋情報カード(件数ティック)
    x.fillStyle = "#e9edf3"; x.fillRect(24, 72, 464, 290);
    x.strokeStyle = line; x.lineWidth = 3;
    for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(24, 72 + i * 42); x.lineTo(488, 72 + i * 42); x.stroke(); }
    for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(24 + i * 52, 72); x.lineTo(24 + i * 52, 362); x.stroke(); }
    x.fillStyle = "rgba(63,109,240,.12)"; x.beginPath(); x.arc(216, 232, 86, 0, 7); x.fill();
    const rr = (t * 0.6) % 1;
    x.strokeStyle = `rgba(63,109,240,${0.45 * (1 - rr)})`; x.lineWidth = 2.5; x.beginPath(); x.arc(216, 232, 18 + rr * 82, 0, 7); x.stroke();
    x.save(); x.beginPath(); x.arc(216, 232, 86, 0, 7); x.clip(); x.translate(216, 232); x.rotate(t * 1.1);
    const sg = x.createLinearGradient(0, 0, 86, 0); sg.addColorStop(0, "rgba(63,109,240,.4)"); sg.addColorStop(1, "rgba(63,109,240,0)");
    x.strokeStyle = sg; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(86, 0); x.stroke(); x.restore();
    const pbo = Math.sin(t * 2.2) * 3;
    x.fillStyle = blue; x.beginPath(); x.arc(216, 222 + pbo, 20, 0, 7); x.fill();
    x.beginPath(); x.moveTo(216, 254 + pbo); x.lineTo(199, 228 + pbo); x.lineTo(233, 228 + pbo); x.closePath(); x.fill();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(216, 222 + pbo, 8, 0, 7); x.fill();
    card(40, 86, 200, 36, 18); x.fillStyle = mint; x.beginPath(); x.arc(60, 104, 7, 0, 7); x.fill(); rrect(76, 98, 120, 12, 6, soft);
    card(298, 212, 182, 104, 16);
    x.fillStyle = mint; x.font = "700 18px sans-serif"; x.fillText("★ 4.3 (" + (128 + Math.floor((t * 1.5) % 9)) + ")", 318, 246);
    rrect(318, 258, 120, 11, 5, soft); rrect(318, 274, 90, 11, 5, "#d7dde4");
    pill(318, 290, 108, 26, mint); x.fillStyle = "#fff"; x.font = "700 14px sans-serif"; x.fillText("ルート", 344, 308);
  }
  x.restore();

  // ホバー中のライブ表示（処理が動いている感：スキャン光＋LIVEドット）
  if (t > 0) {
    const sx = 24 + ((t * 0.55 * 470) % 470);
    const g = x.createLinearGradient(sx - 36, 0, sx + 36, 0);
    g.addColorStop(0, "rgba(26,92,255,0)"); g.addColorStop(.5, "rgba(26,92,255,.16)"); g.addColorStop(1, "rgba(26,92,255,0)");
    x.fillStyle = g; x.fillRect(0, 60, 512, 324);
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 8));
    x.fillStyle = `rgba(42,193,109,${blink})`; x.beginPath(); x.arc(488, 30, 6, 0, 7); x.fill();
    x.fillStyle = "rgba(20,22,26,.6)"; x.font = "700 13px sans-serif"; x.textAlign = "right"; x.fillText("LIVE", 476, 35); x.textAlign = "left";
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
  // パネル文字の鮮明化に使う異方性フィルタの最大値
  const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 8;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  cam.position.set(0, 0, 9.5);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6ee, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 1.05); dir.position.set(4, 6, 8); scene.add(dir);
  const pm = new THREE.PointLight(0x16b89a, 24, 40); pm.position.set(-5, 3, 5); scene.add(pm);
  const pb = new THREE.PointLight(0x3f6df0, 22, 40); pb.position.set(5, -3, 5); scene.add(pb);

  // 環境反射：メタル/ガラスの質感を一段引き上げる（中央の"N"の映り込み）
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const group = new THREE.Group(); group.position.x = 1.7; group.rotation.x = -0.05; scene.add(group);

  // ---- 中央のAIコア ----
  const coreWrap = new THREE.Group(); group.add(coreWrap);
  const coreGeo = new THREE.IcosahedronGeometry(1.05, 2);
  const coreBase = coreGeo.attributes.position.array.slice(0);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .16, metalness: .4, flatShading: true, emissive: 0x0e9ab1, emissiveIntensity: .2 });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat); coreWrap.add(coreMesh);
  coreMesh.visible = false; // モーフ球は隠し“N”を主役化（描画プラミングは壊さず非表示で保持）

  // ---- NOSの“N”：ロゴのパスをそのまま3D押し出し（縦2本＋上下が水平な対角）。三角アクセントは無し ----
  // ダークなメタル質感＋環境反射でリファレンス画像のような艶のある立体に。
  // ホワイトシルバーのクローム（実ロゴの質感に寄せ、暗背景でアクセントになる艶）
  const nMat = new THREE.MeshPhysicalMaterial({ color: 0xeef2f8, metalness: 1.0, roughness: .15, clearcoat: 1.0, clearcoatRoughness: .1, emissive: 0x1a3366, emissiveIntensity: .05, envMapIntensity: 1.9, reflectivity: 1.0 });
  const nEdgeMat = new THREE.LineBasicMaterial({ color: 0x16b89a, transparent: true, opacity: .3 });
  const NS = 0.04;               // ロゴ座標(0-100)→three換算
  const ND = 0.56;               // 押し出し奥行き
  const Lp = (x, y) => [(x - 50) * NS, (50 - y) * NS]; // y反転＋中心化
  const mkShape = (pts) => { const s = new THREE.Shape(); pts.forEach((p, i) => { const c = Lp(p[0], p[1]); i ? s.lineTo(c[0], c[1]) : s.moveTo(c[0], c[1]); }); s.closePath(); return s; };
  const extr = (sh) => { const g = new THREE.ExtrudeGeometry(sh, { depth: ND, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 2 }); g.translate(0, 0, -ND / 2); return g; };
  // ロゴのパス：左縦バー / 右縦バー / 対角（上下が水平な平行四辺形）
  const nShapes = [
    mkShape([[18, 20], [34, 20], [34, 80], [18, 80]]),
    mkShape([[68, 20], [82, 20], [82, 80], [68, 80]]),
    mkShape([[32, 20], [48, 20], [68, 80], [52, 80]]),
  ];
  const nGroup = new THREE.Group();
  nShapes.forEach((sh) => {
    const geo = extr(sh);
    nGroup.add(new THREE.Mesh(geo, nMat));
    nGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), nEdgeMat)); // 主要稜線だけ薄く
  });
  nGroup.scale.setScalar(0.82); // 少し大きめ
  group.add(nGroup);
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
  coreMesh.userData = { en: "NOS TECHNOLOGY", jp: "AI活用のオリジナルを、お手軽価格から。", note: "Original × Affordable" };
  const coreProxy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
  coreWrap.add(coreProxy);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x1a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 72), ringMat);
  scene.add(ring);

  // フォーカス時に手前パネルだけを残して背後を暗転させる“スポットライト”用の暗幕。
  // 手前にズームしたパネル(world z≈1.5〜2.3)より奥(z=1.1)に置き、コア/他パネル/結線を覆って沈める。
  const dimMat = new THREE.MeshBasicMaterial({ color: 0x04060c, transparent: true, opacity: 0, depthWrite: false });
  const dimPlane = new THREE.Mesh(new THREE.PlaneGeometry(48, 30), dimMat);
  dimPlane.position.z = 1.1; scene.add(dimPlane);

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
    { kind:"site",  w:2.5, h:1.85, pos:[2.9, 1.0, 0.3],  rot:[-.1, -.5, .03],  en:"Web Design",    jp:"店舗サイト制作",   note:"Design · SEO · Forms",   chips:["ランディング設計","Googleマップ","問い合わせ導線"], target:"#works" },
    { kind:"admin", w:2.2, h:1.6,  pos:[-3.0, 1.3, -0.5], rot:[-.05, .42, -.04], en:"Admin System",  jp:"予約・顧客管理",   note:"Bookings · CRM",         chips:["予約管理","顧客管理","スタッフ管理"],     target:"#services" },
    { kind:"reply", w:2.1, h:1.55, pos:[2.7, -1.5, -0.2], rot:[.05, -.55, .02],  en:"AI Automation", jp:"AI業務自動化",     note:"Replies in seconds",     chips:["自動文案","24時間対応","見込み客管理"],   target:"#services" },
    { kind:"map",   w:1.95, h:1.45, pos:[-2.7, -1.2, 0.4], rot:[-.08, .5, .03],   en:"Growth",        jp:"集客・SNS導線",   note:"Local SEO · MEO",        chips:["MEO対策","SNS導線","口コミ獲得"],         target:"#services" },
  ];
  let currentAcc = { mint: "#16b89a", blue: "#3f6df0" };

  const panels = defs.map((d, idx) => {
    const geo = panelGeo(d.w, d.h);
    // パネルごとに専用キャンバス＋テクスチャ（ビルドアニメで描き替える）
    const cv = document.createElement("canvas"); cv.width = TEX_W; cv.height = TEX_H;
    const ctx = cv.getContext("2d");
    drawUI(ctx, d.kind, currentAcc, 1);
    // 文字をくっきり：高解像度テクスチャ＋異方性フィルタ最大＋ミップ無し線形（NPOTでもボケない）
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = maxAniso; tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    // 面は“発光する画面”として描く：emissiveMapで自発光させ暗い空間でも色が出る。強すぎると白がにじむので控えめに。
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .78, roughness: .66, metalness: 0, transparent: true, toneMapped: false });
    const side = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .22, metalness: .12, transparent: true });
    const mesh = new THREE.Mesh(geo, [face, side]);
    mesh.position.set(...d.pos); mesh.rotation.set(...d.rot);
    mesh.userData = {
      kind: d.kind, en: d.en, jp: d.jp, note: d.note, chips: d.chips, idx: String(idx + 1).padStart(2, "0"), target: d.target,
      home: new THREE.Vector3(...d.pos), baseRot: new THREE.Euler(...d.rot),
      ph: Math.random() * 6, ctx, tex,
      h: 0, progress: 1, wasHover: false, click: 0,
    };
    group.add(mesh); return mesh;
  });
  const redraw = (panel, p, t = 0) => { drawUI(panel.userData.ctx, panel.userData.kind, currentAcc, p, t); panel.userData.tex.needsUpdate = true; };

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
  const heroEl = canvas.closest(".hero");
  let baseScale = 0.82; // resizeで設定。renderでスクロール視差を掛ける。
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
    const small = r.width < 860;
    if (layout === "center") {
      group.position.x = 0;
      baseScale = small ? 0.6 : 1.0;
    } else {
      group.position.x = small ? 0 : 1.7;
      baseScale = small ? 0.55 : 0.82;
    }
    group.scale.setScalar(baseScale);
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
  const tagNote = tagEl ? tagEl.querySelector(".note") : null;
  const tagIdx = tagEl ? tagEl.querySelector(".hero-tag__idx") : null;
  const tagThumb = tagEl ? tagEl.querySelector(".hero-tag__thumb") : null;
  const chipLis = tagEl ? [...tagEl.querySelectorAll(".hero-tag__chips li")] : [];
  let lastTagKind = "";
  const projV = new THREE.Vector3();
  let tagX = 0, tagY = 0, tagInit = false;
  function updateTag(panel) {
    if (!tagEl) return;
    if (!panel) { tagEl.classList.remove("is-show"); tagInit = false; lastTagKind = ""; return; }
    const u = panel.userData;
    const isPanel = !!u.kind;
    if (tagEn && tagEn.textContent !== u.en) tagEn.textContent = u.en;
    if (tagJp && tagJp.textContent !== u.jp) tagJp.textContent = u.jp;
    if (tagNote && tagNote.textContent !== (u.note || "")) tagNote.textContent = u.note || "";
    if (tagIdx) tagIdx.textContent = u.idx || "";
    // パネルが変わった時だけ中身を差し替え、再ステージのため演出クラスを付け直す
    const key = u.kind || "core";
    if (key !== lastTagKind) {
      lastTagKind = key;
      if (tagThumb) {
        if (isPanel) { tagThumb.src = `assets/panels/panel-${u.kind}.png`; tagThumb.style.display = ""; }
        else tagThumb.style.display = "none";
      }
      const arr = u.chips || [];
      chipLis.forEach((li, i) => { li.textContent = arr[i] || ""; li.style.display = arr[i] ? "" : "none"; });
      tagEl.classList.toggle("is-core", !isPanel);
      // 一旦リセットして次フレームで再生（時間差リビールを毎回頭から）
      tagEl.classList.remove("is-show"); void tagEl.offsetWidth; tagEl.classList.add("is-staged");
    }
    panel.getWorldPosition(projV); projV.project(cam);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const tx = (projV.x * 0.5 + 0.5) * cw, ty = (-projV.y * 0.5 + 0.5) * ch;
    // 切替時はスナップ、追従はスムージング（ジッター防止）
    if (!tagInit) { tagX = tx; tagY = ty; tagInit = true; }
    else { tagX += (tx - tagX) * 0.25; tagY += (ty - tagY) * 0.25; }
    // 上に十分な余白が無ければカードを下に出す（上で見切れるのを防ぐ）＋左右を画面内にクランプ
    const cardW = tagEl.offsetWidth || 240, cardH = tagEl.offsetHeight || 210;
    tagEl.classList.toggle("is-below", tagY < cardH + 56);
    const clampedX = Math.max(cardW / 2 + 14, Math.min(cw - cardW / 2 - 14, tagX));
    tagEl.style.left = clampedX + "px";
    tagEl.style.top = tagY + "px";
    tagEl.classList.add("is-show");
  }

  // クリックで対応セクションへ移動（その都度 pick して堅牢に）
  canvas.style.pointerEvents = "auto";
  canvas.addEventListener("click", () => {
    const obj = pick();
    if (!obj || !obj.userData.target) return;
    const target = document.querySelector(obj.userData.target);
    if (!target) return;
    obj.userData.click = 1; // クリック演出（前へ飛び出す）
    // 遷移演出：画面を一瞬ワイプ → 少し遅れてスクロール（ただ飛ぶだけにしない）
    document.body.classList.add("is-warp");
    setTimeout(() => document.body.classList.remove("is-warp"), 720);
    setTimeout(() => {
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: "smooth" });
    }, 230);
  });

  let rx = 0, ry = 0;
  let focusState = false; // is-focusing クラスの現在状態（毎フレームのトグル抑制用）
  const cAttr = coreGeo.attributes.position;
  let hovered = null;

  function render(now) {
    const t = (now || 0) / 1000;
    // フォーカス量（いずれかのパネルにホバー中＝1へ）。全体の動きを鎮める。
    const focus = panels.reduce((mx, p) => Math.max(mx, p.userData.h), 0);
    // 背景暗転：手前パネル以外を暗幕で沈める＋DOM背景(bg-flow等)もCSSで減光
    dimMat.opacity = Math.min(1, focus) * 0.66;
    if (focusState !== focus > 0.35) { focusState = focus > 0.35; document.body.classList.toggle("is-focusing", focusState); }
    const calm = 1 - Math.max(focus, coreHover * 0.55) * 0.9;
    rx = lerp(rx, pointer.nx * 0.5 * calm, 0.06);
    ry = lerp(ry, pointer.ny * 0.4 * calm, 0.06);
    group.rotation.y = Math.sin(t * 0.14) * 0.16 * calm + rx;
    group.rotation.x = -0.05 - ry;
    // スクロール視差：下へ行くほどオブジェクトが少し上へドリフト＋わずかに縮小（層の奥行き）
    const sp = Math.min(1, Math.max(0, (window.scrollY || 0) / ((heroEl && heroEl.offsetHeight) || window.innerHeight || 1)));
    group.position.y = sp * 2.6;
    group.rotation.z = sp * 0.12;
    group.scale.setScalar(baseScale * (1 - sp * 0.24));

    if (!prefersReducedMotion && coreMesh.visible) {
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
    // 中央“N”：基本は正面向き（ロゴの見え方）。ごく緩いゆらぎ＋ポインタ追従。
    // ホバー時だけ spinExtra でぐるりと回し、前進＋拡大の“ガッと大アップ”に。
    nGroup.rotation.y = Math.sin(t * 0.28) * 0.3 + pointer.nx * 0.28;
    nGroup.rotation.x = Math.sin(t * 0.5) * 0.05 - pointer.ny * 0.18;
    nGroup.position.set(0, Math.sin(t * 1.0) * 0.05, coreHover * 1.3);
    nGroup.scale.setScalar(0.82 * (1 + coreHover * 0.7) * (1 + Math.sin(t * 1.6) * 0.012));
    nMat.emissiveIntensity = 0.05 + coreHover * 0.3;
    nEdgeMat.opacity = 0.32 + coreHover * 0.4 + Math.sin(t * 2) * 0.06;
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
      // 他パネルはフォーカス時に外側へ広がる（動きを増やす）
      m.position.set(u.home.x * (1 - u.h * 0.45) * (1 + otherR * 0.22), (u.home.y + floatY) * (1 - u.h * 0.35) * (1 + otherR * 0.12), u.home.z + zBoost);
      m.scale.setScalar((1 + u.h * 0.62 + u.click * 0.28) * (1 - otherR * 0.08));
      m.rotation.x = u.baseRot.x * (1 - u.h);
      m.rotation.y = u.baseRot.y * (1 - u.h);
      m.rotation.z = u.baseRot.z * (1 - u.h) + Math.sin(t * 0.3 + i) * 0.02 * (1 - u.h);
      // フォーカス中のパネルはポインタに追従して傾く（“手に取って見ている”インタラクティブな動き）
      if (u.h > 0.01) { m.rotation.y += pointer.nx * 0.2 * u.h; m.rotation.x += -pointer.ny * 0.16 * u.h; }
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
    nEdgeMat.color.setHex(M); // 中央“N”の稜線を配色追従（薄い縁）
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
