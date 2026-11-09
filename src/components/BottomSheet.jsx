import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './BottomSheet.css'

/*
 * Bottom sheet trascinabile (§6 "Bottom sheet e overlay", §7 movimento).
 *
 * - snaps: altezze visibili in px, dalla più bassa alla più alta.
 * - Si trascina dalla testata (handle + titolo) e dal contenuto: quando il
 *   foglio è al massimo il contenuto scorre, e trascinando in giù dall'inizio
 *   della lista il foglio scende.
 * - Al rilascio si aggancia allo stato più vicino tenendo conto della velocità.
 * - dismissible: trascinando sotto lo stato più basso si chiude (onClose).
 */
export default function BottomSheet({
  open = true,
  snaps,
  snap,
  onSnapChange,
  dismissible = false,
  onClose,
  scrim = false,
  bottom = 0,
  header,
  footer,
  children,
  className = '',
  label,
}) {
  const sheetRef = useRef(null)
  const scrollRef = useRef(null)
  const maxH = snaps[snaps.length - 1]
  const [index, setIndex] = useState(snap ?? 0)
  const [height, setHeight] = useState(open ? snaps[snap ?? 0] : 0)
  const [dragging, setDragging] = useState(false)
  const [mounted, setMounted] = useState(open)
  const drag = useRef(null)
  const heightRef = useRef(height)
  heightRef.current = height

  // Stato controllato dall'esterno (es. FAB Map → stato 1)
  useEffect(() => {
    if (snap == null || snap === index) return
    setIndex(snap)
    setHeight(snaps[snap])
  }, [snap]) // eslint-disable-line react-hooks/exhaustive-deps

  // Altezze ricalcolate (rotazione, resize): resta sullo stesso stato
  useEffect(() => {
    if (open && !drag.current) setHeight(snaps[index])
  }, [snaps.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apertura e chiusura animate
  useLayoutEffect(() => {
    if (open) {
      setMounted(true)
      setHeight(0)
      const id = requestAnimationFrame(() => requestAnimationFrame(() => {
        setIndex(snap ?? 0)
        setHeight(snaps[snap ?? 0])
      }))
      return () => cancelAnimationFrame(id)
    }
    setHeight(0)
    const t = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((i) => {
    setIndex(i)
    setHeight(snaps[i])
    onSnapChange?.(i)
  }, [snaps, onSnapChange])

  // --- Trascinamento: touch (telefono) e mouse (anteprima su desktop) ---
  const start = useCallback((y, fromHeader, x = 0) => {
    drag.current = {
      startY: y,
      startX: x,
      startH: heightRef.current,
      mode: fromHeader ? 'sheet' : 'pending',
      samples: [{ y, t: performance.now() }],
    }
  }, [])

  const move = useCallback((y, event, x = 0) => {
    const d = drag.current
    if (!d) return
    const dy = y - d.startY
    const dx = x - d.startX
    if (d.mode === 'pending') {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 3) return
      if (Math.abs(dx) > Math.abs(dy)) { d.mode = 'scroll'; return } // gesto orizzontale (carosello)
      const atMax = heightRef.current >= maxH - 1
      const scroller = scrollRef.current
      if (atMax && scroller && (scroller.scrollTop > 0 || dy < 0)) d.mode = 'scroll'
      else d.mode = 'sheet'
    }
    if (d.mode !== 'sheet') return
    if (event?.cancelable) event.preventDefault()
    if (!d.active) { d.active = true; setDragging(true) }

    const min = snaps[0]
    let h = d.startH - dy
    if (h > maxH) h = maxH + (h - maxH) * 0.25                 // elastico in alto
    else if (h < min && !dismissible) h = min - (min - h) * 0.25 // elastico in basso
    h = Math.max(0, h)
    heightRef.current = h
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0, ${maxH - h}px, 0)`
    d.samples.push({ y, t: performance.now() })
    if (d.samples.length > 5) d.samples.shift()
  }, [dismissible, maxH, snaps])

  const end = useCallback(() => {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (!d || d.mode !== 'sheet') return
    if (sheetRef.current) sheetRef.current.style.transform = ''

    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const v = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0 // px/ms, + verso il basso
    const h = heightRef.current
    const projected = h - v * 180

    if (dismissible && (projected < snaps[0] * 0.6 || v > 0.9)) {
      setHeight(0)
      onClose?.()
      return
    }
    let best = 0
    snaps.forEach((s, i) => { if (Math.abs(s - projected) < Math.abs(snaps[best] - projected)) best = i })
    goTo(best)
  }, [dismissible, goTo, onClose, snaps])

  // Listener nativi: touchmove non passivo per poter bloccare lo scroll
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const isHeader = (target) => Boolean(target.closest?.('[data-sheet-handle]'))
    const ts = (e) => start(e.touches[0].clientY, isHeader(e.target), e.touches[0].clientX)
    const tm = (e) => move(e.touches[0].clientY, e, e.touches[0].clientX)
    const te = () => end()
    const md = (e) => {
      if (e.button !== 0) return
      start(e.clientY, isHeader(e.target), e.clientX)
      const mm = (ev) => move(ev.clientY, ev, ev.clientX)
      const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu) }
      window.addEventListener('mousemove', mm)
      window.addEventListener('mouseup', mu)
    }
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchmove', tm, { passive: false })
    el.addEventListener('touchend', te)
    el.addEventListener('touchcancel', te)
    el.addEventListener('mousedown', md)
    return () => {
      el.removeEventListener('touchstart', ts)
      el.removeEventListener('touchmove', tm)
      el.removeEventListener('touchend', te)
      el.removeEventListener('touchcancel', te)
      el.removeEventListener('mousedown', md)
    }
  }, [mounted, start, move, end])

  if (!mounted) return null
  const expanded = index === snaps.length - 1 && height >= maxH - 1

  return (
    <>
      {scrim && (
        <div
          className={`sheet-scrim${open && height > 0 ? ' is-visible' : ''}`}
          onClick={() => { setHeight(0); onClose?.() }}
          aria-hidden="true"
        />
      )}
      <section
        ref={sheetRef}
        className={`sheet${dragging ? ' is-dragging' : ''}${expanded ? ' is-expanded' : ''} ${className}`}
        style={{
          height: maxH,
          bottom,
          transform: `translate3d(0, ${maxH - height + (height === 0 ? bottom : 0)}px, 0)`,
        }}
        data-snap={index}
        role={scrim ? 'dialog' : 'region'}
        aria-modal={scrim || undefined}
        aria-label={label}
      >
        <div className="sheet__head" data-sheet-handle>
          <span className="sheet__handle" aria-hidden="true" />
          {header}
        </div>
        <div ref={scrollRef} className="sheet__content">{children}</div>
        {footer}
      </section>
    </>
  )
}
