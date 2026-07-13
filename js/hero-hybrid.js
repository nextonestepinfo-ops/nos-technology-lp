// hero-hybrid.js : ヒーローの A×B ハイブリッド 3D（インタラクティブ・パネル）
// 中央のAIコア（脈動する低ポリ結晶＋ワイヤー殻＋発光ハロー＋周回パーティクル）を、
// 周回するUIパネル（店舗サイト/予約管理/AI返信/地図）が囲み、コアから各パネルへ光が流れる。
// パネルはホバーで手前にズーム＋中身がビルドアニメ、クリックで対応セクションへ慣性スクロール。
// "palette" イベントで配色に追従。失敗時は main.js 側でCSS背景にフォールバック。
import * as THREE from "three";
import { pointer, prefersReducedMotion, isCoarsePointer, isMobileLayout, lerp, clamp } from "./utils.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

const hx = (s) => parseInt(s.slice(1), 16);

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

  // 接地影：明るい面でオブジェクトの浮遊感を出す柔らかい楕円（暗面では消す）
  const shadowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const r = g.createRadialGradient(128, 128, 8, 128, 128, 126);
    r.addColorStop(0, "rgba(22,24,30,0.34)"); r.addColorStop(1, "rgba(22,24,30,0)");
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const groundShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 });
  const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.9), groundShadowMat);
  groundShadow.rotation.x = -Math.PI / 2; groundShadow.position.y = -2.62;
  group.add(groundShadow);

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
    { kind:"site",  w:2.5, h:1.875, pos:[2.9, 1.0, 0.3],  rot:[-.1, -.5, .03],  en:"Web Design",    jp:"店舗サイト制作",   note:"Design · SEO · Forms",   chips:["ランディング設計","Googleマップ","問い合わせ導線"], target:"#works" },
    { kind:"admin", w:2.2, h:1.65, pos:[-3.0, 1.3, -0.5], rot:[-.05, .42, -.04], en:"Admin System",  jp:"予約・顧客管理",   note:"Bookings · CRM",         chips:["予約管理","顧客管理","スタッフ管理"],     target:"#services" },
    { kind:"reply", w:2.1, h:1.575, pos:[2.7, -1.5, -0.2], rot:[.05, -.55, .02],  en:"AI Automation", jp:"AI業務自動化",     note:"Replies in seconds",     chips:["自動文案","24時間対応","見込み客管理"],   target:"#services" },
    { kind:"map",   w:1.95, h:1.4625, pos:[-2.7, -1.2, 0.4], rot:[-.08, .5, .03],   en:"Growth",        jp:"集客・SNS導線",   note:"Local SEO · MEO",        chips:["MEO対策","SNS導線","口コミ獲得"],         target:"#services" },
  ];
  let currentAcc = { mint: "#16b89a", blue: "#3f6df0" };

  // パネル面は「実際に作ったツールのスクリーンショット」を貼る＝リアリティの核。
  // 手描きUIはAI感が出るため廃止。実プロダクト画面（管理/AI返信/MEOマップ/サイト）の
  // 軽量webp(4:3)をテクスチャに使う。読み込み完了で needsUpdate される。
  const texLoader = new THREE.TextureLoader();
  function panelTexture(kind) {
    const tex = texLoader.load(`assets/panels/panel-${kind}-tex.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      t.needsUpdate = true;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    // ミップ有効で遠景でも縮小ノイズを抑える（1024×768はWebGL2でNPOTミップ可）
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  // スマホ：パネルは生成しない（2ゾーン構成でNコアのみ。内容はDOMの.capabilityカードが担う）
  const panels = isMobileLayout ? [] : defs.map((d, idx) => {
    const geo = panelGeo(d.w, d.h);
    const tex = panelTexture(d.kind);
    // 面＝ガラス画面。emissiveを強くすると白背景UIが一律発光して白飛び→拡大時にUIが飛ぶ。
    // よって自発光はごく弱い下支えに留め、画像本来の陰影＋ライティングでUIをくっきり見せる。
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .14, roughness: .34, metalness: 0, transparent: true });
    // 側面（厚みの縁）はやや濃いグレーにして、白いUI面と生成り地の境界を立てる
    const side = new THREE.MeshStandardMaterial({ color: 0xcfccc3, roughness: .3, metalness: .1, transparent: true });
    const mesh = new THREE.Mesh(geo, [face, side]);
    mesh.position.set(...d.pos); mesh.rotation.set(...d.rot);
    mesh.userData = {
      kind: d.kind, en: d.en, jp: d.jp, note: d.note, chips: d.chips, idx: String(idx + 1).padStart(2, "0"), target: d.target,
      home: new THREE.Vector3(...d.pos), baseRot: new THREE.Euler(...d.rot),
      ph: Math.random() * 6, tex,
      h: 0, click: 0,
    };
    group.add(mesh); return mesh;
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
      // スマホ2ゾーン構成：canvasは上ゾーンのみなのでNコアを中央にやや大きく
      baseScale = small ? (isMobileLayout ? 0.8 : 0.6) : 1.0;
    } else {
      group.position.x = small ? 0 : 1.7;
      baseScale = small ? 0.55 : 0.82;
    }
    group.scale.setScalar(baseScale);
    // スマホ2ゾーンではcanvas自体が上ゾーン＝上寄せ不要（centerレイアウトのみ）
    groupYBase = small ? (isMobileLayout && layout === "center" ? 0 : 0.85) : 0;
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
  // タッチ端末・スマホレイアウトでは canvas を完全に飾りにする：
  // CTA周辺のタップが canvas に貫通して誤遷移する事故を構造的に防ぐ。
  if (isCoarsePointer || isMobileLayout) {
    canvas.style.pointerEvents = "none";
  } else {
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
  }

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
    // スマホは上ゾーンが小さいので視差の持ち上げを控えめに（すぐ見切れないように）
    group.position.y = groupYBase + sp * (isMobileLayout ? 1.1 : 2.6);
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
      // ホバー寄り(0→1)
      u.h = lerp(u.h, isH ? 1 : 0, 0.15);
      // クリック演出の減衰
      u.click = lerp(u.click, 0, 0.08);

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
    groundShadowMat.opacity = p.dark ? 0 : 0.85; // 接地影は明るい面だけ
    currentAcc = { mint: p.css.mint, blue: p.css.blue, dark: !!p.dark };
    // 実画像パネル：自発光は弱い下支えのみ（拡大時の白飛び回避）。暗面でやや強める程度。
    panels.forEach((m) => { m.material[0].emissiveIntensity = p.dark ? 0.28 : 0.14; });
  }
  window.addEventListener("palette", (e) => applyPalette(e.detail));

  // 現在適用中のパレット（CSS変数）から初期化。
  // 以前はここでネイビー固定に上書きしており、既定パレットが3Dに反映されないバグがあった。
  {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fb) => (cs.getPropertyValue(name).trim() || fb);
    applyPalette({
      css: { mint: v("--mint", "#1a5cff"), blue: v("--blue", "#3d8bff"), lav: v("--lav", "#5b6bff") },
      dark: document.documentElement.dataset.theme === "dark",
    });
  }

  if (prefersReducedMotion) {
    render(0);
  } else {
    const loop = (now) => { render(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  return true;
}
