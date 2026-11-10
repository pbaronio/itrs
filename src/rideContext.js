import { createContext, useContext } from 'react'

/*
 * Avvio della navigazione (passo 3.1) dai pulsanti Start delle pagine di dettaglio.
 * Explore fornisce la funzione: apre il giro come voce della cronologia ({ t: 'ride', id }).
 */
export const RideContext = createContext(null)

// start(item): item è una route, una track della mappa o una track dentro una route (trackAsRoute)
export function useStartRide() {
  return useContext(RideContext)
}
