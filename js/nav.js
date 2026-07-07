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

// 追従CTAバー（サービスページ・スマホ専用）：ヒーローを過ぎたら出現
export function initCtaBar() {
  const bar = document.getElementById("ctaBar");
  if (!bar) return;
  const onScroll = () =>
    bar.classList.toggle("is-show", (window.scrollY || 0) > window.innerHeight * 0.55);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
