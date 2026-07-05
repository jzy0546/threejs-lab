export function initSite() {
  const path = normalizePath(window.location.pathname);
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = normalizePath(link.getAttribute("href") || "/");
    if (href === path) {
      link.setAttribute("aria-current", "page");
    }
  });

  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      menu.toggleAttribute("data-open", !expanded);
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.getAttribute("data-copy-target"));
      if (!target) return;
      await navigator.clipboard.writeText(target.textContent.trim());
      const original = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });

  initReveal();
}

function normalizePath(value) {
  if (!value) return "/";
  if (value !== "/" && value.endsWith("/")) return value.slice(0, -1);
  return value;
}

function initReveal() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.forEach((element) => element.classList.add("reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  elements.forEach((element) => observer.observe(element));
}
