// v3/main.js : 「店主の一日」バージョンの初期化エントリ
// 既存モジュール（utils/smooth/reveal/contact）を再利用し、
// v3固有＝粒子フィールド・スクロール時計・3幕制御・Works帯をここで束ねる。
import { supportsWebGL, prefersReducedMotion } from "../utils.js";
import { initSmoothScroll } from "../smooth.js";
import { initReveal } from "../reveal.js";
import { initContactForm } from "../contact.js";

// リロードは常にトップ（一日の始まり）から
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

async function boot() {
  // 1. 粒子フィールド（WebGL不可なら静的背景へ）
  await initFieldLayer();

  // 2. 慣性スクロール（失敗時 null＝ネイティブ）
  const lenis = await initSmoothScroll();
  const hashTarget = location.hash && document.querySelector(location.hash);
  if (hashTarget) {
    if (lenis) lenis.scrollTo(hashTarget, { immediate: true });
    else hashTarget.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }

  // 3. ヘッダー / スクロール時計 / 3幕
  initHeaderState();
  initClock();
  initActs();

  // 4. Works帯（ゆっくり流れ、スクロール速度で加速）
  initWorksBand(document.getElementById("worksTrack"), lenis);

  // 5. リビール＆フォーム
  initReveal();
  initContactForm(document.getElementById("contactForm"));
}

// 粒子フィールドの初期化（動的import。失敗時はCSSフォールバックを点灯）
async function initFieldLayer() {
  const canvas = document.getElementById("fieldCanvas");
  const fallback = document.getElementById("fieldFallback");
  if (supportsWebGL()) {
    try {
      const mod = await import("./field.js");
      if (mod.initField(canvas)) return;
    } catch (err) {
      console.warn("粒子フィールドの初期化に失敗。静的背景を使用します。", err);
    }
  }
  if (canvas) canvas.style.display = "none";
  if (fallback) fallback.classList.add("is-on");
}

// ヘッダー：少しスクロールしたらガラス背景
function initHeaderState() {
  const header = document.getElementById("v3Header");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("is-scrolled", (window.scrollY || 0) > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// スクロール時計：ページ進行を店主の一日（07:00→22:00）に写像
function initClock() {
  const timeEl = document.getElementById("clockTime");
  const labelEl = document.getElementById("clockLabel");
  if (!timeEl) return;

  // セクション → その時間帯のラベル
  const marks = [
    ["#hero", "開店前"],
    ['.act[data-act="1"]', "雑務"],
    ['.act[data-act="2"]', "仕組み"],
    ['.act[data-act="3"]', "戻る時間"],
    ["#services", "できること"],
    ["#works", "つくるもの"],
    ["#pricing", "料金"],
    ["#process", "進め方"],
    ["#faq", "よくある質問"],
    ["#contact", "無料相談"],
    [".footer", "閉店"],
  ]
    .map(([sel, label]) => ({ el: document.querySelector(sel), label }))
    .filter((m) => m.el);

  const START = 7 * 60; // 07:00
  const END = 22 * 60; // 22:00
  let shown = "";

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight || 1;
    const p = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
    const mins = Math.round(START + (END - START) * p);
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    const text = `${hh}:${mm}`;
    if (text !== shown) {
      shown = text;
      timeEl.textContent = text;
    }

    // 現在のセクションのラベル
    if (labelEl) {
      const mid = (window.scrollY || 0) + window.innerHeight * 0.5;
      let label = marks[0]?.label || "";
      for (const m of marks) {
        if (m.el.offsetTop <= mid) label = m.label;
      }
      if (labelEl.textContent !== label) labelEl.textContent = label;
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

// 3幕：ステージが画面中央に来たらコピーを立ち上げる
function initActs() {
  const acts = document.querySelectorAll(".act");
  if (!acts.length) return;
  if (prefersReducedMotion) {
    acts.forEach((a) => a.classList.add("is-on"));
    return;
  }
  function onScroll() {
    const y = window.scrollY || 0;
    const vh = window.innerHeight;
    acts.forEach((act) => {
      const on = y > act.offsetTop - vh * 0.45;
      if (on) act.classList.add("is-on");
    });
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Works帯：無限ループで静かに流し、スクロール速度で少し加速
function initWorksBand(track, lenis) {
  if (!track) return;

  // 途切れないよう内容を複製
  track.innerHTML += track.innerHTML;

  if (prefersReducedMotion) return; // 静止のまま（横は overflow で見られる）

  let offset = 0;
  let velocity = 0;
  if (lenis && lenis.on) lenis.on("scroll", (e) => (velocity = e.velocity || 0));

  function loop() {
    const half = track.scrollWidth / 2;
    if (half > 0) {
      offset += 0.45 + Math.abs(velocity) * 0.35;
      if (offset >= half) offset -= half;
      track.style.transform = `translateX(${-offset}px)`;
    }
    velocity *= 0.9;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
