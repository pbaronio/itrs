# Dati di prova sul Garda

`src/data/garda-geometry.json` contiene i tracciati di 35 track tra Riva del Garda, Valle di Ledro, Arco, Nago-Torbole e Tremosine.

## Come sono stati generati (9 novembre 2026)

- Coordinate delle località da Nominatim (OpenStreetMap).
- Tracciati da [BRouter](https://brouter.de) (`profile=mtb`, `format=geojson`) tra quelle località: seguono strade, sterrati e sentieri veri di OpenStreetMap. Quota dal modello del terreno di BRouter.
- Semplificati (Douglas-Peucker, 4 m) e codificati come polyline (lat, lon, quota, precisione 1e-5).
- `surface`: metri su strada asfaltata, sterrato (track) e sentiero (path), dai tag OSM.

Dati © OpenStreetMap contributors (ODbL).

## Punti di passaggio (lat, lon)

| Track | Da → a (via) |
|---|---|
| P1 | Riva 45.8848,10.8397 → inizio Ponale 45.8741,10.8374 → Belvedere 45.8619,10.8312 |
| P1b | Belvedere → 45.8648,10.8216 → Biacesa 45.8655,10.8056 |
| VL1 | Biacesa → Prè 45.8662,10.7894 → Molina 45.8713,10.7756 |
| LD1 | Molina → Mezzolago 45.8812,10.7508 → Pieve di Ledro 45.8901,10.7320 |
| LD2 | Pieve → Pur 45.8696,10.7450 → Molina |
| VL2 | Pieve → Bezzecca 45.8969,10.7177 → Tiarno di Sotto 45.8937,10.6865 → Tiarno di Sopra 45.8884,10.6695 |
| TZ1 | Tiarno di Sopra → Rifugio Garibaldi 45.8441,10.6810 → Passo Tremalzo 45.8342,10.6857 |
| TZ2 | Passo Tremalzo → Passo Nota 45.8372,10.7443 |
| FT1 | Passo Nota → Bocca dei Fortini 45.8416,10.7672 |
| FT2 | Bocca dei Fortini → Passo Guil 45.8340,10.7902 |
| GU1 | Passo Guil → Pregasina 45.8517,10.8247 |
| P2 | Pregasina → Belvedere |
| MCa–MCd | Vesio 45.7927,10.7430 → Voltino 45.7837,10.7648 → Pieve di Tremosine 45.7712,10.7595 → Pregasio 45.7609,10.7449 → Vesio |
| MB1–MB3 | Riva lungolago 45.8840,10.8425 → Monte Brione 45.8850,10.8746 → Forte Garda 45.8772,10.8612 → Torbole 45.8693,10.8764 → Riva |
| TN1–TN4 | Riva → Varone 45.9077,10.8413 → Canale 45.9296,10.8266 → Lago di Tenno 45.9385,10.8158 → Campi 45.9114,10.8113 → Riva |
| CA, CT | Riva → Arco 45.9181,10.8861 → Torbole |
| AR1, AR2 | Arco → Laghel 45.9284,10.8849 → Arco |
| NG1–NG3 | Torbole → Nago 45.8776,10.8900 → Busatte 45.8649,10.8811 → Torbole |
| CO1–CO3 | Pieve di Ledro → Bezzecca → Lenzumo 45.9129,10.7270 → Malga Trat 45.9249,10.7611 → Legos 45.8678,10.7761 |
| NT1 | Vesio → Passo Nota |
| LM1 | Bocca dei Fortini → Limone 45.8141,10.7915 |

Nomi delle track, livelli ITRS e rating delle route sono in `src/data/garda.js`: inventati ma verosimili, a scopo di test.
