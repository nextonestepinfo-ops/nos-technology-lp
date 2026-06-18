// zones.js : スクロール位置で“サイト全体”の背景色を切り替える
// 特定セクションが画面中央に達するとゾーンが変わり、ワイプ（カーテン）でサイト全体がフリップする。
import { prefersReducedMotion } from "./utils.js";

// ゾーン定義（id = 切替の起点セクション）。--paper/--ink を切り替える。
const ZONES = {
  hero:     { paper: "#f4f5f8", ink: "#16213a" }, // 明（ブランド白）
  services: { paper: "#0b0f17", ink: "#f3f6fa" }, // 暗（ネイビーブラック）
  works:    { paper: "#eef2fb", ink: "#16213a" }, // 明（青みのある白）
  contact:  { paper: "#0d1b2e", ink: "#eaf1ff" }, // 暗（ディープネイビー）
};

export function initZones() {
  const root = document.documentElement.style;
  const sweep = document.getElementById("sweep");
  const setVars = (z) => { root.setProperty("--paper", z.paper); root.setProperty("--ink", z.ink); };

  let applied = "hero";   // 現在表示中
  let desired = "hero";   // スクロールで決まる最新の目標
  let animating = false;

  // 目標と表示が食い違っていれば1回だけワイプ。終了後に再度チェック（多重発火ガード）。
  function settle() {
    if (animating || desired === applied) return;
    const id = desired, z = ZONES[id];
    if (!z) return;

    if (prefersReducedMotion || !sweep) { setVars(z); applied = id; return; }

    animating = true;
    sweep.style.background = z.paper;
    const anim = sweep.animate(
      [
        { transform: "translateY(100%)" },
        { transform: "translateY(0%)", offset: 0.5 },
        { transform: "translateY(-100%)" },
      ],
      { duration: 900, easing: "cubic-bezier(.65,0,.35,1)" }
    );
    // カーテンが画面を覆った瞬間に色を入れ替える（フラッシュさせない）
    const swap = setTimeout(() => { setVars(z); applied = id; }, 430);
    anim.onfinish = () => {
      clearTimeout(swap);
      if (applied !== id) setVars(z);
      applied = id;
      animating = false;
      settle(); // 待機中の目標があれば続けて処理
    };
  }

  // 初期ゾーンは即時適用
  setVars(ZONES.hero);

  const targets = Object.keys(ZONES)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !targets.length) return;

  // 画面中央(0高さのライン)を起点セクションが横切ったら目標ゾーンを更新
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && ZONES[e.target.id]) {
          desired = e.target.id;
          settle();
        }
      });
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
  );
  targets.forEach((t) => io.observe(t));
}
