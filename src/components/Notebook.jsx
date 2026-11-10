import { useCallback, useEffect, useRef, useState } from 'react'
import { tipsOf } from '../data/notebook.js'
import './Notebook.css'

/*
 * ITRS Notebook (passo 2.4, contesto §4.9, Figma 3625:18950).
 * Card verde bosco nella pagina route con le storie dentro: barre di avanzamento, `ITRS Notebook`,
 * titolo Mona Sans maiuscolo e testo. Ogni storia è un consiglio sulla route (data/notebook.js).
 * - Avanza da sola; dopo l'ultima ricomincia dalla prima [P].
 * - Tap sulla card = storia successiva; tap sul terzo sinistro = precedente [P].
 * - Tieni premuto = pausa. Si ferma anche quando la card non è sullo schermo o l'app è in background.
 * - Frecce della tastiera quando la card ha il focus.
 */
const DURATION = 7000      // ms per storia
const HOLD_MS = 250        // oltre questa durata il tocco è una pausa, non un tap

export default function Notebook({ route }) {
  const tips = tipsOf(route.id)
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hidden, setHidden] = useState(false)
  const ref = useRef(null)
  const press = useRef(null)
  const count = tips.length

  // Nuova route: si riparte dalla prima storia
  useEffect(() => { setIndex(0) }, [route.id])

  // Gira solo quando la card è sullo schermo (almeno metà)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [count])

  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])

  if (!count) return null
  const tip = tips[index]
  const paused = held || hidden || !visible

  const onPointerDown = (e) => {
    if (e.button > 0) return
    const timer = setTimeout(() => setHeld(true), HOLD_MS)
    press.current = { x: e.clientX, y: e.clientY, t: Date.now(), timer, id: e.pointerId }
  }
  const end = (e, cancelled) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    clearTimeout(p.timer)
    press.current = null
    setHeld(false)
    if (cancelled || p.moved || Date.now() - p.t >= HOLD_MS) return
    const box = e.currentTarget.getBoundingClientRect()
    if (e.clientX - box.left < box.width / 3) prev(); else next()
  }
  // Se il dito si muove è uno scorrimento della pagina: niente tap e niente pausa
  const onPointerMove = (e) => {
    const p = press.current
    if (!p || p.id !== e.pointerId || p.moved) return
    if (Math.abs(e.clientX - p.x) > 8 || Math.abs(e.clientY - p.y) > 8) {
      p.moved = true
      clearTimeout(p.timer)
      setHeld(false)
    }
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next() }
  }

  return (
    <section
      ref={ref}
      className="nb-card"
      role="group"
      aria-roledescription="stories"
      aria-label={`ITRS Notebook, tip ${index + 1} of ${count}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="nb-card__shape" aria-hidden="true" />

      <div className="nb-bars" aria-hidden="true">
        {tips.map((_, i) => (
          <span key={i} className="nb-bars__bar">
            <span
              key={i === index ? `run-${index}` : 'still'}
              className={`nb-bars__fill${i < index ? ' is-done' : ''}${i === index ? ' is-running' : ''}`}
              style={i === index ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
              onAnimationEnd={i === index ? next : undefined}
            />
          </span>
        ))}
      </div>

      <p className="nb-card__label t-md">ITRS Notebook</p>

      <div className="nb-card__story" key={index} aria-live="polite">
        <h3 className="nb-card__title t-display">{tip.title}</h3>
        <p className="nb-card__text">{tip.text}</p>
      </div>
    </section>
  )
}
