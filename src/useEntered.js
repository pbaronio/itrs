import { useEffect, useState } from 'react'

/*
 * Entrata animata delle pagine (Paolo, rev. 2.3): la pagina si monta chiusa e solo al frame
 * successivo prende lo stato aperto, così la transizione parte anche alla prima apertura.
 * Pagine con la freccia indietro: entrano da destra. Pagine col chevron giù: entrano dal basso.
 */
export function useEntered(open) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!open) { setEntered(false); return }
    // Due frame (la posizione chiusa viene disegnata), con un timer di riserva se i frame
    // non arrivano (pagina in background)
    let inner
    const go = () => setEntered(true)
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(go) })
    const timer = setTimeout(go, 60)
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); clearTimeout(timer) }
  }, [open])
  return open && entered
}
