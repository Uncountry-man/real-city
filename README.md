# Real City — site oficial de download

Landing page estática (HTML, CSS e JavaScript sem dependências).

## Comandos

Requer Node.js 18+. Não há pacotes para instalar.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor local em http://localhost:5173 servindo a raiz do projeto |
| `npm run build` | Gera `dist/` (CSS/JS minificados) e valida arquivos referenciados e âncoras internas |
| `npm run preview` | Serve `dist/` em http://localhost:4173 |
| `npm run images` | Regera `assets/img/` a partir de `import assets/` (requer Python 3 + Pillow) |

Para publicar, envie o conteúdo de `dist/` para qualquer hospedagem estática.

## Links de download

Edite `assets/js/downloads.config.js` (também em `dist/assets/js/` após o build).
Cada plataforma — `android`, `ios`, `windows` — tem seu próprio `url`.
Com `url` vazio, a plataforma aparece como "Link ainda não publicado" e o botão fica desativado.
`version`, `size` e `requirements` só aparecem quando preenchidos.

## Estrutura

```
index.html                  página
assets/css/styles.css       estilos (tokens no :root)
assets/js/main.js           menu móvel, downloads, FAQ, galeria ampliada
assets/js/downloads.config.js  destinos de download
assets/img/                 imagens otimizadas (geradas)
assets/fonts/               Archivo (SIL Open Font License 1.1), auto-hospedada
import assets/              arquivos originais — não são publicados
```

## Pendências (informações reais ainda não fornecidas)

- URLs dos arquivos de download de Android, iOS e Windows.
- Versão, tamanho e requisitos de cada plataforma.
- Domínio oficial — para URL canônica e `og:image` absoluta (hoje relativa).
- Canal de suporte, redes sociais, preço e páginas jurídicas, se existirem.
