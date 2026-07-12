// utils.js : 全モジュール共通のヘルパーと共有ポインター状態

// prefers-reduced-motion の判定（重い演出を止めるために各所で参照）
export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// タッチ主体の端末か（カスタムカーソル等を出さない判定に使う）
export const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

// スマホレイアウトか（CSSの @media(max-width:860px) と閾値を統一。
// 初回ロード時に確定させ、3Dパネル生成の有無などレイアウト分岐に使う）
export const isMobileLayout = window.matchMedia("(max-width: 860px)").matches;

// 値を範囲内に収める
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// 線形補間（滑らかな追従に使用）
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 0〜1へ正規化
export function norm(value, min, max) {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

// WebGLが使えるかを判定（使えない端末では静的背景にフォールバック）
export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

// 画面共有のポインター状態。x/y は実ピクセル、nx/ny は中心基準(-0.5〜0.5)
export const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  nx: 0,
  ny: 0,
};

// pointermove を一度だけ購読して共有状態を更新（複数モジュールで使い回す）
window.addEventListener(
  "pointermove",
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = e.clientX / window.innerWidth - 0.5;
    pointer.ny = e.clientY / window.innerHeight - 0.5;
  },
  { passive: true }
);
