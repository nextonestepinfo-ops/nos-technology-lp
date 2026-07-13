// nav.js : モバイル用ハンバーガーメニュー
// #menuBtn / #mnav がある全ページで動く。リンクtaps後は自動で閉じる。

export function initMobileNav() {
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("mnav");
  if (!btn || !nav) return;

  const setOpen = (open) => {
    btn.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

  // メニュー内リンクを押したら閉じる（同一ページアンカーでも遷移でも）
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setOpen(false))
  );

  // ESCで閉じる
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
  });
}

// 追従CTAバー（スマホ専用）：出現の閾値
//  - 没入シーン物語(.mstory)がある時は「物語を過ぎて実用ゾーンに入ってから」出す
//    （各シーンにCTAがあり、全画面の没入感をバーで削らないため）
//  - 無い時（サブページ等）は従来どおりヒーローを過ぎたら出す
export function initCtaBar() {
  const bar = document.getElementById("ctaBar");
  if (!bar) return;
  const story = document.querySelector(".mstory,.mtop");
  const threshold = () =>
    story && getComputedStyle(story).display !== "none"
      ? story.offsetHeight - window.innerHeight * 0.5
      : window.innerHeight * 0.55;
  const onScroll = () =>
    bar.classList.toggle("is-show", (window.scrollY || 0) > threshold());
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
