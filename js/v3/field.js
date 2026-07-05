// field.js : ページ全体を貫く粒子フィールド（v3の主役）
// スクロールで4つのフォーメーションをモーフする：
//   0 混沌（開店前のノイズ） → 1 渦（雑務に吸われる時間）
//   → 2 格子（AIと仕組みの秩序） → 3 開花（戻ってきた時間）
// 色も冷（氷=AI）→暖（真鍮=人の時間）へ、物語に合わせて遷移する。
import * as THREE from "three";
import { pointer, prefersReducedMotion, clamp, lerp } from "../utils.js";

// 物語の色（フォーメーションごとの到達色）
const COLOR_STOPS = [
  new THREE.Color("#6f7a86"), // 混沌: くすんだスレート
  new THREE.Color("#5c6e80"), // 渦:   さらに冷えていく
  new THREE.Color("#8fcfdd"), // 格子: 氷（AIの精度）
  new THREE.Color("#e0a458"), // 開花: 真鍮（人の時間）
];

// 柔らかい発光スプライト
function makeSprite() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,244,230,0.75)");
  g.addColorStop(1, "rgba(255,244,230,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

// ---- フォーメーション生成（各粒子の目標座標） ----
function buildFormations(count) {
  const chaos = new Float32Array(count * 3);
  const vortex = new Float32Array(count * 3);
  const lattice = new Float32Array(count * 3);
  const bloom = new Float32Array(count * 3);

  // 流線（レーン）の本数＝仕組みの秩序。
  // 平面グリッドは遠近で層がズレてモアレ化するため、
  // 投影しても崩れない「線」で秩序を表現する。
  const lanes = 21;
  const perLane = Math.ceil(count / lanes);

  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const t = i / count;

    // 0) 混沌：広いガウス雲（乱雑な一日）
    chaos[o] = (Math.random() * 2 - 1) * 7.2;
    chaos[o + 1] = (Math.random() * 2 - 1) * 4.2;
    chaos[o + 2] = (Math.random() * 2 - 1) * 2.6 - 0.5;

    // 1) 渦：下へ吸い込まれる漏斗（時間が奪われる）
    const turns = 6.5;
    const ang = t * Math.PI * 2 * turns + Math.random() * 0.35;
    const rr = 0.35 + 3.6 * Math.pow(1 - t, 1.25) + Math.random() * 0.18;
    vortex[o] = Math.cos(ang) * rr;
    vortex[o + 1] = 2.6 - t * 5.4 + (Math.random() - 0.5) * 0.2;
    vortex[o + 2] = Math.sin(ang) * rr * 0.62 - 0.4;

    // 2) 流線：水平に走る光のレーン（整った流れ＝仕組み）
    const lane = i % lanes;
    const along = Math.floor(i / lanes) / perLane; // レーン内の位置 0〜1
    const laneY = (lane / (lanes - 1) - 0.5) * 5.0;
    lattice[o] = (along - 0.5) * 11.0;
    lattice[o + 1] = laneY + Math.sin(along * Math.PI * 2 + lane * 1.7) * 0.06;
    lattice[o + 2] = ((lane * 7) % 5 / 5 - 0.5) * 0.9 - 0.3;

    // 3) 開花：フィボナッチ球（まるく戻ってきた時間）
    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * k;
    const R = 2.15 + Math.random() * 0.1;
    bloom[o] = Math.cos(theta) * Math.sin(phi) * R;
    bloom[o + 1] = Math.cos(phi) * R * 0.92;
    bloom[o + 2] = Math.sin(theta) * Math.sin(phi) * R * 0.8 - 0.2;
  }
  return [chaos, vortex, lattice, bloom];
}

export function initField(canvas) {
  if (!canvas) return false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // 加算合成の点群にAAは不要。省電力優先
      alpha: true,
      powerPreference: "low-power",
    });
  } catch (e) {
    return false;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
  camera.position.set(0, 0, 8);

  const isSmall = window.innerWidth < 720;
  const COUNT = prefersReducedMotion ? 2400 : isSmall ? 3800 : 9000;

  const forms = buildFormations(COUNT);
  const positions = new Float32Array(COUNT * 3);
  positions.set(forms[0]); // 混沌から開始
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) phases[i] = Math.random() * Math.PI * 2;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: isSmall ? 0.05 : 0.045,
    map: makeSprite(),
    color: COLOR_STOPS[0].clone(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ---- スクロール→フェーズのアンカー（幕の中心で各フォーメーション完成） ----
  let anchors = [0, 1000, 2000, 3000]; // resize時に実測へ更新
  let dimStart = 4000;
  let dimEnd = 5000;

  function measure() {
    const vh = window.innerHeight;
    const acts = document.querySelectorAll(".act");
    if (acts.length >= 3) {
      anchors = [0];
      acts.forEach((act) => {
        const top = act.offsetTop;
        const h = act.offsetHeight;
        // sticky領域の中央（幕のコピーが立ち上がる位置）でフォーメーション完成
        anchors.push(top + (h - vh) * 0.55);
      });
    }
    const services = document.getElementById("services");
    if (services) {
      dimStart = services.offsetTop - vh * 0.7;
      dimEnd = services.offsetTop + vh * 0.1;
    }
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
  }
  resize();
  window.addEventListener("resize", resize);
  // 画像読込などでレイアウト高が変わった後にも実測し直す
  window.addEventListener("load", measure);

  // スクロール値 → 連続フェーズ（0〜3）
  function phaseAt(y) {
    for (let s = 0; s < 3; s++) {
      if (y <= anchors[s + 1]) {
        const span = anchors[s + 1] - anchors[s] || 1;
        return s + clamp((y - anchors[s]) / span, 0, 1);
      }
    }
    return 3;
  }

  // フォーメーションごとの揺らぎ量（混沌ほど大きく、格子はほぼ静止）
  const WIGGLE = [0.5, 0.16, 0.015, 0.12];

  const tmpColor = new THREE.Color();
  let camX = 0;
  let camY = 0;

  function render(now) {
    const t = now / 1000;
    const y = window.scrollY || 0;
    const phase = phaseAt(y);
    const s = Math.min(Math.floor(phase), 2);
    const f = clamp(phase - s, 0, 1);
    // smoothstepで滑らかにブレンド
    const e = f * f * (3 - 2 * f);

    const A = forms[s];
    const B = forms[s + 1];
    const wig = lerp(WIGGLE[s], WIGGLE[s + 1], e);

    // ポインター位置をワールド座標へ（z=0平面近似）
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const viewW = viewH * camera.aspect;
    const px = pointer.nx * viewW;
    const py = -pointer.ny * viewH;

    for (let i = 0; i < COUNT; i++) {
      const o = i * 3;
      const ph = phases[i];
      // 目標＝2フォーメーションのブレンド＋揺らぎ
      let tx = A[o] + (B[o] - A[o]) * e + Math.sin(t * 0.55 + ph) * wig;
      let ty = A[o + 1] + (B[o + 1] - A[o + 1]) * e + Math.cos(t * 0.5 + ph * 1.2) * wig;
      let tz = A[o + 2] + (B[o + 2] - A[o + 2]) * e + Math.sin(t * 0.4 + ph * 0.8) * wig * 0.6;

      // ポインター反発（近くの粒子を軽く押しのける）
      // 半径を絞る：大きいとフォーメーション自体がえぐれて形が読めなくなる
      const dx = tx - px;
      const dy = ty - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.85 && d2 > 0.0001) {
        const push = (1 - d2 / 0.85) * 0.3;
        tx += dx * push;
        ty += dy * push;
      }

      // 現在位置を目標へ緩やかに追従（モーフの余韻）
      positions[o] += (tx - positions[o]) * 0.07;
      positions[o + 1] += (ty - positions[o + 1]) * 0.07;
      positions[o + 2] += (tz - positions[o + 2]) * 0.07;
    }
    geo.attributes.position.needsUpdate = true;

    // 色の物語：冷 → 暖
    tmpColor.copy(COLOR_STOPS[s]).lerp(COLOR_STOPS[s + 1], e);
    mat.color.copy(tmpColor);

    // 幕を抜けたら背景として静かに退く
    const dim = clamp((y - dimStart) / (dimEnd - dimStart || 1), 0, 1);
    mat.opacity = lerp(0.85, 0.22, dim);

    // 全体の呼吸と回転。時間で蓄積させず有界の揺らぎに留める
    // （格子は平面的なので、回転が溜まるとエッジオンで潰れて見えるため）
    points.rotation.y = Math.sin(t * 0.07) * 0.09 + phase * 0.08;
    points.rotation.z = Math.sin(t * 0.05) * 0.02;

    // カメラ：ポインターパララックス＋スクロールで僅かに引く
    camX = lerp(camX, pointer.nx * 0.9, 0.04);
    camY = lerp(camY, -pointer.ny * 0.6, 0.04);
    camera.position.x = camX;
    camera.position.y = camY;
    camera.position.z = 8 + dim * 1.6;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  // 開発用の観測フック（本番でも無害）
  window.__fieldDebug = {
    COUNT,
    anchors: () => anchors.slice(),
    phase: () => phaseAt(window.scrollY || 0),
    pos: (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]],
    lat: (i) => [forms[2][i * 3], forms[2][i * 3 + 1], forms[2][i * 3 + 2]],
  };

  if (prefersReducedMotion) {
    // 静止画1フレーム：開花（真鍮）の状態で穏やかに
    positions.set(forms[3]);
    geo.attributes.position.needsUpdate = true;
    mat.color.copy(COLOR_STOPS[3]);
    mat.opacity = 0.5;
    renderer.render(scene, camera);
  } else {
    const loop = (now) => {
      render(now || 0);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return true;
}
