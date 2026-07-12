// smooth.js : Lenis による慣性スクロール
import { prefersReducedMotion, isMobileLayout } from "./utils.js";

// Lenisを初期化して返す。失敗・モーション抑制時は null（ネイティブスクロールにフォールバック）。
// lenis は動的importで読み込み、CDN失敗時もページ本体が表示されるようにする。
export async function initSmoothScroll() {
  // モバイルはネイティブスクロール。CSSスクロールスナップ（没入シーン）を効かせるため
  // Lenisの慣性は使わない（transformベースのLenisはscroll-snapと相性が悪い）。
  if (prefersReducedMotion || isMobileLayout) return null;

  try {
    const { default: Lenis } = await import("lenis");
    const lenis = new Lenis({
      duration: 1.15,           // 慣性の効き具合
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    // requestAnimationFrame で駆動
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // アンカーリンクを慣性スクロールで移動させる
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -10 });
      });
    });

    // 3Dヒーロー等からパネルクリックでスクロールさせるため共有
    window.__lenis = lenis;
    return lenis;
  } catch (err) {
    // Lenisの読込失敗など。ネイティブスクロールにフォールバック
    console.warn("慣性スクロールの初期化に失敗。ネイティブスクロールを使用します。", err);
    return null;
  }
}
