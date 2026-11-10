/*
 * ITRS Notebook (passo 2.4, contesto §4.9): consigli puntuali per ogni route, mostrati come
 * storie dentro la card della pagina route (4 barre come nel Figma 3625:18950).
 * Testi inventati ma coerenti con tracciati, track e livelli di prova (ITRS_dati_garda.md):
 * da sostituire con i consigli del cliente [P].
 *
 * Ogni consiglio: title (Mona Sans maiuscolo, al massimo 3 righe) e text (al massimo 4 righe).
 * Il titolo dice il quando o il per chi (pioggia, caldo, bambini, track n).
 */
const TIPS = {
  'malga-ciapa': [
    { title: 'Fill up before track 2',
      text: 'The fountain in Vesio is the last water: after it, 12.3 km without a refill until you’re back at the start.' },
    { title: 'After rain, skip the woods',
      text: 'Bosco di Tremosine has roots and clay. If it rained in the last 24 h, take the road via Voltino instead.' },
    { title: 'With kids? Shift down early',
      text: 'Salita Rocchetta (track 4) opens with a 12% ramp. Shift down before the bend after Pregasio and regroup at the top.' },
    { title: 'Stop at the viewpoint',
      text: 'Traverso Panorama Garda (track 3) has the best view of the lake: the bench after the hairpin is the place for a break.' },
  ],
  'tremalzo-xxl': [
    { title: 'Leave Riva by 8 am',
      text: 'Almost 8 hours in the saddle. Start early to reach Passo Tremalzo before the afternoon storms, common in summer.' },
    { title: 'Last water in Molina',
      text: 'Fill up at the end of track 5. On the climb and the military road there’s only the refuge at the pass, often closed.' },
    { title: 'Bring a front light',
      text: 'The military road (track 7) goes through unlit tunnels. Keep to the inside of the bends: the drops have no barrier.' },
    { title: 'Brakes before Pregasina',
      text: 'Discesa di Pregasina (track 10) is the only Advanced section. Check your pads at Bocca dei Fortini before you drop in.' },
  ],
  'passo-nota-limone': [
    { title: 'Plan the way back',
      text: 'The route ends in Limone, far from the start. Leave a second car there or book the bike shuttle to Passo Nota.' },
    { title: 'Check your brake pads',
      text: 'Discesa su Limone drops about 1,000 m in one go. Stop halfway to let the brakes cool down.' },
    { title: 'After rain, wait 48 h',
      text: 'Wet limestone on the descent is as slippery as ice. If it rained in the last two days, choose another route.' },
    { title: 'No water after Bondo',
      text: 'Carry at least 1.5 litres from the start: there’s no fountain between Valle di Bondo and Limone.' },
  ],
  'monte-brione': [
    { title: 'Hot day? Climb before 10',
      text: 'Salita del Brione (track 1) faces south with almost no shade. Start early and carry at least one litre of water.' },
    { title: 'Walk the drops first',
      text: 'Discesa Forte Garda (track 2) has three small drops. Look at them on foot the first time: each has a ride-around.' },
    { title: 'Slow down on the lake',
      text: 'The lakefront from Torbole to Riva is shared with walkers. In summer, ride it before 10 am or after 6 pm.' },
    { title: 'Visit the fort',
      text: 'Forte Garda, at the top of the climb, is open on summer weekends: a short stop before the descent.' },
  ],
  'lago-di-tenno': [
    { title: 'Single file on the climb',
      text: 'Salita di Tenno (track 2) gains 475 m in 3.6 km, mostly on asphalt with cars. Shift down early and ride in line.' },
    { title: 'Refill in Canale',
      text: 'The fountain in the square of Borgo di Canale is halfway, and it’s the last water before the long descent.' },
    { title: 'After rain, add 20 min',
      text: 'Discesa di Campi (track 4) is loose gravel and roots: when wet it’s slow and slippery. Or return by the Varone road.' },
    { title: 'Swim at Lago di Tenno',
      text: 'A short walk from the route, the lake has a small beach. In summer, bring a lock and a towel.' },
  ],
  'arco-laghel': [
    { title: 'With kids? Walk the ramp',
      text: 'Salita di Laghel (track 2) is the only real climb. Walk the steep part among the olive trees and regroup at the chapel.' },
    { title: 'Beat the Ora wind',
      text: 'From early afternoon the wind blows up the valley from the lake. Ride the Sarca path (track 4) in the morning.' },
    { title: 'Good on rainy days',
      text: '96% of the route is on cycle paths: a good choice when trails are wet. Watch out for slippery wooden bridges.' },
    { title: 'Ice cream in Arco',
      text: 'The old town of Arco is right on the route, after track 3: the perfect stop before riding back to the lake.' },
  ],
  'nago-busatte': [
    { title: 'Stop at the potholes',
      text: 'Leave the bikes at the gate of the Giant’s Potholes (track 2) and walk in: a 15 minute visit that kids love.' },
    { title: 'Saddle down for Busatte',
      text: 'Discesa delle Busatte (track 3) has steep hairpins on gravel. Lower your saddle and let kids walk the tightest ones.' },
    { title: 'Come by bus',
      text: 'The bus from Riva stops in Nago, right at the start. Bikes are allowed in summer, but space is limited.' },
    { title: 'Short but steep',
      text: 'Salita di Nago (track 1) climbs 156 m in 1.9 km. Take it slow at first: the rest of the route is easy.' },
  ],
  'lago-di-ledro': [
    { title: 'Beach stop at Pieve',
      text: 'Halfway, after 5.3 km, the beach in Pieve di Ledro has showers and a bar. Bring a swimsuit and a lock.' },
    { title: 'After rain, take the road',
      text: 'The path on the north shore (track 1) gets muddy under the trees. Use the road on that side, then the cycle path.' },
    { title: 'Ring your bell',
      text: 'The south shore (track 2) is busy with walkers in summer. Slow down near the beaches.' },
    { title: 'Perfect for a first ride',
      text: 'Flat, short and always close to a village: a good route to test the bike or ride with children.' },
  ],
  'concei-cima-oro': [
    { title: 'Eat before track 3',
      text: 'Salita a Malga Trat gains 712 m in 4.2 km on loose stone, with nowhere flat to recover.' },
    { title: 'Last water at Malga Trat',
      text: 'Fill up at the fountain at the end of track 3. There’s no water on the Cima d’Oro trail.' },
    { title: 'Clouds? Turn back by 2 pm',
      text: 'Cima d’Oro is exposed above 1,800 m. If storms build up, skip track 4 and go back down the way you came.' },
    { title: 'Walk the rocky steps',
      text: 'The Advanced part of track 4 has rocky steps and roots. There’s no shame in walking them.' },
  ],
}

export function tipsOf(routeId) {
  return TIPS[routeId] ?? []
}
