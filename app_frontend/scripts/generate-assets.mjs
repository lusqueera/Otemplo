// Gera ícone, adaptive icon (Android), favicon e imagem da splash a partir de assets/logo.svg.
// Uso: node scripts/generate-assets.mjs
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BG = '#131313';
const svg = await readFile(new URL('../assets/logo.svg', import.meta.url));

/** Logo branco recortado na caixa do glifo (o SVG tem margem interna) e ajustado em `size` px. */
async function logo(size) {
  const trimmed = await sharp(svg, { density: 600 }).trim().png().toBuffer();
  return sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** Quadrado `size` px de cor `bg` com o logo centralizado ocupando `ratio` do lado. */
async function composed(size, ratio, bg) {
  const base = sharp({ create: { width: size, height: size, channels: 4, background: bg } });
  const inner = Math.round(size * ratio);
  const layers = inner > 0 ? [{ input: await logo(inner), gravity: 'center' }] : [];
  return base.composite(layers).png().toBuffer();
}

const out = (name) => new URL(`../assets/${name}`, import.meta.url);

// iOS / genérico: quadrado escuro com o logo (Apple aplica o arredondamento)
await writeFile(out('icon.png'), await composed(1024, 0.5, BG));

// Android adaptive: foreground na zona segura (66% centrais), background sólido, monochrome só o glifo
await writeFile(out('android-icon-foreground.png'), await composed(1024, 0.4, { r: 0, g: 0, b: 0, alpha: 0 }));
await writeFile(out('android-icon-background.png'), await composed(1024, 0, BG));
await writeFile(out('android-icon-monochrome.png'), await composed(1024, 0.4, { r: 0, g: 0, b: 0, alpha: 0 }));

// Splash: só o glifo; o fundo vem do backgroundColor do plugin
await writeFile(out('splash-icon.png'), await composed(512, 0.8, { r: 0, g: 0, b: 0, alpha: 0 }));

// Favicon (web)
await writeFile(out('favicon.png'), await composed(64, 0.6, BG));

console.log('Assets gerados em assets/');
