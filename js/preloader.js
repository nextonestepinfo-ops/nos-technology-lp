// preloader.js : カウンター演出 → マスクを開いて本編へ
import { prefersReducedMotion } from "./utils.js";

// プリローダーを動かし、完了後に onDone を呼ぶ
export function initPreloader(onDone) {
  const el = document.getElementById("preloader");
  const countEl = document.getElementById("preloadCount");
  const barEl = document.getElementById("preloadBar");

  let done = false;
  const finish = () => {
    if (done) return; // 多重実行ガード（RAFと安全網の両方から呼ばれ得る）
    done = true;
    document.body.classList.remove("is-loading");
    if (el) el.classList.add("is-done");
    if (typeof onDone === "function") onDone();
  };

  // 再訪（同一セッション）はカウンター演出をスキップして即表示
  let seen = false;
  try { seen = sessionStorage.getItem("nos-preloaded") === "1"; sessionStorage.setItem("nos-preloaded", "1"); } catch (e) {}
  if (!el || prefersReducedMotion || seen) {
    finish();
    return;
  }

  const DURATION = 900; // カウントに要する時間(ms)。初回のみ・短めに
  let start = null;

  function tick(now) {
    if (start === null) start = now;
    const t = Math.min((now - start) / DURATION, 1);
    // 終盤を緩める easeOut
    const eased = 1 - Math.pow(1 - t, 3);
    const pct = Math.round(eased * 100);
    if (countEl) countEl.textContent = String(pct);
    if (barEl) barEl.style.width = pct + "%";

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // 少し見せてからフェードアウト
      setTimeout(finish, 250);
    }
  }
  requestAnimationFrame(tick);

  // 安全網：バックグラウンドタブ等で RAF が発火しない場合でも必ず解除する
  // （setTimeout は hidden タブでも発火するため、本文ロックの固着を防ぐ）
  setTimeout(finish, DURATION + 1200);
}
