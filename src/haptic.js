/*
 * Vibrazione leggera (contesto §4.6, cambio di track nel grafico altimetrico) [P].
 * - Android: navigator.vibrate.
 * - iPhone: Safari non ha navigator.vibrate; da iOS 18 il tocco su un interruttore nativo
 *   (<input type="checkbox" switch>) dà un piccolo feedback aptico. Si usa un interruttore
 *   nascosto, cliccato via codice durante il gesto dell'utente. Altrove non fa niente.
 */
let label = null

function iosSwitch() {
  if (label) return label
  label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.tabIndex = -1
  label.appendChild(input)
  document.body.appendChild(label)
  return label
}

export function haptic() {
  try {
    if (typeof navigator.vibrate === 'function') { navigator.vibrate(8); return }
    iosSwitch().click()
  } catch { /* nessun feedback disponibile */ }
}
