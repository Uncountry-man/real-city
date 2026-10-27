(function () {
  "use strict";

  /* Ordem e rótulos da barra lateral. O conteúdo vem de rules/<arquivo>.md */
  const MODULES = [
    { file: "gerais", label: "Regras gerais" },
    { file: "seguranca", label: "Segurança e fiscalização" },
    { file: "organizacoes", label: "Organizações e economia" },
    { file: "corporacoes", label: "Corporações policiais" },
    { file: "territorios", label: "Territórios e favelas" },
    { file: "acoes", label: "Ações, assaltos e prisões" },
    { file: "guerras", label: "Guerras" },
  ];
  const ALERTS = { NOTE: "Nota", WARNING: "Atenção", IMPORTANT: "Importante", CAUTION: "Cuidado" };
  const EMOJI_LEAD = /^[\p{Extended_Pictographic}️‍\s]+/u;

  const $ = (sel) => document.querySelector(sel);
  const nav = $("[data-rules-nav]");
  const article = $("[data-rules-article]");
  const toc = $("[data-rules-toc]");

  /* ---------- Markdown ---------- */
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function linkHref(href) {
    const mod = href.match(/^([a-z]+)\.md(#.*)?$/);
    if (mod && MODULES.some((m) => m.file === mod[1])) return `?m=${mod[1]}${mod[2] ?? ""}`;
    return href;
  }

  function inline(text) {
    const codes = [];
    let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    out = out
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
        const url = linkHref(href.replace(/&amp;/g, "&"));
        const external = /^https?:/i.test(url);
        return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
      })
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>");
    return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
  }

  const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparator = (l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l);
  const listMarker = (l) => l.match(/^(\s*)([*+-]|\d+\.)\s+(.*)$/);
  const splitRow = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

  function renderList(lines, start) {
    const first = listMarker(lines[start]);
    const baseIndent = first[1].length;
    const ordered = /\d/.test(first[2]);
    const tag = ordered ? "ol" : "ul";
    let html = `<${tag}>`;
    let i = start;

    while (i < lines.length) {
      const m = listMarker(lines[i]);
      if (!m || m[1].length !== baseIndent) break;
      let item = inline(m[3]);
      i++;
      while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === "") break;
        const next = listMarker(line);
        if (next && next[1].length > baseIndent) {
          const nested = renderList(lines, i);
          item += nested.html;
          i = nested.next;
        } else if (!next && /^\s+\S/.test(line)) {
          item += " " + inline(line.trim());
          i++;
        } else break;
      }
      html += `<li>${item}</li>`;
    }
    return { html: `${html}</${tag}>`, next: i };
  }

  function renderBlocks(lines) {
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === "") { i++; continue; }

      const fence = line.match(/^\s*```/);
      if (fence) {
        const body = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
        i++;
        html += `<pre class="md-code"><code>${escapeHtml(body.join("\n"))}</code></pre>`;
        continue;
      }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += "<hr>"; i++; continue; }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        let text = heading[2].trim();
        if (level <= 2) text = text.replace(EMOJI_LEAD, "");
        html += `<h${level} data-heading>${inline(text)}</h${level}>`;
        i++;
        continue;
      }

      if (isTableRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && isTableRow(lines[i])) rows.push(splitRow(lines[i++]));
        html += '<div class="md-table"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join("") +
          "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + r.map((c, n) => `<td data-label="${escapeHtml(head[n] ?? "")}">${inline(c)}</td>`).join("") + "</tr>").join("") +
          "</tbody></table></div>";
        continue;
      }

      if (/^\s*>/.test(line)) {
        const quote = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
        const alert = quote[0].match(/^\[!(NOTE|WARNING|IMPORTANT|CAUTION)\]\s*$/);
        if (alert) {
          const kind = alert[1].toLowerCase();
          html += `<aside class="md-alert md-alert--${kind}"><p class="md-alert__title">${ALERTS[alert[1]]}</p>${renderBlocks(quote.slice(1))}</aside>`;
        } else {
          html += `<blockquote>${renderBlocks(quote)}</blockquote>`;
        }
        continue;
      }

      if (listMarker(line)) {
        const list = renderList(lines, i);
        html += list.html;
        i = list.next;
        continue;
      }

      const para = [];
      while (
        i < lines.length && lines[i].trim() !== "" &&
        !/^(#{1,6}\s|\s*```|\s*>|\s*(-{3,}|\*{3,})\s*$)/.test(lines[i]) &&
        !listMarker(lines[i]) && !(isTableRow(lines[i]) && isSeparator(lines[i + 1] ?? ""))
      ) para.push(lines[i++]);
      html += `<p>${para.map((l, n) => inline(l.replace(/\s+$/, "")) + (/ {2,}$/.test(para[n]) && n < para.length - 1 ? "<br>" : "")).join(" ")}</p>`;
    }
    return html;
  }

  /* ---------- Página ---------- */
  let current = null;
  let spy = null;

  function currentModule() {
    const wanted = new URLSearchParams(location.search).get("m");
    return MODULES.find((m) => m.file === wanted) ?? MODULES[0];
  }

  function renderNav(active) {
    nav.innerHTML = MODULES.map((m, i) => {
      const on = m.file === active.file;
      return `<li><a href="?m=${m.file}" class="rules-nav__link${on ? " is-active" : ""}"${on ? ' aria-current="page"' : ""}>` +
        `<span class="rules-nav__num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(m.label)}</a>` +
        (on ? '<ol class="rules-toc" data-rules-toc></ol>' : "") + "</li>";
    }).join("");
  }

  function buildToc() {
    const holder = $("[data-rules-toc]");
    if (spy) spy.disconnect();
    const heads = Array.from(article.querySelectorAll("h2[id]"));
    if (!holder) return;
    holder.innerHTML = heads.map((h) => `<li><a href="#${h.id}">${h.innerHTML.replace(/<[^>]+>/g, "")}</a></li>`).join("");
    if (!("IntersectionObserver" in window) || !heads.length) return;
    const links = new Map(heads.map((h) => [h.id, holder.querySelector(`a[href="#${h.id}"]`)]));
    spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("is-current"));
        links.get(e.target.id)?.classList.add("is-current");
      });
    }, { rootMargin: "-90px 0px -70% 0px" });
    heads.forEach((h) => spy.observe(h));
  }

  function assignIds() {
    const seen = new Map();
    article.querySelectorAll("[data-heading]").forEach((h) => {
      let id = slugify(h.textContent) || "secao";
      const n = seen.get(id) ?? 0;
      seen.set(id, n + 1);
      if (n) id += `-${n + 1}`;
      h.id = id;
    });
  }

  function addPager(active) {
    const i = MODULES.indexOf(active);
    const link = (m, dir) => m
      ? `<a class="rules-pager__link rules-pager__link--${dir}" href="?m=${m.file}"><span>${dir === "prev" ? "Anterior" : "Próximo"}</span>${escapeHtml(m.label)}</a>`
      : "<span></span>";
    article.insertAdjacentHTML("beforeend", `<nav class="rules-pager" aria-label="Módulos">${link(MODULES[i - 1], "prev")}${link(MODULES[i + 1], "next")}</nav>`);
  }

  async function load() {
    const active = currentModule();
    current = active;
    renderNav(active);
    const label = $("[data-rules-current]");
    if (label) label.textContent = active.label;
    article.setAttribute("aria-busy", "true");
    document.title = `${active.label} — Regras do Real City`;

    let text;
    let modified = "";
    try {
      const res = await fetch(`rules/${active.file}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      text = await res.text();
      modified = res.headers.get("last-modified") ?? "";
    } catch {
      article.innerHTML = '<p class="rules-error">Não foi possível carregar as regras agora. Atualize a página ou tente de novo em instantes.</p>';
      article.removeAttribute("aria-busy");
      return;
    }

    const body = renderBlocks(text.replace(/\r\n?/g, "\n").split("\n"));
    const stamp = modified && !isNaN(Date.parse(modified))
      ? `<p class="rules-updated">Atualizado em ${new Date(modified).toLocaleDateString("pt-BR")}</p>` : "";
    article.innerHTML = body;
    const h1 = article.querySelector("h1");
    if (h1) {
      h1.classList.add("rules-title");
      h1.insertAdjacentHTML("beforebegin", `<p class="rules-kicker">Módulo ${String(MODULES.indexOf(active) + 1).padStart(2, "0")} de ${String(MODULES.length).padStart(2, "0")}</p>`);
      if (stamp) h1.insertAdjacentHTML("afterend", stamp);
    }
    assignIds();
    addPager(active);
    buildToc();
    article.removeAttribute("aria-busy");

    const hash = decodeURIComponent(location.hash.slice(1));
    const target = hash && document.getElementById(hash);
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  /* Troca de módulo sem recarregar a página */
  document.addEventListener("click", (event) => {
    const a = event.target.closest("a[href^='?m=']");
    if (!a || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
    event.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    document.querySelector("[data-rules-panel]")?.classList.remove("is-open");
    $("[data-rules-toggle]")?.setAttribute("aria-expanded", "false");
    load();
  });
  window.addEventListener("popstate", load);

  /* Painel de módulos no celular */
  const toggle = $("[data-rules-toggle]");
  const panel = $("[data-rules-panel]");
  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
    });
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a[href^='#']")) {
        toggle.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
      }
    });
  }

  load();
})();
