// flowfield.js : サイト全体の背景に“流れる光の線”を描くアンビエント・モーション
// スクロール量・速度で線が流れ、サイト全体が静かに動いているように見せる（白黒ゾーンの代替）。
// 固定オーバーレイ＋screen合成で、暗い配色では発光ラインとして映える。控えめが基本。
import { prefersReducedMotion, lerp } from "./utils.js";

export function initFlowField(canvas) {
  if (!canvas || prefersReducedMotion) { if (canvas) canvas.style.display = "none"; return; }
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;

  // アクセント色（--mint）をCSSから取得。palette切替で更新。
  let rgb = [54, 197, 255];
  const readAccent = () => {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--mint").trim();
    const m = c.match(/^#?([0-9a-f]{6})$/i);
    if (m) rgb = [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
  };
  readAccent();
  window.addEventListener("palette", readAccent);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // スクロール量・速度
  let scrollY = window.scrollY || 0;
  let lastY = scrollY;
  let vel = 0; // 平滑化したスクロール速度
  window.addEventListener("scroll", () => { scrollY = window.scrollY || 0; }, { passive: true });

  // 流れる線（本数控えめ・太さ/位相をばらす）
  const N = window.innerWidth < 720 ? 5 : 9;
  const lines = [];
  for (let i = 0; i < N; i++) {
    lines.push({
      y: (i + 0.5) / N,            // 縦位置(0〜1)
      amp: 18 + Math.random() * 46, // 波の振幅(px)
      len: 0.7 + Math.random() * 0.9, // 波の長さ係数
      sp: 0.12 + Math.random() * 0.22, // 流れる速さ
      ph: Math.random() * 6.28,
      a: 0.05 + Math.random() * 0.06, // 基本アルファ
    });
  }

  function render(now) {
    const t = (now || 0) / 1000;
    // スクロール速度（線の発光・流れに反映）
    const dy = scrollY - lastY; lastY = scrollY;
    vel = lerp(vel, Math.min(Math.abs(dy), 60), 0.1);
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const baseY = ln.y * H + Math.sin(t * 0.1 + ln.ph) * 24;
      // スクロールで横に流れ、速度で少し上下にうねる
      const flow = t * ln.sp * 220 + scrollY * 0.35;
      const amp = ln.amp * (1 + vel * 0.02);
      const alpha = Math.min(0.22, ln.a + vel * 0.006);
      ctx.beginPath();
      const step = 26;
      for (let x = -40; x <= W + 40; x += step) {
        const y = baseY
          + Math.sin((x * ln.len) / 180 + flow / 90 + ln.ph) * amp
          + Math.sin((x) / 60 - t * 0.6 + i) * (amp * 0.18);
        x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      grd.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
      grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
