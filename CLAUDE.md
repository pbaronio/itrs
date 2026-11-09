# ITRS prototype

Prototipo dell'app mobile ITRS (mountain bike, International Trail Rating System) per test utente moderati. Web app installabile (PWA) per iOS e Android, interfaccia in **inglese**.

## Documenti di riferimento (nel Project "ITRS" su claude.ai)

- `ITRS_contesto.md`: prodotto, sistema ITRS, flussi, decisioni, punti aperti.
- `ITRS_istruzioni.md`: regole visive, token, componenti, correzioni al Figma (§8).
- `ITRS_piano_prototipo.md`: fasi, passi e registro. Si lavora **un passo alla volta**, con l'ok di Paolo prima del successivo.
- Figma `2026_ITRS_Mobile-App` (fileKey `GEK8IrR2GgTDuLYr1tUjBD`): solo per i dettagli.

Se istruzioni e Figma divergono, valgono le istruzioni.

## Stack e comandi

- React 19 + Vite. Font self-hosted con Fontsource (Inter, Mona Sans).
- In arrivo: MapLibre GL + MapTiler (chiave in `VITE_MAPTILER_KEY`, vedi `.env.example`).
- `npm install` · `npm run dev` (aperto in LAN per provare sul telefono) · `npm run build`.
- Pubblicazione: Netlify, build da `main` (`netlify.toml`).
- **Installazione (PWA):** aperta nel browser l'app mostra solo la guida all'installazione; dall'icona sulla Home mostra l'app. Per vederla nel browser senza installarla: pulsante `Preview app here` in fondo alla guida, oppure `?preview` nell'indirizzo. L'anteprima è una voce della cronologia sopra la guida (`history.state.preview`): Indietro torna sempre alla guida. Ogni `pushState` futuro deve mantenere `{ preview: true }` nello stato.

## Struttura

```
public/manifest.webmanifest   manifest PWA (standalone, verticale, fondo bianco)
assets/icon/                  icona sorgente fornita da Paolo (256 px)
public/icons/                 icone generate da scripts/make_icons.py (python3 + Pillow)
src/
  pwa.js              modalità di apertura, piattaforma, prompt di installazione Android, ?preview
  styles/tokens.css   token §9 delle istruzioni, copia esatta: non modificare a mano
  styles/fonts.css    font e override dei nomi famiglia Fontsource
  styles/base.css     reset, comportamento da app, safe area, durate di movimento
  data/               dati ITRS e dati finti (JSON route e track)
  assets/             foto e badge esportati dal Figma (pagina UI Design), webp
  components/         componenti riusabili (.jsx + .css): Icon, LevelShape, Button (+ ActionBar,
                      FilterBar, FabMap…), Chip, Controls (Checkbox, Switch), Cards (RouteCard,
                      ListingCard, RatingRow, RatingCard, Pentagon), BottomSheet, InfoSheet, TabBar
  screens/            schermate (Components = galleria del passo 0.3, BaseCheck, InstallGuide)
```

## Regole

0. **Riusa i componenti** di `src/components/` prima di crearne di nuovi; icone solo da `Icon.jsx` (tracciati del Figma).

1. **Solo token.** Niente colori, raggi o spazi scritti a mano fuori da `tokens.css`. Se manca un token, chiedi.
2. **Testi con le classi** `.t-*` di `tokens.css`. Mona Sans (`.t-display`) solo nei casi del §3 delle istruzioni.
3. **Livelli ITRS** sempre con colore **e** forma o nome (`LevelShape`, `data/itrs.js`). Testo mostrato `Advanced`, non `Advance`.
4. **Pulsanti:** nero per agire, blu per confermare. Sul blu il testo è sempre scuro.
5. **Fondo scuro solo in navigazione.** Il resto dell'app è chiaro.
6. **Formati:** `12.75 km`, `+291 m`, `~1h 50m`; decimali col punto, spazio prima dell'unità.
7. **Non inventare** livelli, dati ITRS, logiche o schermate non progettate (Record, Profile): chiedi.
8. **Mobile first:** frame di riferimento 402×874, margini 16, aree di tocco ≥ 44×44, safe area con `--safe-*`.
9. **Movimento:** durate `--dur-*` e curva `--ease-out`; rispettare *Riduci movimento*.
10. **Stati:** per ogni schermata considera caricamento, vuoto, errore, permesso negato.

## Fine passo

Aggiorna il registro in `ITRS_piano_prototipo.md` (fatto, cambiato rispetto al design, aperto). Se una modifica cambia il design, aggiorna anche contesto o istruzioni.
