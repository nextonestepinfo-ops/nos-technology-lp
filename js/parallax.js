// parallax.js : ヒーローのスクロール視差。層ごとに速度差＋フェードで奥行きを出す。
// 視認性最優先：静止中はそのまま読め、スクロールした分だけ層が分離して動く。
import { prefersReducedMotion, pointer } from "./utils.js";

export function initParallax(lenis) {
  if (prefersReducedMotion) return;
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // 対象レイヤー（要素 / スクロール速度係数(負=上へ) / フェード強さ / ポインタ追従px）
  const layers = [
    { el: document.querySelector(".hero-topline"), speed: -0.22, fade: 0.9, px: 12 },
    { el: document.querySelector(".hero__content"), speed: -0.62, fade: 1.3, px: 22 },
    { el: document.querySelector(".hero__meta"), speed: -0.12, fade: 2.6, px: 0 },
  ].filter((l) => l.el);
  layers.forEach((l) => { l.el.style.willChange = "transform, opacity"; });

  let scrollY = window.scrollY || 0;

  const apply = () => {
    const h = hero.offsetHeight || window.innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / h)); // ヒーロー内の進捗 0..1
    // ヒーローを過ぎたら視差は止める（下のセクションに干渉しない）
    const inHero = scrollY < h * 1.05;
    layers.forEach((l) => {
      const dx = inHero ? pointer.nx * l.px : 0;
      const dy = scrollY * l.speed + (inHero ? pointer.ny * l.px * 0.5 : 0);
      l.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      l.el.style.opacity = String(Math.max(0, 1 - p * l.fade));
    });
  };

  const onScroll = (y) => { scrollY = y; apply(); };
  if (lenis && lenis.on) lenis.on("scroll", (e) => onScroll(e.scroll || window.scrollY || 0));
  window.addEventListener("scroll", () => onScroll(window.scrollY || 0), { passive: true });

  // ポインタ追従はなめらかに常時更新（ヒーロー表示中のみ）
  const loop = () => {
    if (scrollY < (hero.offsetHeight || window.innerHeight) * 1.05) apply();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  apply();
}
