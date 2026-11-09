import { LEVELS } from '../data/itrs.js'

/*
 * Forma del livello ITRS: cerchio, quadrato, triangolo, rombo, forma doppia.
 * Tracciati del Figma (filtri e card, riquadro 14×14): va sempre accanto al
 * nome del livello, perché il colore non deve mai essere l'unico segnale.
 */
export const SHAPE_PATHS = {
  circle: (fill) => <circle cx="7" cy="7" r="4.5" fill={fill} />,
  square: (fill) => <rect x="2.5" y="2.5" width="9" height="9" fill={fill} />,
  triangle: (fill) => <path d="M7 2.067 12.5 11.593H1.5Z" fill={fill} />,
  diamond: (fill) => <path d="M7 .636 13.364 7 7 13.364.636 7Z" fill={fill} />,
  double: (fill) => <path d="M14 6.977 9.432 13.021 7 9.803 4.567 13.021 0 6.977 4.567.934 7 4.151 9.432.934Z" fill={fill} />,
}

export default function LevelShape({ level, size = 14, title }) {
  const { color, shape } = LEVELS[level]
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" focusable="false" {...a11y}>
      {SHAPE_PATHS[shape](color)}
    </svg>
  )
}
