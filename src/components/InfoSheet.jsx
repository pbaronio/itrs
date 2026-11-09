import BottomSheet from './BottomSheet.jsx'
import { CloseButton } from './Button.jsx'
import { Badge } from './Cards.jsx'
import { FACTORS } from '../data/itrs.js'

/*
 * Bottom sheet informativo (Figma 3625:20072): spiega un livello ITRS
 * senza lasciare la pagina. 402×428, si chiude con X, tap sul velo o
 * trascinando in giù.
 */
export default function InfoSheet({ open, onClose, factor, level, title, text }) {
  const height = 428
  return (
    <BottomSheet
      open={open}
      snaps={[height]}
      dismissible
      scrim
      onClose={onClose}
      label={factor && level ? FACTORS[factor].names[level] : undefined}
      header={<CloseButton className="info-sheet__close" onClick={onClose} />}
    >
      {factor && level && (
        <div className="info-sheet__body">
          <Badge factor={factor} level={level} className="info-sheet__badge" />
          <p className="t-display info-sheet__name">{FACTORS[factor].names[level]}</p>
          {title && <p className="t-md-em info-sheet__title">{title}</p>}
          {text && <p className="t-md info-sheet__text">{text}</p>}
        </div>
      )}
    </BottomSheet>
  )
}
