# Agarwal Brain Neuro & Spine Clinic — Website

Marketing site for **Dr. Raju Agrawal** (MBBS, MD, DM Neurology, DrNB Neurology), Arya Nagar, Alwar.

Built with **Tailwind CSS v4** (CSS-first config). Five static HTML pages, one JS file, **zero hand-written component CSS**.

---

## Quick start

```bash
npm install        # once
npm run dev        # watch mode — rebuilds CSS as you edit
npm run build      # minified production build
```

Then open `index.html` (or serve the folder). **You must run a build after editing `src/input.css`** — the HTML loads the compiled `assets/css/style.css`, not the source.

---

## Change the colours — ONE place only

Everything lives in **`src/input.css`** inside the `@theme { … }` block. Edit a hex, run `npm run build`, and the whole site repaints.

```css
@theme {
  --color-brand-600: #4f46e5;   /* primary — buttons, links, headings */
  --color-accent-500: #06b6d4;  /* electric highlight — glows, gradients */
  --color-pulse-500: #f43f5e;   /* urgent / emergency only */
  --color-ink-900:  #0f172a;    /* neutral text & surfaces */
}
```

Four scales, each `50`→`950`:

| Scale | Used for |
|---|---|
| `brand-*` | Primary identity — CTAs, links, active states |
| `accent-*` | Secondary highlight — gradients, glows |
| `pulse-*` | Emergency/urgent callouts and form errors |
| `ink-*` | Text, borders, backgrounds (light + dark) |

Fonts and animations are configured in the same block (`--font-display`, `--animate-float`, …).

> Tailwind v4 has **no `tailwind.config.js`** — the CSS `@theme` block *is* the config. That's why there is no JS config file here.

---

## Images — conditional placeholders

Every image is wrapped in a slot. **The placeholder shows automatically while `src` is empty, still loading, or broken — and disappears the instant a real image decodes.** No code change needed; just paste the path.

```html
<div data-img-slot class="relative aspect-[4/5] w-full">
  <img data-img src="" alt="Describe the image">   <!-- ← put the path in src -->
  <div data-placeholder> …skeleton… </div>
</div>
```

Behaviour is verified for all four states: empty → shows placeholder · valid → shows image · **broken → falls back to placeholder** · src removed → back to placeholder. A `MutationObserver` also catches a `src` injected later by JS/CMS.

**Images still needed:** doctor portrait (`index.html`, `about.html`), clinic interior (`index.html`, `about.html`), and `assets/images/og-cover.jpg` for social sharing.

---

## Testimonials — read this before publishing

`testimonials.html` deliberately contains **no invented patient quotes.** Each slide is an empty placeholder, and **no `AggregateRating` schema is emitted.**

Fabricated reviews on a medical site are deceptive and breach Google's structured-data policy plus India's advertising/consumer rules (ASCI, CCPA endorsement guidelines). To publish a real one:

1. Get the patient's **explicit written consent**.
2. Replace the `<div data-testimonial-placeholder>` block with the real quote + first name and initial.
3. Only once genuine reviews are live on the page, add `AggregateRating` markup that **matches them exactly**.

The page currently drives visitors to independent platforms (Justdial, Practo, Google, Facebook) where reviews can't be edited by the clinic — which is both honest and better for local SEO.

---

## Contact form — needs a backend

`contact.html` validates fully client-side but **has no `action`**, so nothing is emailed yet. Until one is set, it shows a "please call us" confirmation.

To connect it, add an action to the `<form data-contact-form>` tag:

```html
<form data-contact-form action="https://formspree.io/f/YOUR_ID" method="POST" novalidate>
```

Any handler works (Formspree, Web3Forms, a PHP script, an API route).

---

## Structure

```
├── src/input.css          ← DESIGN SYSTEM — colours, fonts, animations (edit here)
├── assets/
│   ├── css/style.css      ← compiled output (generated — never edit by hand)
│   ├── js/main.js         ← all behaviour, vanilla JS, no dependencies
│   └── images/            ← favicon.svg + your photos
├── index.html  about.html  services.html  testimonials.html  contact.html
└── package.json
```

### What `main.js` handles
Image placeholders · dark/light theme (persisted) · sticky header + scroll progress · mobile nav (focus trap, Esc, `aria-expanded`) · scroll reveal · counters · FAQ accordion · testimonial carousel (keyboard + swipe) · service filtering · form validation · back-to-top · **live open/closed clinic status** · active nav link · 3D tilt · cursor spotlight.

---

## Clinic hours are computed live

The "Open now / Closed" badge is calculated in **Asia/Kolkata**, so it's correct regardless of the visitor's timezone. To change the hours, edit the constants in `main.js` → `initClinicStatus()`:

```js
var OPEN_HOUR = 8, CLOSE_HOUR = 18, CLOSED_DAY = 0;  // 0 = Sunday
```

Also update the visible text in the footer/contact page and the `openingHoursSpecification` in the JSON-LD.

---

## Accessibility

WCAG-minded throughout: skip link, landmarks, one `<h1>` per page, visible 3px focus rings, `aria-expanded`/`aria-controls`/`aria-current`, live regions for form + carousel status, labelled inputs with inline errors, `prefers-reduced-motion` honoured site-wide, and `noscript` fallbacks so content is never invisible without JS.

The **one** piece of raw CSS in the project is that `<noscript>` rule — a Tailwind utility cannot express "undo the reveal animation when JS is off", and without it the page would be blank for no-JS users and some crawlers.

---

## Before going live

- [ ] Add the doctor + clinic photos, and `og-cover.jpg`
- [ ] Replace `https://agarwalneuroclinic.com/` in every `canonical` / `og:` / JSON-LD `@id` with the real domain
- [ ] Wire the contact form to a real handler
- [ ] Add real testimonials (with consent) — see above
- [ ] **Confirm the consultation hours** (see note below) and the ₹300–₹500 fee
- [ ] Add a logo (currently a text lockup + SVG brain mark in the header)

### ⚠️ Hours discrepancy to resolve
Sources disagree, so please confirm which is correct:
- **Mon–Sat, 8:00 AM – 6:00 PM, closed Sunday** ← currently used across the site
- **Mon–Sun, 8:00–10:00 AM and 2:00–7:00 PM** (a split shift listed on the clinic's own herei.in card)

If it's the split shift, update the footer text, `contact.html`, the JSON-LD, and `initClinicStatus()` in `main.js`.

---

## Sources used for the content

Details were compiled from public listings: [Justdial](https://www.justdial.com/Alwar/Dr-Raju-Agrawal-Near-Supreme-Hospital-ARYA-NAGAR/9999PX144-X144-230322130405-Q1Z7_BZDET), [Practo](https://www.practo.com/alwar/doctor/raju-agrawal-neurologist), [herei.in digital card](https://herei.in/me/bc168.html), and the [clinic's Facebook page](https://www.facebook.com/p/Agrawal-Neuro-Spine-Clinic-Alwar-100087015129656/). **Please have Dr. Agrawal verify all clinical claims and credentials before launch.**
