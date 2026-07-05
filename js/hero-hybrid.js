// hero-hybrid.js : ヒーローの A×B ハイブリッド 3D（インタラクティブ・パネル）
// 中央のAIコア（脈動する低ポリ結晶＋ワイヤー殻＋発光ハロー＋周回パーティクル）を、
// 周回するUIパネル（店舗サイト/予約管理/AI返信/地図）が囲み、コアから各パネルへ光が流れる。
// パネルはホバーで手前にズーム＋中身がビルドアニメ、クリックで対応セクションへ慣性スクロール。
// "palette" イベントで配色に追従。失敗時は main.js 側でCSS背景にフォールバック。
import * as THREE from "three";
import { pointer, prefersReducedMotion, isCoarsePointer, lerp, clamp } from "./utils.js";
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

// パネルサイズ用に最適化した手描きUI（512×384座標系）。
// “実在するプロダクトの画面”に見える精度で描く＝安心感の核。
// 実データ風の文言（名前・時刻・件数・文章）と本物の情報階層で構成する。
// p(0〜1)で左→右に“描き込まれる”ビルド表現、t>0でライブ演出（スキャン光＋LIVE）。
const JP = '"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",sans-serif';
const EN = '"Space Grotesk",sans-serif';

function drawUIWire(x, kind, acc, p, t = 0) {
  x.clearRect(0, 0, 512, 384);
  const page = x.createLinearGradient(0, 0, 0, 384);
  page.addColorStop(0, "#101a2e"); page.addColorStop(1, "#0a101f");
  x.fillStyle = page; x.fillRect(0, 0, 512, 384);
  const mint = acc.mint, blue = acc.blue, ink = "#eaf0fc", sub = "#8fa0c0", soft = "#3c4d72", line = "#26324e", bg = "#151f38", surf = "#182240";
  const pill = (px, py, pw, ph, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(px, py, pw, ph, ph / 2); x.fill(); };
  const rrect = (px, py, pw, ph, r, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.fill(); };
  const stroke = (px, py, pw, ph, r, col, lw = 2) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.stroke(); };
  const card = (px, py, pw, ph, r) => { rrect(px, py, pw, ph, r, surf); x.strokeStyle = line; x.lineWidth = 1.5; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.stroke(); };
  const txt = (s, px, py, size, col, weight = 500, font = JP) => { x.fillStyle = col; x.font = `${weight} ${size}px ${font}`; x.fillText(s, px, py); };

  // 上部バー（常時表示）：種別アイコン＋日本語タイトルで“何の画面か”を一目で
  x.fillStyle = bg; x.fillRect(0, 0, 512, 64);
  x.strokeStyle = "rgba(255,255,255,.05)"; x.lineWidth = 2; x.strokeRect(1, 1, 510, 382);
  x.save(); x.translate(42, 33); x.strokeStyle = mint; x.fillStyle = mint; x.lineWidth = 3; x.lineJoin = "round";
  if (kind === "site") { x.strokeRect(-13, -12, 26, 24); x.fillRect(-13, -12, 26, 7); }
  else if (kind === "admin") { for (let i = 0; i < 3; i++) x.fillRect(-13, -11 + i * 9, 26, 4); }
  else if (kind === "reply") { x.beginPath(); x.roundRect(-13, -12, 26, 18, 6); x.stroke(); x.beginPath(); x.moveTo(-5, 6); x.lineTo(3, 6); x.lineTo(-7, 13); x.closePath(); x.fill(); }
  else { x.beginPath(); x.arc(0, -3, 9, Math.PI, 0); x.lineTo(0, 13); x.closePath(); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, -3, 3.4, 0, 7); x.fill(); }
  x.restore();
  txt({ site: "店舗サイト", admin: "予約・顧客管理", reply: "AI返信アシスト", map: "集客マップ" }[kind], 66, 42, 25, ink, 800);

  // 本文は左→右にワイプして“出来上がる”
  const w = Math.max(0, Math.min(1, p));
  if (w <= 0) return;
  x.save();
  x.beginPath(); x.rect(0, 60, 512 * w, 324); x.clip();

  if (kind === "site") {
    // ===== 店舗の完成サイト（明るいページ＝ひと目で「Webサイト」と分かる） =====
    const cream = "#f8f5f0", inkD = "#231d16", subD = "#8a7f70";
    rrect(24, 72, 464, 292, 12, cream);
    // ページ内ナビ：店名ロゴ＋メニュー＋予約ピル
    txt("Kissa Nos", 44, 104, 19, inkD, 800, EN);
    txt("メニュー", 210, 102, 12, subD, 600);
    txt("こだわり", 272, 102, 12, subD, 600);
    txt("アクセス", 334, 102, 12, subD, 600);
    pill(398, 84, 74, 28, inkD); txt("ご予約", 418, 103, 12, "#fff", 700);
    // 見出し（実文言）＋編集キャレット
    txt("今日の一杯を、", 44, 156, 30, inkD, 800);
    txt("丁寧に。", 44, 196, 30, inkD, 800);
    if (t > 0 && (t % 1) < 0.5) { x.fillStyle = blue; x.fillRect(172, 172, 3.5, 28); }
    txt("駅から歩いて3分。自家焙煎の", 44, 226, 12.5, subD);
    txt("小さな喫茶店です。", 44, 246, 12.5, subD);
    // CTA
    pill(44, 268, 132, 40, mint); txt("ご予約する", 70, 294, 15, "#fff", 700);
    stroke(188, 268, 122, 40, 20, "#d9d2c7", 2); txt("メニューを見る", 205, 293, 12, subD, 600);
    // 右：写真ブロック（珈琲カップ＋湯気を描いて“写真”に見せる）
    const ph_ = x.createLinearGradient(330, 90, 470, 300);
    ph_.addColorStop(0, "#c8a273"); ph_.addColorStop(.55, "#8a5f3c"); ph_.addColorStop(1, "#4c3320");
    x.fillStyle = ph_; x.beginPath(); x.roundRect(330, 88, 142, 218, 12); x.fill();
    // ソーサー＋カップ
    x.fillStyle = "rgba(255,248,238,.95)"; x.beginPath(); x.ellipse(401, 240, 46, 13, 0, 0, 7); x.fill();
    x.beginPath(); x.roundRect(371, 190, 60, 46, [6, 6, 22, 22]); x.fill();
    x.strokeStyle = "rgba(255,248,238,.95)"; x.lineWidth = 7; x.beginPath(); x.arc(437, 208, 12, -1.2, 1.3); x.stroke();
    x.fillStyle = "#5a3d28"; x.beginPath(); x.ellipse(401, 192, 26, 7, 0, 0, 7); x.fill();
    // 湯気（tでゆらぐ）
    x.strokeStyle = "rgba(255,255,255,.65)"; x.lineWidth = 3; x.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const sx0 = 392 + i * 18, ph2 = t * 1.4 + i * 2;
      x.beginPath(); x.moveTo(sx0, 178);
      x.quadraticCurveTo(sx0 + Math.sin(ph2) * 7, 158, sx0 + Math.sin(ph2 + 1) * 5, 140);
      x.stroke();
    }
    // 下部の店舗情報行（信頼感：営業時間・駅徒歩・星）
    txt("★ 4.8", 44, 342, 14, "#b98a2e", 800, EN);
    txt("口コミ 214件", 96, 341, 11, subD);
    txt("水曜定休", 188, 341, 11, subD);
    txt("8:00 – 18:00", 260, 341, 11.5, subD, 600, EN);
  } else if (kind === "admin") {
    // ===== 予約・顧客管理ダッシュボード（今日の予約が動いている） =====
    txt("7/4（土）", 36, 92, 14, sub, 700);
    txt("本日の予約", 110, 92, 13, sub);
    // KPI 3枚（実数値＋前月比）
    const kpi = [
      ["本日の予約", (12 + Math.floor((t * 0.8) % 3)) + " 件", "▲ 2"],
      ["今月の売上", "¥482,000", "▲ 12%"],
      ["新規のお客様", "8 名", "▲ 3"],
    ];
    kpi.forEach((k, i) => {
      const kx = 36 + i * 152;
      card(kx, 102, 140, 66, 12);
      txt(k[0], kx + 14, 124, 11, sub);
      txt(k[1], kx + 14, 152, 20, ink, 800, EN);
      txt(k[2], kx + 92, 124, 11, mint, 700, EN);
    });
    // 予約リスト（名前・メニュー・時刻・状態。ハイライト行が巡回）
    const rows = [
      ["10:00", "佐", "佐藤 美咲 様", "カット＋カラー", "確定"],
      ["11:30", "田", "田中 蓮 様", "メンズカット", "来店中"],
      ["14:00", "山", "山本 結衣 様", "縮毛矯正", "確定"],
    ];
    const hi = Math.floor(t * 0.6) % 3;
    rows.forEach((r, i) => {
      const ry = 184 + i * 60, on = t > 0 && i === hi;
      if (on) { x.fillStyle = "rgba(54,197,255,.08)"; x.beginPath(); x.roundRect(28, ry - 8, 456, 56, 10); x.fill(); }
      // 時刻
      txt(r[0], 40, ry + 24, 15, on ? ink : sub, 700, EN);
      // アバター（イニシャル円）
      x.fillStyle = on ? mint : "#2c3a58"; x.beginPath(); x.arc(112, ry + 18, 17, 0, 7); x.fill();
      txt(r[1], 105, ry + 25, 14, on ? "#08331f" : "#9fb2d4", 800);
      // 名前・メニュー
      txt(r[2], 142, ry + 14, 14.5, ink, 700);
      txt(r[3], 142, ry + 36, 11.5, sub);
      // 状態ピル
      const stw = 74, stx = 404;
      const active = r[4] === "来店中";
      pill(stx, ry + 2, stw, 28, active ? mint : "rgba(61,139,255,.16)");
      x.strokeStyle = active ? "transparent" : "rgba(61,139,255,.55)"; x.lineWidth = 1.5;
      if (!active) { x.beginPath(); x.roundRect(stx, ry + 2, stw, 28, 14); x.stroke(); }
      txt(r[4], stx + (active ? 16 : 19), ry + 22, 12.5, active ? "#08331f" : "#7fa7ee", 700);
    });
  } else if (kind === "reply") {
    // ===== AI返信：営業時間外の問い合わせに、AIが下書き→人が確認して送信 =====
    // 受信（お客様・営業時間外バッジ付き）
    txt("21:04", 36, 90, 11, sub, 600, EN);
    pill(80, 76, 92, 20, "rgba(255,138,90,.14)");
    txt("営業時間外", 92, 91, 10.5, "#ff9a7a", 700);
    rrect(36, 100, 292, 66, 16, "#1d2946");
    txt("明日の15時、2名で予約", 56, 128, 14.5, "#c9d5ee");
    txt("できますか？", 56, 152, 14.5, "#c9d5ee");
    // 送信（AI下書き→タイプされていく）。行は意味で区切る（数字や語の泣き別れ防止）
    const replyLines = ["ありがとうございます。", "明日15:00、2名様でご案内できます。", "ご来店お待ちしております。"];
    const totalLen = replyLines.join("").length;
    const shownLen = t > 0 ? Math.floor((t * 9) % (totalLen + 14)) : totalLen;
    rrect(128, 182, 348, 92, 16, blue);
    x.save(); x.beginPath(); x.roundRect(128, 182, 348, 92, 16); x.clip();
    x.fillStyle = "rgba(255,255,255,.95)"; x.font = `600 13.5px ${JP}`;
    let used = 0;
    replyLines.forEach((lineStr, li) => {
      const seg = lineStr.slice(0, Math.max(0, shownLen - used));
      used += lineStr.length;
      if (seg) x.fillText(seg, 148, 212 + li * 22);
    });
    x.restore();
    txt("21:05", 440, 292, 10.5, sub, 600, EN);
    // 安心の要：AIが下書き → 人が確認して送信
    const bp = t > 0 ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3)) : 1;
    x.globalAlpha = bp;
    pill(128, 288, 140, 26, "rgba(26,92,255,.14)");
    txt("✦ AIが下書き", 143, 306, 12, mint, 700);
    x.globalAlpha = 1;
    txt("→  人が確認して送信", 280, 306, 12, sub, 600);
    // 入力バー
    stroke(36, 330, 388, 40, 20, line, 2);
    txt("返信を編集…", 58, 355, 12, soft);
    pill(436, 330, 40, 40, blue);
    txt("→", 448, 356, 20, "#fff", 700, EN);
  } else {
    // ===== 集客マップ：街区・道路のある地図＋自店ピン＋高評価カード =====
    x.fillStyle = "#0d1526"; x.fillRect(24, 72, 464, 292);
    // 街区（少し明るいブロック）
    x.fillStyle = "#131e33";
    [[38, 86, 96, 70], [150, 86, 120, 54], [286, 86, 84, 88], [38, 172, 76, 92], [130, 258, 110, 88], [258, 210, 96, 66], [370, 250, 100, 96]]
      .forEach(([bx, by, bw, bh]) => { x.beginPath(); x.roundRect(bx, by, bw, bh, 8); x.fill(); });
    // 公園（緑地）
    x.fillStyle = "rgba(42,150,105,.2)"; x.beginPath(); x.roundRect(388, 86, 84, 70, 10); x.fill();
    // 道路（太めの明るい線＋中央線）
    x.strokeStyle = "#233150"; x.lineWidth = 14; x.lineCap = "round";
    x.beginPath(); x.moveTo(24, 240); x.quadraticCurveTo(230, 210, 488, 236); x.stroke();
    x.beginPath(); x.moveTo(140, 72); x.lineTo(226, 364); x.stroke();
    x.strokeStyle = "rgba(150,170,210,.25)"; x.lineWidth = 2; x.setLineDash([10, 10]);
    x.beginPath(); x.moveTo(24, 240); x.quadraticCurveTo(230, 210, 488, 236); x.stroke();
    x.setLineDash([]);
    // 検索バー
    card(40, 86, 216, 38, 19);
    x.strokeStyle = sub; x.lineWidth = 2.5; x.beginPath(); x.arc(62, 104, 7, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(67, 110); x.lineTo(73, 116); x.stroke();
    txt("近くの喫茶店", 84, 110, 12.5, sub, 600);
    // 到達圏＋レーダースイープ
    x.fillStyle = "rgba(61,139,255,.1)"; x.beginPath(); x.arc(208, 244, 84, 0, 7); x.fill();
    if (t > 0) {
      const rr = (t * 0.6) % 1;
      x.strokeStyle = `rgba(61,139,255,${0.45 * (1 - rr)})`; x.lineWidth = 2.5;
      x.beginPath(); x.arc(208, 244, 16 + rr * 80, 0, 7); x.stroke();
      x.save(); x.beginPath(); x.arc(208, 244, 84, 0, 7); x.clip(); x.translate(208, 244); x.rotate(t * 1.1);
      const sg = x.createLinearGradient(0, 0, 84, 0); sg.addColorStop(0, "rgba(61,139,255,.4)"); sg.addColorStop(1, "rgba(61,139,255,0)");
      x.strokeStyle = sg; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(84, 0); x.stroke(); x.restore();
    }
    // 競合の小ピン（グレー）→ 自店ピン（ブランド色・最大）で"選ばれる"構図
    [[300, 160], [120, 300]].forEach(([px2, py2]) => {
      x.fillStyle = "#3a4666"; x.beginPath(); x.arc(px2, py2, 7, 0, 7); x.fill();
      x.beginPath(); x.moveTo(px2, py2 + 13); x.lineTo(px2 - 6, py2 + 4); x.lineTo(px2 + 6, py2 + 4); x.closePath(); x.fill();
    });
    const pbo = t > 0 ? Math.sin(t * 2.2) * 3 : 0;
    x.fillStyle = blue; x.beginPath(); x.arc(208, 234 + pbo, 19, 0, 7); x.fill();
    x.beginPath(); x.moveTo(208, 264 + pbo); x.lineTo(192, 240 + pbo); x.lineTo(224, 240 + pbo); x.closePath(); x.fill();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(208, 234 + pbo, 7.5, 0, 7); x.fill();
    // 自店カード（星・件数・営業中）
    card(292, 196, 190, 118, 14);
    txt("あなたのお店", 308, 222, 14, ink, 800);
    txt("★ 4.8", 308, 248, 16, "#f0b445", 800, EN);
    txt(`(${214 + (t > 0 ? Math.floor((t * 1.5) % 6) : 0)}件)`, 366, 247, 12, sub, 600, EN);
    txt("営業中", 308, 272, 12, mint, 700);
    txt("· 徒歩5分", 356, 272, 12, sub);
    pill(308, 284, 76, 24, mint); txt("経路", 330, 301, 12, "#08331f", 700);
    stroke(392, 284, 74, 24, 12, line, 1.5); txt("電話", 414, 301, 12, sub, 700);
  }
  x.restore();

  // ホバー中のライブ表示（処理が動いている感：スキャン光＋LIVEドット）
  if (t > 0) {
    const sx = 24 + ((t * 0.55 * 470) % 470);
    const g = x.createLinearGradient(sx - 36, 0, sx + 36, 0);
    g.addColorStop(0, "rgba(26,92,255,0)"); g.addColorStop(.5, "rgba(26,92,255,.14)"); g.addColorStop(1, "rgba(26,92,255,0)");
    x.fillStyle = g; x.fillRect(0, 60, 512, 324);
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 8));
    x.fillStyle = `rgba(42,193,109,${blink})`; x.beginPath(); x.arc(488, 30, 6, 0, 7); x.fill();
    x.fillStyle = "rgba(233,238,252,.7)"; x.font = `700 13px ${EN}`; x.textAlign = "right"; x.fillText("LIVE", 476, 35); x.textAlign = "left";
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
  coreMesh.userData = { en: "NOS TECHNOLOGY", jp: "Tap to ignite — クリックで起動", note: "" };
  const coreProxy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ visible: false }));
  coreWrap.add(coreProxy);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x1a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 72), ringMat);
  scene.add(ring);
  // 中央クリックの“起動”ギミック用：拡大して消える衝撃波リング＋キック量・バースト進行
  const burstMat = new THREE.MeshBasicMaterial({ color: 0x36c5ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const burstRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.5, 80), burstMat);
  burstRing.visible = false; scene.add(burstRing);
  let coreKick = 0, burstT = 1;
  function igniteCore() {
    coreKick = 1; burstT = 0;
    document.body.classList.add("is-warp");
    setTimeout(() => document.body.classList.remove("is-warp"), 700);
  }

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
    g.center();
    // ExtrudeGeometryのUVは形状座標のままで0-1に収まらず、テクスチャが面の一部にしか乗らない。
    // XYバウンディングで0-1へ正規化し、UIテクスチャを面いっぱいに表示する。
    g.computeBoundingBox();
    const bb = g.boundingBox, sx = 1 / (bb.max.x - bb.min.x), sy = 1 / (bb.max.y - bb.min.y);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) * sx, (pos.getY(i) - bb.min.y) * sy);
    uv.needsUpdate = true;
    return g;
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
  let groupYBase = 0;   // スマホ：3D一式を上へ寄せ、下半分を文字ゾーンにする
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
    const small = r.width < 860;
    // モバイルは解像度倍率を抑えて軽量化（高DPR端末でのGPU負荷を低減）
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    if (layout === "center") {
      group.position.x = 0;
      baseScale = small ? 0.6 : 1.0;
    } else {
      group.position.x = small ? 0 : 1.7;
      baseScale = small ? 0.55 : 0.82;
    }
    group.scale.setScalar(baseScale);
    groupYBase = small ? 0.85 : 0;
    // スマホ：パネルを内側＆上へ寄せて「画面端で切れる」のを防ぎ、Nの周りにフレームインさせる
    panels.forEach((m) => {
      const u = m.userData;
      if (!u.homeBase) u.homeBase = u.home.clone();
      if (small) u.home.set(u.homeBase.x * 0.58, u.homeBase.y * 0.66 + 0.35, u.homeBase.z);
      else u.home.copy(u.homeBase);
    });
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

  // ---- 中央Nを掴んでスワイプ→慣性回転（物理っぽい）＋回すほど背景がじんわり明るく ----
  let spinY = 0, velY = 0, spinX = 0, velX = 0, dragging = false, lastPX = 0, lastPY = 0, downPX = 0, downPY = 0, moved = false, suppressClick = false, spinHeat = 0;
  const spinGlow = document.getElementById("spinGlow");
  function coreHitAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((cx - r.left) / r.width) * 2 - 1; ndc.y = -((cy - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, cam);
    return ray.intersectObjects(panels, false).length === 0 && ray.intersectObject(coreProxy, false).length > 0;
  }
  canvas.addEventListener("pointerdown", (e) => {
    // タッチ端末ではドラッグ回転を無効化（Nの上で指を動かすとスクロールできない
    // “スクロールトラップ”になるため）。タップでの起動演出は click 側で生きる。
    if (isCoarsePointer) return;
    if (!coreHitAt(e.clientX, e.clientY)) return;
    dragging = true; moved = false; velY = 0; velX = 0; lastPX = downPX = e.clientX; lastPY = downPY = e.clientY;
    if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault(); // 掴んでいる間はスクロールさせない
  }, { passive: false });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPX; lastPX = e.clientX;
    const dy = e.clientY - lastPY; lastPY = e.clientY;
    spinY += dx * 0.012; velY = dx * 0.012;   // 横ドラッグ→Y軸回転
    spinX += dy * 0.012; velX = dy * 0.012;   // 縦ドラッグ→X軸回転（斜めは両方＝全方向）
    if (Math.abs(e.clientX - downPX) + Math.abs(e.clientY - downPY) > 6) moved = true;
  });
  const endDrag = () => { if (dragging) { dragging = false; if (moved) suppressClick = true; } };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // クリックで対応セクションへ移動（その都度 pick して堅牢に）
  canvas.style.pointerEvents = "auto";
  canvas.addEventListener("click", () => {
    if (suppressClick) { suppressClick = false; return; } // スワイプ回転後のクリックは無視
    const obj = pick();
    if (!obj || !obj.userData.target) {
      // パネル以外＝中央のNをクリック → “起動”ギミック（衝撃波＋フラッシュ＋脈動）
      if (ray.intersectObject(coreProxy, false).length) igniteCore();
      return;
    }
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
    group.position.y = groupYBase + sp * 2.6;
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
    coreKick = lerp(coreKick, 0, 0.06); // 起動キックの減衰
    pts.scale.setScalar(1 + coreHover * 0.55 + coreKick * 0.9 + spinHeat * 0.4);
    // スワイプ回転の物理：離すと慣性で回り摩擦で減速。低速かつ非ドラッグ時は正面へやさしく整列。
    const PI2 = Math.PI * 2;
    if (!dragging) {
      spinY += velY; velY *= 0.95;
      spinX += velX; velX *= 0.95;
      if (Math.hypot(velX, velY) < 0.0016) { // 低速時は正面へやさしく整列（両軸）
        spinY += (Math.round(spinY / PI2) * PI2 - spinY) * 0.04;
        spinX += (Math.round(spinX / PI2) * PI2 - spinX) * 0.04;
      }
    }
    // 回すほど背景がじんわり明るく（上限0.6）。回転が収まると減衰して戻る＝文字が見えなくならない。
    spinHeat = Math.min(0.6, spinHeat * 0.93 + Math.hypot(velX, velY) * 1.6);
    if (spinGlow) spinGlow.style.opacity = spinHeat.toFixed(3);
    const spinning = dragging || Math.hypot(velX, velY) > 0.002;
    // 中央“N”：通常は正面向き＋ゆらぎ。掴み/慣性中は spinX/spinY 主導で全方向にくるくる回る。
    nGroup.rotation.y = spinY + (spinning ? 0 : Math.sin(t * 0.28) * 0.3 + pointer.nx * 0.28);
    nGroup.rotation.x = spinX + (spinning ? 0 : Math.sin(t * 0.5) * 0.05 - pointer.ny * 0.18);
    nGroup.position.set(0, Math.sin(t * 1.0) * 0.05, coreHover * 1.3 + coreKick * 0.8);
    nGroup.scale.setScalar(0.82 * (1 + coreHover * 0.7 + coreKick * 0.6) * (1 + Math.sin(t * 1.6) * 0.012));
    nMat.emissiveIntensity = 0.05 + coreHover * 0.3 + coreKick * 1.6 + spinHeat * 0.5;
    nEdgeMat.opacity = Math.min(1, 0.32 + coreHover * 0.4 + coreKick * 0.6 + Math.sin(t * 2) * 0.06);
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
    // 起動の衝撃波：クリックで一度だけ大きく広がって消える
    if (burstT < 1) {
      burstT = Math.min(1, burstT + 0.022);
      const e = 1 - Math.pow(1 - burstT, 3);
      burstRing.visible = true;
      burstRing.position.copy(coreWorld); burstRing.quaternion.copy(cam.quaternion);
      const bsc = (0.6 + e * 7) * group.scale.x;
      burstRing.scale.set(bsc, bsc, bsc);
      burstMat.opacity = (1 - e) * 0.85;
    } else if (burstRing.visible) burstRing.visible = false;

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
