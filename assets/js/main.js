(function () {
  "use strict";

  const PLATFORM_LABELS = { android: "Android", ios: "iOS", windows: "Windows" };
  const META_LABELS = { version: "Versão", size: "Tamanho", requirements: "Requisitos" };

  /* Header: borda ao rolar */
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* Navegação móvel */
  function initNav() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const list = document.querySelector("[data-nav-list]");
    if (!toggle || !list) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      list.classList.toggle("is-open", open);
    };
    setOpen(false);

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    list.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && list.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-nav")) setOpen(false);
    });
    window.matchMedia("(min-width: 52.0625rem)").addEventListener("change", () => setOpen(false));
  }

  /* Downloads: aplica os destinos configurados em downloads.config.js */
  function isValidUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return false;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "file:";
    } catch {
      return false;
    }
  }

  function initDownloads() {
    const config = window.REAL_CITY_DOWNLOADS || {};

    document.querySelectorAll("[data-platform]").forEach((item) => {
      const key = item.dataset.platform;
      const entry = config[key];
      if (!entry || !isValidUrl(entry.url)) return;

      const label = PLATFORM_LABELS[key] || key;
      const placeholder = item.querySelector("[data-action]");
      const link = document.createElement("a");
      link.className = "btn btn--primary";
      link.href = entry.url.trim();
      link.setAttribute("download", "");
      link.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-download"></use></svg>';
      link.append(`Baixar para ${label}`);
      if (/^https?:/i.test(link.href) && new URL(link.href).origin !== window.location.origin) {
        link.rel = "noopener";
      }
      placeholder.replaceWith(link);

      const status = item.querySelector("[data-status]");
      status.classList.replace("status--pending", "status--available");
      status.lastChild.textContent = "Disponível para download";

      const meta = item.querySelector("[data-meta]");
      Object.keys(META_LABELS).forEach((field) => {
        const value = typeof entry[field] === "string" ? entry[field].trim() : "";
        if (!value) return;
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = META_LABELS[field];
        dd.textContent = value;
        row.append(dt, dd);
        meta.append(row);
      });
      meta.hidden = meta.children.length === 0;

      item.classList.add("is-available");
    });
  }

  /* FAQ: acordeão */
  function initAccordion() {
    document.querySelectorAll("[data-accordion] .faq__q button").forEach((button) => {
      const item = button.closest(".faq__item");
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        item.classList.toggle("is-open", open);
      });
    });
  }

  /* Galeria: visualização ampliada */
  function initLightbox() {
    const dialog = document.querySelector("[data-lightbox-dialog]");
    const triggers = Array.from(document.querySelectorAll("[data-lightbox]"));
    if (!dialog || !triggers.length || typeof dialog.showModal !== "function") return;

    const img = document.createElement("img");
    img.className = "lightbox__img";
    dialog.querySelector(".lightbox__frame").prepend(img);
    const caption = dialog.querySelector("[data-lightbox-caption]");
    const items = triggers.map((trigger) => {
      const source = trigger.querySelector("img");
      const webp = trigger.querySelector('source[type="image/webp"]');
      const figcaption = trigger.closest("figure").querySelector("figcaption");
      const srcset = (webp || source).getAttribute("srcset");
      const largest = srcset.split(",").map((s) => s.trim().split(" ")[0]).pop();
      const title = figcaption?.querySelector("strong")?.textContent.trim() ?? "";
      const text = figcaption ? figcaption.textContent.replace(title, "").trim() : "";
      return { src: largest, alt: source.alt, caption: [title, text].filter(Boolean).join(" — ") };
    });
    let index = 0;
    let opener = null;

    const show = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      img.src = item.src;
      img.alt = item.alt;
      caption.textContent = `${item.caption} (${index + 1} de ${items.length})`;
    };

    triggers.forEach((trigger, i) => {
      trigger.addEventListener("click", () => {
        opener = trigger;
        show(i);
        dialog.showModal();
        dialog.querySelector("[data-lightbox-close]").focus();
      });
    });

    dialog.querySelector("[data-lightbox-close]").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => show(index + 1));

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
    });
    // Fecha ao tocar fora da imagem e dos controles.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.classList.contains("lightbox__frame")) dialog.close();
    });

    let touchX = null;
    dialog.addEventListener("touchstart", (event) => { touchX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", (event) => {
      if (touchX === null) return;
      const delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 50) show(delta < 0 ? index + 1 : index - 1);
      touchX = null;
    });

    dialog.addEventListener("close", () => {
      if (opener) opener.focus();
    });
  }

  initHeader();
  initNav();
  initDownloads();
  initAccordion();
  initLightbox();
})();
