// story.js : スクロール・ストーリー（pin＋スクロール同期）。
// 背の高いセクション内でステージを sticky 固定し、スクロール進捗 p(0→1) を CSS変数へ。
// p に応じて文言ビート（cross-fade）・進捗レール・背景の灯りが切り替わる＝最後まで引っぱる演出のプロト。
export function initStory(lenis) {
  const sec = document.getElementById("story");
  if (!sec) return;
  const stage = sec.querySelector(".story__stage");
  const beats = [...sec.querySelectorAll(".story__beat")];
  if (!stage || !beats.length) return;
  let active = -1;

  const update = () => {
    const rect = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight; // セクション内のスクロール可能距離
    const p = Math.min(1, Math.max(0, (-rect.top) / (total || 1)));
    stage.style.setProperty("--p", p.toFixed(4));
    const idx = Math.min(beats.length - 1, Math.floor(p * beats.length));
    if (idx !== active) {
      active = idx;
      beats.forEach((b, k) => b.classList.toggle("is-active", k === idx));
    }
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  if (lenis && lenis.on) lenis.on("scroll", update);
}
