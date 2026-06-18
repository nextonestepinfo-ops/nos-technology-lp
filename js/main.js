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

async function boot() {
  // 1. カスタムカーソル＆マグネティック
  initCursor(document.getElementById("cursor"));
  initMagnetic();

  // 2. 慣性スクロール（失敗時は null = ネイティブ）
  const lenis = await initSmoothScroll();

  // 3. ヘッダー状態
  initHeader();

  // 4. ヒーロー：ハイブリッド3D（WebGL対応時のみ）
  await initHeroBackground(document.getElementById("heroCanvas"));

  // 4b. サービスページのシネマティック・ヒーロー（該当ページのみ）
  await initServiceHeroScene();

  // 5. 配色スイッチャー（AAAゲーム調パレット。中で色を切り替えられる）
  initPalette(document.getElementById("paletteSwitch"));

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
