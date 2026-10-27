// Gera a versão de produção em dist/ e valida referências.
// - Copia somente os arquivos publicáveis (sem "import assets", scripts ou originais).
// - Minifica CSS e JS de forma conservadora (remove comentários e espaços).
// - Falha se algum arquivo referenciado não existir ou se uma âncora interna não tiver destino.
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const PUBLIC = ["index.html", "favicon.ico", "site.webmanifest", "assets"];

const exists = (path) => stat(path).then(() => true, () => false);
const errors = [];

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function stripJsComments(js) {
  // Remove apenas comentários de bloco e linhas que são inteiramente comentário,
  // para não tocar em strings ou URLs.
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .join("\n");
}

async function checkReferences(htmlPath) {
  const html = await readFile(htmlPath, "utf8");
  const refs = new Set();

  for (const [, value] of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.add(value);
  for (const [, value] of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)) {
    value.split(",").forEach((part) => refs.add(part.trim().split(/\s+/)[0]));
  }
  for (const [, value] of html.matchAll(/<meta property="og:image" content="([^"]+)"/g)) refs.add(value);

  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  let files = 0;
  let anchors = 0;

  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    if (ref.startsWith("#")) {
      anchors++;
      if (!ids.has(ref.slice(1))) errors.push(`Âncora sem destino: ${ref}`);
      continue;
    }
    files++;
    if (!(await exists(join(dirname(htmlPath), ref)))) errors.push(`Arquivo não encontrado: ${ref}`);
  }

  const css = await readFile(join(dist, "assets/css/styles.css"), "utf8");
  for (const [, ref] of css.matchAll(/url\("?([^")]+)"?\)/g)) {
    files++;
    if (!(await exists(join(dist, "assets/css", ref)))) errors.push(`CSS: arquivo não encontrado: ${ref}`);
  }

  const manifest = JSON.parse(await readFile(join(dist, "site.webmanifest"), "utf8"));
  for (const icon of manifest.icons) {
    files++;
    if (!(await exists(join(dist, icon.src)))) errors.push(`Manifest: ícone não encontrado: ${icon.src}`);
  }

  return { files, anchors };
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const entry of PUBLIC) await cp(join(root, entry), join(dist, entry), { recursive: true });

const cssPath = join(dist, "assets/css/styles.css");
await writeFile(cssPath, minifyCss(await readFile(cssPath, "utf8")));
for (const name of ["main.js", "downloads.config.js"]) {
  const jsPath = join(dist, "assets/js", name);
  // A configuração mantém os comentários: é o arquivo que será editado no servidor.
  if (name === "main.js") await writeFile(jsPath, stripJsComments(await readFile(jsPath, "utf8")));
}

const { files, anchors } = await checkReferences(join(dist, "index.html"));

if (errors.length) {
  console.error(`Build com ${errors.length} erro(s):`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log(`Build concluído em dist/ — ${files} arquivos e ${anchors} âncoras internas verificados.`);
