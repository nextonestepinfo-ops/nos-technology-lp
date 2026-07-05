// build-cinema.js : 「AIが、あなたのお店のために作る」pin＋スクロール同期シネマ
// story.js と同じ方式：sticky ステージに進捗 p(0→1) と data-stage(0..4) を渡し、
// CSS 側でログ点灯・ワイヤー出現・デザイン描画(clip-path)・スマホIN・スタンプを進める。
import { prefersReducedMotion, clamp } from "./utils.js";

// 各ステージの開始しきい値（p）。0=ヒアリング…4=公開
const THRESHOLDS = [0, 0.2, 0.42, 0.68, 0.88];
// デザイン“描画”（--reveal）はステージ2〜3の間で 0→1
const REVEAL_FROM = 0.42;
const REVEAL_TO = 0.82;

export function initBuildCinema(lenis) {
  const sec = document.getElementById("build");
  const stage = document.getElementById("buildStage");
  if (!sec || !stage) return;
  const logs = [...stage.querySelectorAll(".build__log li")];

  // モーション抑制時：完成状態で静止表示
  if (prefersReducedMotion) {
    stage.dataset.stage = "4";
    stage.style.setProperty("--p", "1");
    stage.style.setProperty("--reveal", "1");
    stage.style.setProperty("--scan", "0");
    logs.forEach((li) => li.classList.add("is-done"));
    return;
  }

  let current = -1;

  const update = () => {
    const rect = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    const p = clamp(-rect.top / (total || 1), 0, 1);
    stage.style.setProperty("--p", p.toFixed(4));

    // 現在ステージを決定
    let s = 0;
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (p >= THRESHOLDS[i]) { s = i; break; }
    }
    if (s !== current) {
      current = s;
      stage.dataset.stage = String(s);
      logs.forEach((li, i) => {
        li.classList.toggle("is-done", i < s);
        li.classList.toggle("is-now", i === s);
      });
    }

    // デザインの描画量とスキャンラインの可視状態
    const reveal = clamp((p - REVEAL_FROM) / (REVEAL_TO - REVEAL_FROM), 0, 1);
    stage.style.setProperty("--reveal", reveal.toFixed(4));
    // スキャンラインは描画中のみ光らせる
    stage.style.setProperty("--scan", reveal > 0 && reveal < 1 ? "1" : "0");
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  if (lenis && lenis.on) lenis.on("scroll", update);
}
