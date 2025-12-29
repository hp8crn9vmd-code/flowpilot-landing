/* FlowPilot Landing JS
   - Footer year
   - Lead form submission via Web3Forms
   - No secrets stored in repo: expects window.__WEB3FORMS_KEY__ to be injected at runtime
*/

(function () {
  "use strict";

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile Nav toggle (accessible)
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!navToggle || !navMenu) return;
    navMenu.hidden = true;
    navToggle.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    if (!navToggle || !navMenu) return;
    navMenu.hidden = false;
    navToggle.setAttribute("aria-expanded", "true");
  }

  function toggleMenu() {
    if (!navToggle || !navMenu) return;
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  }

  if (navToggle && navMenu) {
    // On desktop, keep menu visible; on mobile start closed
    const mq = window.matchMedia("(min-width: 840px)");
    const sync = () => {
      if (mq.matches) {
        navMenu.hidden = false;
        navToggle.setAttribute("aria-expanded", "false");
      } else {
        closeMenu();
      }
    };
    sync();
    mq.addEventListener?.("change", sync);

    navToggle.addEventListener("click", toggleMenu);

    // Close on outside click (mobile)
    document.addEventListener("click", (e) => {
      if (mq.matches) return;
      const t = e.target;
      if (!t) return;
      if (navMenu.contains(t) || navToggle.contains(t)) return;
      closeMenu();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Close when clicking a nav link
    navMenu.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        if (!mq.matches) closeMenu();
      });
    });
  }


  // Lead form
  const form = document.querySelector(".lead-form");
  const statusEl = document.querySelector(".form-status");

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.dataset.type = type || "info";
  }

  function disableForm(disabled) {
    if (!form) return;
    const fields = form.querySelectorAll("input, select, button, textarea");
    fields.forEach((el) => (el.disabled = !!disabled));
  }

  if (!form) return;

  // Add a honeypot field (basic bot mitigation)
  const hp = document.createElement("input");
  hp.type = "text";
  hp.name = "website";
  hp.autocomplete = "off";
  hp.tabIndex = -1;
  hp.style.position = "absolute";
  hp.style.left = "-9999px";
  hp.style.height = "1px";
  hp.style.width = "1px";
  form.appendChild(hp);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // bot check
    if (hp.value && hp.value.trim().length > 0) {
      setStatus("تم استلام الطلب.", "success"); // silently succeed for bots
      return;
    }

    const key = window.__WEB3FORMS_KEY__;
    if (!key) {
      setStatus("⚠️ مفتاح النموذج غير مُعد. سيتم تفعيله عند النشر.", "warn");
      return;
    }

    // Collect form data
    const fd = new FormData(form);
    fd.append("access_key", key);

    // Optional metadata
    fd.append("subject", "FlowPilot Lead — Trial Request");
    fd.append("from_name", "FlowPilot Landing");
    fd.append("replyto", fd.get("email") || "");

    setStatus("⏳ جاري الإرسال…", "info");
    disableForm(true);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.success) {
        setStatus("✅ تم إرسال طلبك بنجاح! سنعود لك قريبًا.", "success");
        form.reset();
      } else {
        const msg = (data && data.message) ? data.message : "حدث خطأ أثناء الإرسال.";
        setStatus("❌ " + msg, "error");
      }
    } catch (err) {
      setStatus("❌ تعذر الاتصال بالخدمة. حاول لاحقًا.", "error");
    } finally {
      disableForm(false);
    }
  });
})();
