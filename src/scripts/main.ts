/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN.TS — Client-side interactivity (TypeScript, zero deps)
 * Ported from Jekyll's main.js with type safety
 *
 * Features:
 * - Dark mode toggle with localStorage
 * - Mobile menu + search panel
 * - TOC active state tracking (Intersection Observer)
 * - Reading progress bar
 * - Auto-generated TOC from headings
 * - Affiliate click tracking (GA4)
 * - External link handler
 * ═══════════════════════════════════════════════════════════════
 */

// ── Dark Mode ──────────────────────────────────────────────
const themeToggle = document.getElementById("theme-toggle");
const root = document.documentElement;

function setTheme(theme: string) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  setTheme(savedTheme);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setTheme("dark");
}

themeToggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

// ── Mobile Menu ────────────────────────────────────────────
const mobileToggle = document.getElementById("mobile-menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

mobileToggle?.addEventListener("click", () => {
  if (!mobileMenu) return;
  const isOpen = !mobileMenu.hidden;
  mobileMenu.hidden = isOpen;
  mobileToggle.setAttribute("aria-expanded", String(!isOpen));
  document.body.style.overflow = isOpen ? "" : "hidden";
});

// ── Search Panel ───────────────────────────────────────────
const searchToggle = document.getElementById("search-toggle");
const searchPanel = document.getElementById("search-panel");

searchToggle?.addEventListener("click", () => {
  if (!searchPanel) return;
  const isOpen = !searchPanel.hidden;
  searchPanel.hidden = isOpen;
  searchToggle.setAttribute("aria-expanded", String(!isOpen));
  if (!isOpen) {
    searchPanel.querySelector<HTMLInputElement>("input")?.focus();
  }
});

// ── Auto-generate TOC from article headings ────────────────
const tocContainer = document.getElementById("toc-list");
const articleBody = document.querySelector(".article__body");

if (tocContainer && articleBody) {
  const headings = articleBody.querySelectorAll<HTMLElement>("h2, h3");
  if (headings.length > 0) {
    const list = document.createElement("ol");
    list.className = "toc__list";
    list.setAttribute("role", "list");

    let counter = 0;
    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ?? `heading-${counter}`;
      }
      counter++;

      const li = document.createElement("li");
      li.className = `toc__item toc__item--${heading.tagName.toLowerCase()}`;

      const a = document.createElement("a");
      a.href = `#${heading.id}`;
      a.className = "toc__link";
      a.setAttribute("data-toc-target", heading.id);
      a.textContent = heading.textContent ?? "";

      li.appendChild(a);
      list.appendChild(li);
    });

    tocContainer.appendChild(list);
  }
}

// ── TOC Active State Tracking (Intersection Observer) ──────
const tocLinks = document.querySelectorAll<HTMLAnchorElement>(
  ".toc__link[data-toc-target]"
);

if (tocLinks.length > 0) {
  const headings: HTMLElement[] = [];
  tocLinks.forEach((link) => {
    const target = document.getElementById(link.dataset.tocTarget ?? "");
    if (target) headings.push(target);
  });

  if (headings.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((l) => l.classList.remove("is-active"));
            const activeLink = document.querySelector<HTMLAnchorElement>(
              `.toc__link[data-toc-target="${entry.target.id}"]`
            );
            activeLink?.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
  }
}

// ── Sidebar TOC Population ─────────────────────────────────
const sidebarToc = document.getElementById("sidebar-toc");
if (sidebarToc && articleBody) {
  const sidebarHeadings = articleBody.querySelectorAll<HTMLElement>("h2, h3");
  if (sidebarHeadings.length > 0) {
    const list = document.createElement("ul");
    list.className = "sidebar__toc-list";
    list.style.listStyle = "none";

    sidebarHeadings.forEach((h) => {
      if (h.id) {
        const li = document.createElement("li");
        li.className =
          h.tagName === "H3"
            ? "sidebar__toc-item sidebar__toc-item--sub"
            : "sidebar__toc-item";

        const a = document.createElement("a");
        a.href = `#${h.id}`;
        a.textContent = h.textContent ?? "";
        a.className = "sidebar__post-link";
        if (h.tagName === "H3") {
          a.style.paddingLeft = "1rem";
          a.style.fontSize = "0.75rem";
        }
        li.appendChild(a);
        list.appendChild(li);
      }
    });

    sidebarToc.appendChild(list);
  }
}

// ── Reading Progress Bar ───────────────────────────────────
if (articleBody) {
  const progressBar = document.createElement("div");
  progressBar.className = "reading-progress";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-label", "Reading progress");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");

  Object.assign(progressBar.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "3px",
    background: "var(--color-primary)",
    zIndex: "9999",
    transition: "width 100ms linear",
    width: "0%",
  });

  document.body.appendChild(progressBar);

  window.addEventListener(
    "scroll",
    () => {
      const rect = articleBody.getBoundingClientRect();
      const scrolled = -rect.top / (rect.height - window.innerHeight);
      const progress = Math.min(Math.max(scrolled * 100, 0), 100);
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
    },
    { passive: true }
  );
}

// ── Affiliate Click Tracking ───────────────────────────────
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const productCta = target.closest<HTMLAnchorElement>(".product-box__cta");
  if (productCta && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "affiliate_click", {
      product_id: productCta.dataset.productId,
      page_path: window.location.pathname,
    });
  }
});

// ── External Link Handler ──────────────────────────────────
document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((link) => {
  if (!link.hostname.includes(window.location.hostname)) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  }
});
