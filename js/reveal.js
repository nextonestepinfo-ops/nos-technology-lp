// reveal.js : テキスト分割リビール / スクロール表示 / ヘッダー状態 / マーキー
import { prefersReducedMotion } from "./utils.js";

// 要素の中身を行マスク用にラップ（overflow:hidden の中で持ち上げる）
function wrapLine(el) {
  el.classList.add("reveal-line");
  el.innerHTML = `<span class="reveal-line__inner">${el.innerHTML}</span>`;
}

// テキストを1文字ずつマスク用spanに分割（日本語は語の区切りがないため文字単位）
function splitWords(el) {
  const chars = Array.from(el.textContent);
  el.textContent = "";
  chars.forEach((ch, i) => {
    if (ch === " ") {
      el.appendChild(document.createTextNode(" "));
      return;
    }
    const outer = document.createElement("span");
    outer.className = "reveal-word";
    const inner = document.createElement("span");
    inner.className = "reveal-word__inner";
    inner.style.setProperty("--wi", String(i));
    inner.textContent = ch;
    outer.appendChild(inner);
    el.appendChild(outer);
  });
}

// data-reveal 要素を準備し、ビューポート進入で is-in を付与
export function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");

  // 事前にテキストを分割しておく
  items.forEach((el) => {
    const mode = el.getAttribute("data-reveal");
    if (prefersReducedMotion) return;
    if (mode === "line") wrapLine(el);
    if (mode === "words") splitWords(el);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
}

// ヘッダー：スクロール量で背景を出す
export function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// マーキー：内容を複製して無限ループ。スクロール速度で少し加速させる
export function initMarquee(track, lenis) {
  if (!track || prefersReducedMotion) return;

  // 複製して途切れない帯にする
  track.innerHTML += track.innerHTML;
  const half = track.scrollWidth / 2;

  let offset = 0;
  let velocity = 0;
  if (lenis) lenis.on("scroll", (e) => (velocity = e.velocity || 0));

  function loop() {
    // 基本速度 + スクロール速度ぶんの加速
    offset += 0.5 + Math.abs(velocity) * 0.4;
    if (offset >= half) offset -= half;
    track.style.transform = `translateX(${-offset}px)`;
    velocity *= 0.9;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
