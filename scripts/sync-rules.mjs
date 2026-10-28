// Copia os módulos de regras (.md) da pasta de origem para rules/.
// Uso: npm run rules [pasta-de-origem]
import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const source = resolve(process.argv[2] ?? join(homedir(), "Área de trabalho/rules/rules"));
const MODULES = ["gerais", "seguranca", "organizacoes", "corporacoes", "territorios", "acoes", "guerras", "punicoes"];

await mkdir(join(root, "rules"), { recursive: true });
for (const name of MODULES) {
  await copyFile(join(source, `${name}.md`), join(root, "rules", `${name}.md`));
  console.log(`rules/${name}.md`);
}
