/*
 * Genera le icone dell'app (PNG) da un unico disegno SVG.
 * Uso: node scripts/make-icons.mjs  (richiede rsvg-convert, pacchetto librsvg)
 * Le PNG generate sono nel repo: lo script serve solo se cambia l'icona.
 *
 * Icona provvisoria: cerchio ITRS a 4 quadranti su fondo bianco, come il favicon.
 * Va sostituita quando c'è l'icona definitiva.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Disegno del favicon (viewBox 64): anello nero, 4 quadranti, croce sabbia
const MARK = `
  <circle cx="32" cy="32" r="32" fill="#0E0E0F"/>
  <path d="M32 6a26 26 0 0 0-26 26h26z" fill="#34A853"/>
  <path d="M32 6a26 26 0 0 1 26 26H32z" fill="#4285F4"/>
  <path d="M58 32a26 26 0 0 1-26 26V32z" fill="#EA4335"/>
  <path d="M32 58A26 26 0 0 1 6 32h26z" fill="#DD894B"/>
  <path d="M32 6v52M6 32h52" stroke="#E9E7DC" stroke-width="2"/>`

// scale = diametro del cerchio rispetto al lato dell'icona
function svg(scale) {
  const d = 64 * scale
  const off = (64 - d) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#FFFFFF"/>
  <g transform="translate(${off} ${off}) scale(${scale})">${MARK}</g>
</svg>`
}

const OUT = new URL('../public/icons/', import.meta.url).pathname
const tmp = mkdtempSync(join(tmpdir(), 'itrs-icons-'))

const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 0.8 },            // Android, purpose any
  { file: 'icon-512.png', size: 512, scale: 0.8 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.6 },   // Android adattiva: dentro la zona sicura (80%)
  { file: 'apple-touch-icon.png', size: 180, scale: 0.72 },   // iOS Home Screen
  { file: 'icon-guide.png', size: 144, scale: 0.72 },         // anteprima nella guida (72 px @2x)
]

for (const { file, size, scale } of ICONS) {
  const src = join(tmp, file.replace('.png', '.svg'))
  writeFileSync(src, svg(scale))
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', join(OUT, file), src])
  console.log('✓', file)
}
