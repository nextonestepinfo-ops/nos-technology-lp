/* =========================================================
   マジシャンKOKI 公式LP / main.js
   ヘッダー追従・モバイルメニュー・スクロール演出・静的フォーム
   ========================================================= */
(function () {
  "use strict";

  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  const body = document.body;
  const progress = document.getElementById("scrollProgress");
  const toTop = document.getElementById("toTop");
  const heroEl = document.querySelector(".hero");

  // ---- ローディング画面 → ヒーロー登場 ----
  // ゲートがある場合は解除時に gate.js から __startIntro() が呼ばれる。
  // ゲートが無い（認証済み or 本番）場合はここで開始する。
  var loader = document.getElementById("loader");
  var introStarted = false;
  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function finish() {
      window.scrollTo(0, 0); // ヒーロー表示時は最上部から
      document.body.classList.add("is-loaded");
      if (loader) {
        loader.classList.add("is-hidden");
        setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
      }
    }
    if (reduce) { finish(); return; }
    var minDone = false;
    var loadDone = document.readyState === "complete";
    setTimeout(function () { minDone = true; if (loadDone) finish(); }, 1300); // 最低表示時間
    if (!loadDone) window.addEventListener("load", function () { loadDone = true; if (minDone) finish(); });
    setTimeout(finish, 2800); // 安全策（読み込みが遅くても必ず進む）
  }
  window.__startIntro = startIntro;
  if (!window.__gateWillShow) startIntro(); // ゲートが出ないならすぐ開始

  // ---- ヘッダー追従・スクロール進捗・トップへ戻るの表示 ----
  // 毎フレーム処理を避けるため rAF で間引く
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      const y = window.scrollY;
      // ヒーローを過ぎてからヘッダーを表示（ヒーローの大きなKOKIとの重複を回避）
      const showHeader = heroEl ? y > heroEl.offsetHeight - 80 : y > 60;
      header.classList.toggle("is-visible", showHeader);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      }
      if (toTop) toTop.classList.toggle("is-show", y > window.innerHeight * 0.9);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- ページトップへ戻る ----
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---- モバイルメニュー開閉 ----
  function closeNav() {
    body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      const open = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  // メニュー内リンクをタップしたら閉じる
  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
  }
  // Escで閉じる
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  // ---- スクロール演出（IntersectionObserver） ----
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target); // 一度表示したら監視解除
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    // 非対応環境では全表示にフォールバック
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  // ---- ナビ現在地ハイライト（scroll-spy） ----
  const navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  const spyTargets = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  });
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            const i = spyTargets.indexOf(en.target);
            navLinks.forEach(function (a, j) {
              a.classList.toggle("is-current", j === i);
            });
          }
        });
      },
      { rootMargin: "-50% 0px -45% 0px" }
    );
    spyTargets.forEach(function (s) {
      if (s) spy.observe(s);
    });
  }

  // ---- フッターの年号 ----
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ---- 問い合わせフォーム：インライン検証＋送信状態 ----
  // TODO: 公開前に、送信先（フォームサービス / メール送信API）へ接続する。
  //       現状は送信を止め、入力チェック後に完了メッセージのみ表示する。
  const form = document.getElementById("contactForm");
  const formMsg = document.getElementById("formMsg");
  if (form) {
    const rules = [
      { id: "f-name", msg: "お名前をご入力ください。", test: function (v) { return v.trim() !== ""; } },
      { id: "f-email", msg: "正しいメールアドレスをご入力ください。", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } }
    ];

    // 各必須項目にエラー表示要素を用意し、入力で解除
    rules.forEach(function (r) {
      const input = document.getElementById(r.id);
      if (!input) return;
      const field = input.closest(".field");
      if (field && !field.querySelector(".field__err")) {
        const span = document.createElement("span");
        span.className = "field__err";
        span.textContent = r.msg;
        field.appendChild(span);
      }
      input.addEventListener("input", function () {
        if (field) field.classList.remove("has-error");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let firstError = null;
      rules.forEach(function (r) {
        const input = document.getElementById(r.id);
        if (!input) return;
        const field = input.closest(".field");
        const ok = r.test(input.value);
        if (field) field.classList.toggle("has-error", !ok);
        if (!ok && !firstError) firstError = input;
      });
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // TODO: ここで送信先へPOSTする（fetch等）。接続するまでは完了表示のみ。
      if (formMsg) {
        formMsg.classList.add("is-show");
        formMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }
})();
