(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const body = document.body;
  const header = document.getElementById("header");
  const progress = document.getElementById("scrollProgress");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let scrollTicking = false;

  function updateScrollState() {
    const y = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(Math.max(y / scrollable, 0), 1) : 0;

    if (header) {
      header.classList.toggle("is-scrolled", y > 20);
    }

    if (progress) {
      progress.style.transform = "scaleX(" + ratio + ")";
    }

    scrollTicking = false;
  }

  function onScroll() {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScrollState();

  function closeNav(restoreFocus) {
    if (!navToggle) {
      return;
    }

    body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "メニューを開く");

    if (restoreFocus) {
      navToggle.focus();
    }
  }

  function openNav() {
    if (!navToggle || !nav) {
      return;
    }

    body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "メニューを閉じる");

    const firstLink = nav.querySelector("a");
    if (firstLink) {
      window.requestAnimationFrame(function () {
        firstLink.focus();
      });
    }
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      if (body.classList.contains("nav-open")) {
        closeNav(true);
      } else {
        openNav();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeNav(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.classList.contains("nav-open")) {
        closeNav(true);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && body.classList.contains("nav-open")) {
        closeNav(false);
      }
    });
  }

  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(function (element) {
      element.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.06
      }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const navTargets = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navTargets.length) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          navLinks.forEach(function (link) {
            const current = link.getAttribute("href") === "#" + entry.target.id;
            if (current) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      {
        rootMargin: "-34% 0px -58% 0px",
        threshold: 0
      }
    );

    navTargets.forEach(function (target) {
      sectionObserver.observe(target);
    });
  }

  const videos = Array.from(document.querySelectorAll("video"));
  videos.forEach(function (video) {
    video.addEventListener("play", function () {
      videos.forEach(function (otherVideo) {
        if (otherVideo !== video && !otherVideo.paused) {
          otherVideo.pause();
        }
      });
    });
  });

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMsg");

  function createInquiryText(form) {
    const fields = [
      ["お名前", form.elements.name.value.trim()],
      ["メールアドレス", form.elements.email.value.trim()],
      ["電話番号", form.elements.tel.value.trim()],
      ["ご希望シーン", form.elements.scene.value.trim()],
      ["候補日", form.elements.date.value.trim()],
      ["相談内容", form.elements.message.value.trim()]
    ];

    const lines = fields.map(function (field) {
      return field[0] + "：" + (field[1] || "未入力");
    });

    return ["【マジシャンKOKI 出演相談】", "", ...lines].join("\n");
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Continue to the selection-based fallback.
      }
    }

    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.left = "-9999px";
    temporary.style.top = "0";
    body.appendChild(temporary);
    temporary.focus();
    temporary.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    temporary.remove();
    return copied;
  }

  function showManualCopy(text) {
    if (!contactForm) {
      return;
    }

    let output = contactForm.querySelector(".copy-output");
    if (!output) {
      output = document.createElement("textarea");
      output.className = "copy-output";
      output.readOnly = true;
      output.setAttribute("aria-label", "コピー用の相談内容");
      contactForm.appendChild(output);
    }

    output.value = text;
    output.hidden = false;
    output.focus();
    output.select();
  }

  if (contactForm && formMessage) {
    contactForm.addEventListener("input", function () {
      formMessage.textContent = "";
      formMessage.classList.remove("is-error");

      const output = contactForm.querySelector(".copy-output");
      if (output) {
        output.hidden = true;
      }
    });

    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        formMessage.textContent = "必須項目をご確認ください。";
        formMessage.classList.add("is-error");
        return;
      }

      const inquiryText = createInquiryText(contactForm);
      const copied = await copyText(inquiryText);

      if (copied) {
        formMessage.textContent = "相談内容をコピーしました。InstagramのDMへ貼り付けてお送りください。";
        formMessage.classList.remove("is-error");

        const output = contactForm.querySelector(".copy-output");
        if (output) {
          output.hidden = true;
        }
      } else {
        formMessage.textContent = "自動コピーができなかったため、下の文章を選択してコピーしてください。";
        formMessage.classList.add("is-error");
        showManualCopy(inquiryText);
      }
    });
  }
})();
