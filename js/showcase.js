// showcase.js : 制作サイトの「流れるショーケース」
// 各 .showcase__row を data-dir(left/right) に応じて無限スクロール。ホバーで一時停止。
import { prefersReducedMotion } from "./utils.js";

export function initShowcase(root) {
  if (!root) return;
  const rows = [...root.querySelectorAll(".showcase__row")];

  rows.forEach((row) => {
    // モーション抑制時は静止（複製もしない）
    if (prefersReducedMotion) return;

    // シームレスなループのため内容を複製
    row.innerHTML += row.innerHTML;

    const dir = row.dataset.dir === "right" ? 1 : -1;
    const speed = 0.4; // px/frame
    let half = row.scrollWidth / 2; // 複製前1セット分の幅
    let offset = 0;
    let paused = false;

    // フォント/レイアウト確定後に幅を測り直す
    const remeasure = () => { half = row.scrollWidth / 2; };
    setTimeout(remeasure, 600);
    window.addEventListener("resize", remeasure);

    // ホバー中は流れを止める（視認しやすく）
    row.addEventListener("pointerenter", () => (paused = true));
    row.addEventListener("pointerleave", () => (paused = false));

    function loop() {
      if (!paused && half > 0) {
        // 0〜half の範囲で巡回（剰余で常に正の値に）
        offset = ((offset + speed * dir) % half + half) % half;
        row.style.transform = `translateX(${-offset}px)`;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
}
