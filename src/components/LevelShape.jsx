import { LEVELS } from '../data/itrs.js'

/*
 * Forma del livello ITRS: cerchio, quadrato, triangolo, rombo, forma doppia.
 * Va sempre accanto al nome del livello (il colore non è mai l'unico segnale).
 * Forma doppia (Extreme): due rombi affiancati, da verificare sul Figma.
 */
export default function LevelShape({ level, size = 12, title }) {
  const { color, shape } = LEVELS[level]
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true }

  if (shape === 'double') {
    return (
      <svg width={size * 1.75} height={size} viewBox="0 0 21 12" {...a11y}>
        <path d="M5.5 0 11 6 5.5 12 0 6Z" fill={color} />
        <path d="M15.5 0 21 6 15.5 12 10 6Z" fill={color} />
      </svg>
    )
  }

  const paths = {
    circle: <circle cx="6" cy="6" r="6" fill={color} />,
    square: <rect width="12" height="12" rx="1.5" fill={color} />,
    triangle: <path d="M6 .5 12 11.5H0Z" fill={color} />,
    diamond: <path d="M6 0 12 6 6 12 0 6Z" fill={color} />,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 12 12" {...a11y}>
      {paths[shape]}
    </svg>
  )
}
