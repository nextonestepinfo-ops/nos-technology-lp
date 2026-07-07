// main.js : 各モジュールの初期化エントリ
import { supportsWebGL } from "./utils.js";
import { initPreloader } from "./preloader.js";
import { initCursor, initMagnetic } from "./cursor.js";
import { initSmoothScroll } from "./smooth.js";
import { initReveal, initHeader, initMarquee } from "./reveal.js";
import { initShowcase } from "./showcase.js";
import { initContactForm } from "./contact.js";
import { initPalette } from "./palette.js";
import { initServiceOverlay } from "./service-overlay.js";
import { initFlowField } from "./flowfield.js";
import { initParallax } from "./parallax.js";
import { initBuildCinema } from "./build-cinema.js";
import { initEstimator } from "./estimator.js";
import { initMobileNav, initCtaBar } from "./nav.js";

// リロード時にブラウザが前回のスクロール位置を復元しないようにする（常にトップから開始）
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

async function boot() {
  // 0. 背景の流れる光（全体のアンビエント・モーション）
  initFlowField(document.getElementById("bgFlow"));

  // 1. カスタムカーソル＆マグネティック
  initCursor(document.getElementById("cursor"));
  initMagnetic();

  // 2. 慣性スクロール（失敗時は null = ネイティブ）
  const lenis = await initSmoothScroll();

  // 2b. リロードは常にトップから。ハッシュ指定（#contact 等）がある時だけそのアンカーへ。
  const hashTarget = location.hash && document.querySelector(location.hash);
  if (hashTarget) {
    if (lenis) lenis.scrollTo(hashTarget, { immediate: true }); else hashTarget.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }

  // 3. ヘッダー状態＋モバイルメニュー
  initHeader();
  initMobileNav();
  initCtaBar();

  // 4. ヒーロー：ハイブリッド3D（WebGL対応時のみ）
  await initHeroBackground(document.getElementById("heroCanvas"));

  // 4b. サービスページのシネマティック・ヒーロー（該当ページのみ）
  await initServiceHeroScene();

  // 4c. Introセクションの小3D（#introCanvas がある時のみ）
  await initIntroScene();

  // 5. 配色を確定適用（Aether固定。スイッチャーUIは廃止＝要素なしでも既定が適用される）
  initPalette(document.getElementById("paletteSwitch"));

  // 5b. 「トップへ戻る」ボタン（下スクロールで出現）
  initToTop(lenis);

  // 5c. ヒーローのスクロール視差（層ごとに速度差＋フェードで奥行き）
  initParallax(lenis);

  // 5e. Build Cinema（AIがあなたのサイトを組み上げる演出）
  initBuildCinema(lenis);

  // 5f. かんたん見積り（目安のライブ計算＋フォーム転記）
  initEstimator();

  // 6. マーキー（スクロール速度連動）
  initMarquee(document.getElementById("marquee"), lenis);

  // 7. Works：流れるサイト・ショーケース
  initShowcase(document.getElementById("worksShowcase"));

  // 8. 相談フォーム
  initContactForm(document.getElementById("contactForm"));

  // 8.5 Services のズームアップ詳細オーバーレイ
  initServiceOverlay();

  // 9. プリローダー完了後にリビール開始（ヒーローを隠れて再生させない）
  initPreloader(() => initReveal());
}

// 「トップへ戻る」ボタン：下へスクロールしたら出現、クリックで先頭へ慣性スクロール
function initToTop(lenis) {
  const btn = document.getElementById("toTop");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("is-show", (window.scrollY || window.pageYOffset || 0) > window.innerHeight * 0.7);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (lenis && lenis.on) lenis.on("scroll", onScroll);
  btn.addEventListener("click", () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Introセクションの小3D（#introCanvas がある時のみ。非対応時はCSS枠の背景が残る）
async function initIntroScene() {
  const c = document.getElementById("introCanvas");
  if (!c || !supportsWebGL()) return;
  try {
    const mod = await import("./intro-3d.js");
    mod.initIntro3D(c);
  } catch (err) {
    console.warn("Intro 3Dの初期化に失敗。", err);
  }
}

// サービスページのシネマティック・ヒーロー（#serviceHeroCanvas がある時のみ）
async function initServiceHeroScene() {
  const c = document.getElementById("serviceHeroCanvas");
  if (!c || !supportsWebGL()) return;
  try {
    const mod = await import("./service-hero.js");
    mod.initServiceHero(c, c.dataset.kind || "web");
  } catch (err) {
    console.warn("サービスヒーロー3Dの初期化に失敗。", err);
  }
}

// WebGL背景の初期化（動的importで、非対応時はThree.jsを読み込まない）
async function initHeroBackground(canvas) {
  if (!canvas || !supportsWebGL()) return;
  try {
    const mod = await import("./hero-hybrid.js");
    mod.initHeroHybrid(canvas);
  } catch (err) {
    // Three.jsの読込失敗など。CSSの背景がそのまま残る
    console.warn("ヒーロー3Dの初期化に失敗。CSS背景を使用します。", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
