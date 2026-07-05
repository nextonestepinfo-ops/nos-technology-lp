// reveal.js : テキスト分割リビール / スクロール表示 / ヘッダー状態 / マーキー
import { prefersReducedMotion } from "./utils.js";

// 要素の中身を行マスク用にラップ（overflow:hidden の中で持ち上げる）
function wrapLine(el) {
  el.classList.add("reveal-line");
  el.innerHTML = `<span class="reveal-line__inner">${el.innerHTML}</span>`;
}

// テキストを1文字ずつマスク用spanに分割してアニメさせる。
// 折返しは「文節」（句読点区切り）単位＝1文字ずつのinline-blockだと
// 禁則を無視した語中改行が起きるため、文節をinline-blockで包む。
// <em>等の子要素はタグごと保持（グラデ装飾を壊さない）。
function splitWords(el) {
  let wi = 0;
  const makeChar = (ch) => {
    const outer = document.createElement("span");
    outer.className = "reveal-word";
    const inner = document.createElement("span");
    inner.className = "reveal-word__inner";
    inner.style.setProperty("--wi", String(wi++));
    inner.textContent = ch;
    outer.appendChild(inner);
    return outer;
  };
  // 句読点の直後で文節を区切る
  const fillPhrases = (parent, text) => {
    text.split(/(?<=[、。・！？…])/).forEach((ph) => {
      if (!ph) return;
      const wrap = document.createElement("span");
      wrap.className = "reveal-phrase";
      Array.from(ph).forEach((ch) => {
        if (ch === " ") wrap.appendChild(document.createTextNode(" "));
        else wrap.appendChild(makeChar(ch));
      });
      parent.appendChild(wrap);
    });
  };
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      fillPhrases(frag, node.textContent);
    } else {
      // 要素（em等）はタグごと保持し、文字分割しない。
      // background-clip:text のグラデはtransform付き子スパンと相性が悪く
      // 文字が消えるため、要素全体をopacityフェードで出す。
      const clone = node.cloneNode(true);
      clone.classList.add("reveal-phrase", "reveal-em");
      clone.style.setProperty("--wi", String(wi));
      wi += (node.textContent || "").length;
      frag.appendChild(clone);
    }
  });
  el.textContent = "";
  el.appendChild(frag);
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

// ヘッダー：ヒーロー中は隠し、ヒーローを過ぎたら追従（is-stuck を付与）
export function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  const hero = document.querySelector(".hero");
  const onScroll = () => {
    const threshold = hero ? hero.offsetHeight - 90 : 80;
    header.classList.toggle("is-stuck", (window.scrollY || 0) > threshold);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// マーキー：複製して無限ループ＋ビュー進入で3D起き上がり出現（順次）
export function initMarquee(track, lenis) {
  if (!track) return;
  const wrap = track.closest(".marquee");

  if (prefersReducedMotion) { if (wrap) wrap.classList.add("in"); return; }

  // 複製して途切れない帯にする
  track.innerHTML += track.innerHTML;
  // 起き上がりのスタッガー用インデックス
  [...track.children].forEach((c, i) => c.style.setProperty("--ci", String(i)));

  // ビューに入ったら 3D 出現
  if (wrap && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { wrap.classList.add("in"); io.disconnect(); }
    }), { threshold: 0.12 });
    io.observe(wrap);
  } else if (wrap) {
    wrap.classList.add("in");
  }

  const half = track.scrollWidth / 2;
  let offset = 0;
  let velocity = 0;
  if (lenis) lenis.on("scroll", (e) => (velocity = e.velocity || 0));

  function loop() {
    offset += 0.5 + Math.abs(velocity) * 0.4;
    if (offset >= half) offset -= half;
    track.style.transform = `translateX(${-offset}px)`;
    velocity *= 0.9;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
