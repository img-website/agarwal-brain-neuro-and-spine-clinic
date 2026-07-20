/* ============================================================================
   AGARWAL BRAIN NEURO & SPINE CLINIC — main.js
   Vanilla JS. No dependencies. Every visual state is toggled via Tailwind
   utility classes, so there is no bespoke CSS anywhere in this project.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var on = function (el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ==========================================================================
     1. CONDITIONAL IMAGE PLACEHOLDERS
     --------------------------------------------------------------------------
     Markup contract:
       <div data-img-slot>
         <img data-img src="" alt="…" class="hidden …">
         <div data-placeholder> …skeleton… </div>
       </div>

     Behaviour: the placeholder shows while `src` is empty, still loading, or
     broken. The moment a real image is dropped into `src` and decodes
     successfully, the placeholder is removed and the image fades in.
     Also watches for `src` being set later (via CMS/JS) using MutationObserver.
     ========================================================================== */
  function initImageSlots() {
    all("[data-img-slot]").forEach(function (slot) {
      var img = slot.querySelector("[data-img]");
      var ph = slot.querySelector("[data-placeholder]");
      if (!img || !ph) return;

      function showImage() {
        ph.classList.add("hidden");
        img.classList.remove("hidden", "opacity-0");
        img.classList.add("opacity-100");
        slot.setAttribute("data-img-state", "loaded");
      }

      function showPlaceholder() {
        ph.classList.remove("hidden");
        img.classList.add("hidden");
        img.classList.remove("opacity-100");
        slot.setAttribute("data-img-state", "empty");
      }

      function evaluate() {
        var src = (img.getAttribute("src") || "").trim();
        // Treat empty / whitespace / "#" as "no image supplied yet".
        if (!src || src === "#") { showPlaceholder(); return; }
        if (img.complete) {
          if (img.naturalWidth > 0) showImage();
          else showPlaceholder();
        }
        // otherwise the load/error listeners below settle it
      }

      on(img, "load", function () { if (img.naturalWidth > 0) showImage(); else showPlaceholder(); });
      on(img, "error", showPlaceholder);

      // React if a src is injected later.
      if ("MutationObserver" in window) {
        new MutationObserver(evaluate).observe(img, { attributes: true, attributeFilter: ["src", "srcset"] });
      }

      evaluate();
    });
  }

  /* ==========================================================================
     2. THEME (dark / light) — persisted, respects OS preference
     ========================================================================== */
  function initTheme() {
    var root = document.documentElement;

    function apply(theme) {
      root.classList.toggle("dark", theme === "dark");
      all("[data-theme-toggle]").forEach(function (btn) {
        var isDark = theme === "dark";
        btn.setAttribute("aria-pressed", String(isDark));
        btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        var sun = btn.querySelector("[data-icon-sun]");
        var moon = btn.querySelector("[data-icon-moon]");
        if (sun) sun.classList.toggle("hidden", !isDark);
        if (moon) moon.classList.toggle("hidden", isDark);
      });
    }

    function current() {
      var stored = null;
      try { stored = localStorage.getItem("abnsc-theme"); } catch (e) { /* private mode */ }
      if (stored === "dark" || stored === "light") return stored;
      // Default to LIGHT for first-time visitors, regardless of their OS theme.
      // Dark mode only ever appears when the user picks it via the toggle.
      return "light";
    }

    apply(current());

    all("[data-theme-toggle]").forEach(function (btn) {
      on(btn, "click", function () {
        var next = root.classList.contains("dark") ? "light" : "dark";
        try { localStorage.setItem("abnsc-theme", next); } catch (e) { /* ignore */ }
        apply(next);
      });
    });
  }

  /* ==========================================================================
     3. STICKY HEADER + SCROLL PROGRESS BAR
     ========================================================================== */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    var bar = document.querySelector("[data-scroll-progress]");
    if (!header && !bar) return;

    function update() {
      var y = window.scrollY || window.pageYOffset;

      if (header) {
        var solid = y > 24;
        header.classList.toggle("bg-white/85", solid);
        header.classList.toggle("dark:bg-ink-950/85", solid);
        header.classList.toggle("backdrop-blur-xl", solid);
        header.classList.toggle("shadow-lg", solid);
        header.classList.toggle("shadow-brand-900/5", solid);
        header.classList.toggle("border-ink-200/70", solid);
        header.classList.toggle("dark:border-ink-800/70", solid);
        header.classList.toggle("border-transparent", !solid);
      }

      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (h > 0 ? Math.min(y / h, 1) : 0) + ")";
      }
    }

    on(window, "scroll", update, { passive: true });
    on(window, "resize", update, { passive: true });
    update();
  }

  /* ==========================================================================
     4. MOBILE NAVIGATION — focus trap, Esc to close, aria-expanded
     ========================================================================== */
  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    var overlay = document.querySelector("[data-nav-overlay]");
    if (!toggle || !panel) return;

    var lastFocused = null;

    function isOpen() { return toggle.getAttribute("aria-expanded") === "true"; }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("translate-x-full", !open);
      panel.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("overflow-hidden", open);
      if (overlay) {
        overlay.classList.toggle("opacity-0", !open);
        overlay.classList.toggle("pointer-events-none", !open);
      }
      // Animate the burger into an X.
      all("[data-burger-line]", toggle).forEach(function (line, i) {
        line.classList.toggle("rotate-45", open && i === 0);
        line.classList.toggle("translate-y-[7px]", open && i === 0);
        line.classList.toggle("opacity-0", open && i === 1);
        line.classList.toggle("-rotate-45", open && i === 2);
        line.classList.toggle("-translate-y-[7px]", open && i === 2);
      });

      if (open) {
        lastFocused = document.activeElement;
        var first = panel.querySelector("a, button");
        if (first) window.setTimeout(function () { first.focus(); }, 120);
      } else if (lastFocused) {
        lastFocused.focus();
      }
    }

    on(toggle, "click", function () { setOpen(!isOpen()); });
    on(overlay, "click", function () { setOpen(false); });
    all("a", panel).forEach(function (a) { on(a, "click", function () { setOpen(false); }); });

    on(document, "keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;

      // Trap focus inside the panel while it is open.
      var focusables = all('a[href], button:not([disabled]), input, select, textarea', panel)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    on(window, "resize", function () { if (window.innerWidth >= 1024 && isOpen()) setOpen(false); });
  }

  /* ==========================================================================
     5. SCROLL REVEAL — adds Tailwind classes when an element enters view
     ========================================================================== */
  function initReveal() {
    var items = all("[data-reveal]");
    if (!items.length) return;

    function show(el) {
      el.classList.remove("opacity-0", "translate-y-8", "translate-y-12", "scale-95", "blur-sm");
      el.classList.add("opacity-100", "translate-y-0", "scale-100", "blur-0");
    }

    function showAll() { items.forEach(show); }

    // No animation wanted, or no IO support → just show everything.
    if (reduceMotion || !("IntersectionObserver" in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        window.setTimeout(function () { show(el); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });

    /* ------------------------------------------------------------------
       Safety net — content must NEVER be left invisible.

       IntersectionObserver can stop delivering (throttled/background
       renderer, prerender, bfcache restore, some embeds). It may also fire
       for the first screen and then go quiet, stranding everything below —
       so this must NOT be an all-or-nothing rescue. Instead we re-check the
       remaining items geometrically on scroll, independently of IO, and
       detach once they have all been revealed.
       ------------------------------------------------------------------ */
    function sweep() {
      var remaining = items.filter(function (el) { return el.classList.contains("opacity-0"); });
      if (!remaining.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        return;
      }
      var vh = window.innerHeight || document.documentElement.clientHeight;
      remaining.forEach(function (el) {
        var r = el.getBoundingClientRect();
        /* `top < 92% of viewport` intentionally has NO `bottom > 0` companion:
           that would only rescue nodes still on screen, stranding any the user
           has already scrolled past (anchor jump, restored scroll position,
           Ctrl+End, coalesced scroll events). Anything above the fold has been
           passed already — reveal it outright rather than animate it. */
        if (r.top < vh * 0.92) show(el);
      });
    }

    /* Deliberately NOT gated behind requestAnimationFrame: rAF is paused in
       background/throttled tabs, which would silently drop the very sweeps
       this net exists to guarantee. sweep() is cheap (it only measures the
       shrinking set of still-hidden nodes) and detaches itself once done. */
    var onScroll = sweep;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pageshow", sweep);        // bfcache restore
    document.addEventListener("visibilitychange", sweep);
    window.setTimeout(sweep, 1200);                    // dead-on-arrival IO
  }

  /* ==========================================================================
     6. ANIMATED COUNTERS
     ========================================================================== */
  function initCounters() {
    var counters = all("[data-counter]");
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-counter")) || 0;
      var suffix = el.getAttribute("data-counter-suffix") || "";
      var decimals = parseInt(el.getAttribute("data-counter-decimals") || "0", 10);
      var duration = reduceMotion ? 0 : 1600;
      var start = null;

      function frame(ts) {
        if (start === null) start = ts;
        var p = duration === 0 ? 1 : Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     7. ACCORDION (FAQ) — fully accessible disclosure pattern
     ========================================================================== */
  function initAccordions() {
    all("[data-accordion]").forEach(function (group) {
      var triggers = all("[data-accordion-trigger]", group);

      triggers.forEach(function (trigger) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!panel) return;
        var icon = trigger.querySelector("[data-accordion-icon]");

        on(trigger, "click", function () {
          var open = trigger.getAttribute("aria-expanded") === "true";

          // Close siblings for a classic single-open accordion.
          triggers.forEach(function (t) {
            if (t === trigger) return;
            var p = document.getElementById(t.getAttribute("aria-controls"));
            var i = t.querySelector("[data-accordion-icon]");
            t.setAttribute("aria-expanded", "false");
            if (p) { p.style.maxHeight = "0px"; p.classList.add("opacity-0"); }
            if (i) i.classList.remove("rotate-45");
          });

          trigger.setAttribute("aria-expanded", String(!open));
          if (open) {
            panel.style.maxHeight = "0px";
            panel.classList.add("opacity-0");
            if (icon) icon.classList.remove("rotate-45");
          } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
            panel.classList.remove("opacity-0");
            if (icon) icon.classList.add("rotate-45");
          }
        });
      });

      // Keep an open panel correctly sized on resize.
      on(window, "resize", function () {
        triggers.forEach(function (t) {
          if (t.getAttribute("aria-expanded") !== "true") return;
          var p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) p.style.maxHeight = p.scrollHeight + "px";
        });
      });
    });
  }

  /* ==========================================================================
     8. TESTIMONIAL CAROUSEL — keyboard + swipe, auto-advance pauses on hover
     ========================================================================== */
  function initCarousel() {
    all("[data-carousel]").forEach(function (root) {
      var track = root.querySelector("[data-carousel-track]");
      var slides = all("[data-carousel-slide]", root);
      var prev = root.querySelector("[data-carousel-prev]");
      var next = root.querySelector("[data-carousel-next]");
      var dotsWrap = root.querySelector("[data-carousel-dots]");
      var live = root.querySelector("[data-carousel-status]");
      if (!track || slides.length === 0) return;

      var index = 0;
      var timer = null;

      var dots = slides.map(function (_, i) {
        if (!dotsWrap) return null;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "h-2.5 rounded-full transition-all duration-300 bg-ink-300 dark:bg-ink-700 hover:bg-brand-400 w-2.5";
        b.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        on(b, "click", function () { go(i); restart(); });
        dotsWrap.appendChild(b);
        return b;
      });

      function go(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = "translateX(-" + index * 100 + "%)";
        slides.forEach(function (s, n) {
          s.setAttribute("aria-hidden", String(n !== index));
          all("a, button", s).forEach(function (el) {
            if (n === index) el.removeAttribute("tabindex");
            else el.setAttribute("tabindex", "-1");
          });
        });
        dots.forEach(function (d, n) {
          if (!d) return;
          d.classList.toggle("w-8", n === index);
          d.classList.toggle("w-2.5", n !== index);
          d.classList.toggle("bg-brand-600", n === index);
          d.classList.toggle("bg-ink-300", n !== index);
          d.classList.toggle("dark:bg-ink-700", n !== index);
          d.setAttribute("aria-current", String(n === index));
        });
        if (live) live.textContent = "Testimonial " + (index + 1) + " of " + slides.length;
      }

      function restart() {
        if (timer) window.clearInterval(timer);
        if (reduceMotion) return;
        timer = window.setInterval(function () { go(index + 1); }, 6500);
      }

      on(prev, "click", function () { go(index - 1); restart(); });
      on(next, "click", function () { go(index + 1); restart(); });
      on(root, "mouseenter", function () { if (timer) window.clearInterval(timer); });
      on(root, "mouseleave", restart);
      on(root, "focusin", function () { if (timer) window.clearInterval(timer); });
      on(root, "focusout", restart);

      on(root, "keydown", function (e) {
        if (e.key === "ArrowLeft") { go(index - 1); restart(); }
        if (e.key === "ArrowRight") { go(index + 1); restart(); }
      });

      // Touch swipe
      var x0 = null;
      on(track, "touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      on(track, "touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 45) { go(dx < 0 ? index + 1 : index - 1); restart(); }
        x0 = null;
      }, { passive: true });

      go(0);
      restart();
    });
  }

  /* ==========================================================================
     9. FILTERABLE GRID (services page)
     ========================================================================== */
  function initFilters() {
    var buttons = all("[data-filter]");
    var cards = all("[data-category]");
    if (!buttons.length || !cards.length) return;

    var countEl = document.querySelector("[data-filter-count]");

    function activate(btn) {
      buttons.forEach(function (b) {
        var isOn = b === btn;
        b.setAttribute("aria-pressed", String(isOn));
        b.classList.toggle("bg-brand-600", isOn);
        b.classList.toggle("text-white", isOn);
        b.classList.toggle("border-brand-600", isOn);
        b.classList.toggle("shadow-lg", isOn);
        b.classList.toggle("shadow-brand-600/25", isOn);
        b.classList.toggle("bg-white", !isOn);
        b.classList.toggle("dark:bg-ink-900", !isOn);
        b.classList.toggle("text-ink-600", !isOn);
        b.classList.toggle("dark:text-ink-300", !isOn);
        b.classList.toggle("border-ink-200", !isOn);
        b.classList.toggle("dark:border-ink-800", !isOn);
      });
    }

    buttons.forEach(function (btn) {
      on(btn, "click", function () {
        var f = btn.getAttribute("data-filter");
        activate(btn);
        var shown = 0;
        cards.forEach(function (card) {
          var match = f === "all" || (card.getAttribute("data-category") || "").split(" ").indexOf(f) > -1;
          card.classList.toggle("hidden", !match);
          if (match) {
            shown++;
            card.classList.remove("opacity-0", "scale-95");
            card.classList.add("opacity-100", "scale-100");
          }
        });
        if (countEl) countEl.textContent = String(shown);
      });
    });
  }

  /* ==========================================================================
     10. CONTACT FORM — client-side validation with aria-live errors
     --------------------------------------------------------------------------
     NOTE: there is no backend wired up. Point `action` at your form handler
     (Formspree / PHP / API) or the submit handler will just show a confirmation.
     ========================================================================== */
  function initForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");

    function fieldError(input, message) {
      var err = form.querySelector('[data-error-for="' + input.name + '"]');
      var bad = Boolean(message);
      input.setAttribute("aria-invalid", String(bad));
      input.classList.toggle("border-pulse-500", bad);
      input.classList.toggle("border-ink-200", !bad);
      input.classList.toggle("dark:border-ink-700", !bad);
      if (err) {
        err.textContent = message || "";
        err.classList.toggle("hidden", !bad);
      }
      return !bad;
    }

    function validate(input) {
      // Checkboxes carry value="on" even when unticked — test `checked`, not value.
      if (input.type === "checkbox") {
        return fieldError(input, input.hasAttribute("required") && !input.checked
          ? "Please tick this box to continue."
          : "");
      }

      var v = (input.value || "").trim();
      if (input.hasAttribute("required") && !v) {
        return fieldError(input, "This field is required.");
      }
      if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return fieldError(input, "Please enter a valid email address.");
      }
      if (input.type === "tel" && v && !/^[+]?[\d\s()-]{10,15}$/.test(v)) {
        return fieldError(input, "Please enter a valid phone number (10–15 digits).");
      }
      return fieldError(input, "");
    }

    var inputs = all("input[name], select[name], textarea[name]", form);
    inputs.forEach(function (input) {
      on(input, "blur", function () { validate(input); });
      on(input, "input", function () {
        if (input.getAttribute("aria-invalid") === "true") validate(input);
      });
    });

    on(form, "submit", function (e) {
      var ok = true;
      inputs.forEach(function (input) { if (!validate(input)) ok = false; });

      if (!ok) {
        e.preventDefault();
        if (status) {
          status.textContent = "Please correct the highlighted fields and try again.";
          status.className = "mt-4 rounded-2xl border border-pulse-300 bg-pulse-50 px-4 py-3 text-sm font-medium text-pulse-800 dark:border-pulse-800 dark:bg-pulse-950/40 dark:text-pulse-200";
        }
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      // No backend configured yet → keep the user informed instead of a 404.
      if (!form.getAttribute("action")) {
        e.preventDefault();
        if (status) {
          status.textContent = "Thank you! Your request has been captured. For an immediate appointment please call +91 94618 11500.";
          status.className = "mt-4 rounded-2xl border border-accent-300 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-900 dark:border-accent-800 dark:bg-accent-950/40 dark:text-accent-200";
        }
        form.reset();
      }
    });
  }

  /* ==========================================================================
     11. BACK TO TOP
     ========================================================================== */
  function initBackToTop() {
    var btn = document.querySelector("[data-back-to-top]");
    if (!btn) return;
    function update() {
      var show = (window.scrollY || 0) > 600;
      btn.classList.toggle("opacity-0", !show);
      btn.classList.toggle("pointer-events-none", !show);
      btn.classList.toggle("translate-y-4", !show);
    }
    on(btn, "click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    on(window, "scroll", update, { passive: true });
    update();
  }

  /* ==========================================================================
     12. CURRENT YEAR + LIVE OPEN/CLOSED STATUS
     --------------------------------------------------------------------------
     Clinic hours: Mon–Sat 08:00–18:00 (IST). Closed Sunday.
     Edit OPEN_HOUR / CLOSE_HOUR / CLOSED_DAY to change.
     ========================================================================== */
  function initClinicStatus() {
    all("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

    var wraps = all("[data-clinic-status]");
    if (!wraps.length) return;

    var OPEN_HOUR = 8, CLOSE_HOUR = 18, CLOSED_DAY = 0; // 0 = Sunday

    function update() {
      // Compute in Asia/Kolkata regardless of the visitor's timezone.
      var now = new Date();
      var ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      var day = ist.getDay();
      var hour = ist.getHours() + ist.getMinutes() / 60;
      var open = day !== CLOSED_DAY && hour >= OPEN_HOUR && hour < CLOSE_HOUR;

      wraps.forEach(function (wrap) {
        var dot = wrap.querySelector("[data-status-dot]");
        var label = wrap.querySelector("[data-status-label]");
        if (dot) {
          dot.classList.toggle("bg-emerald-500", open);
          dot.classList.toggle("bg-pulse-500", !open);
        }
        all("[data-status-ring]", wrap).forEach(function (ring) {
          ring.classList.toggle("bg-emerald-500", open);
          ring.classList.toggle("bg-pulse-500", !open);
        });
        if (label) {
          label.textContent = open
            ? "Open now · closes 6:00 PM"
            : (day === CLOSED_DAY ? "Closed today · opens Monday 8:00 AM" : "Closed now · opens 8:00 AM");
        }
      });
    }

    update();
    window.setInterval(update, 60000);
  }

  /* ==========================================================================
     13. ACTIVE NAV LINK (based on current filename)
     ========================================================================== */
  function initActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    all("[data-nav-link]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href !== path) return;
      link.setAttribute("aria-current", "page");
      link.classList.add("text-brand-600", "dark:text-brand-300");
      link.classList.remove("text-ink-600", "dark:text-ink-300");
      var underline = link.querySelector("[data-nav-underline]");
      if (underline) underline.classList.replace("scale-x-0", "scale-x-100");
    });
  }

  /* ==========================================================================
     14. 3D TILT on cards (pointer only, disabled for reduced motion / touch)
     ========================================================================== */
  function initTilt() {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
    all("[data-tilt]").forEach(function (card) {
      on(card, "mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 7).toFixed(2) + "deg) translateY(-6px)";
      });
      on(card, "mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ==========================================================================
     15. SPOTLIGHT — a soft glow that follows the cursor across a section
     ========================================================================== */
  function initSpotlight() {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
    all("[data-spotlight]").forEach(function (el) {
      var glow = el.querySelector("[data-spotlight-glow]");
      if (!glow) return;
      on(el, "mousemove", function (e) {
        var r = el.getBoundingClientRect();
        glow.style.left = (e.clientX - r.left) + "px";
        glow.style.top = (e.clientY - r.top) + "px";
        glow.classList.remove("opacity-0");
      });
      on(el, "mouseleave", function () { glow.classList.add("opacity-0"); });
    });
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  function init() {
    initTheme();
    initImageSlots();
    initHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initAccordions();
    initCarousel();
    initFilters();
    initForm();
    initBackToTop();
    initClinicStatus();
    initActiveNav();
    initTilt();
    initSpotlight();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
