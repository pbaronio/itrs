/*
 * Testi dei bottom sheet informativi (contesto §4.8): spiegano un livello ITRS.
 *
 * - Difficulty Beginner: testo del Figma (3625:20072).
 * - Altri livelli di Difficulty ed Exposure: riscritti dalle definizioni pubbliche ITRS
 *   (wiki OpenStreetMap, chiavi mtb:scale:itrs:*). Da verificare col cliente [P].
 * - Fitness e Wilderness: le definizioni per livello non sono pubbliche. Il testo spiega
 *   il fattore (definizioni di Garda Trentino) e, per Fitness, riporta i numeri della route.
 *   Da sostituire coi testi del cliente [P].
 */
import { fmtDuration } from './garda.js'

const DIFFICULTY = {
  green: {
    title: 'Perfect For Beginners and families',
    text: 'Suitable for anyone who can confidently and safely ride a bicycle, including families with children. No previous mountain biking experience or specific technical skills are required.',
  },
  blue: {
    title: 'Basic mountain bike skills',
    text: 'You should already know how to position your body on the bike, brake on loose ground, ride through corners and choose a line.',
  },
  red: {
    title: 'Well-practised skills',
    text: 'Steeper and more varied terrain, with tight corners, jumps and drops. You need to be able to lift the front and the rear wheel.',
  },
  black: {
    title: 'Precise and confident riding',
    text: 'Very tight corners and larger jumps, drops and obstacles. Requires precise braking and balance, for example pivoting on the front wheel.',
  },
  orange: {
    title: 'Professional skills',
    text: 'Professional-level downhill, freeride, slopestyle or trials skills.',
  },
}

const EXPOSURE = {
  green: {
    title: 'Normal injury risk',
    text: 'A fall here is no worse than a fall on the trail itself.',
  },
  blue: {
    title: 'Serious injury is likely',
    text: 'For example a steep slope where a fall can still be stopped, or a drop of about 2 m beside the trail.',
  },
  red: {
    title: 'A fall could be fatal',
    text: 'For example steep ground above a drop of about 4 m, with some chance to stop.',
  },
  black: {
    title: 'A fall is fatal',
    text: 'A vertical drop directly beside the trail, with no chance to stop.',
  },
}

export function levelInfo(factor, level, route) {
  if (factor === 'difficulty') return DIFFICULTY[level]
  if (factor === 'exposure') return EXPOSURE[level]
  if (factor === 'fitness') {
    return {
      title: 'How demanding the whole route is',
      text: route
        ? `Fitness rates the combined effect of length, climbing and descent over the whole route: ${route.distance}, ${route.climbLabel}, ${fmtDuration(route.minutes)}.`
        : 'Fitness rates the combined effect of length, climbing and descent over the whole route.',
    }
  }
  return {
    title: 'How much planning you need',
    text: 'Wilderness rates the planning the route needs, considering rescue options, mobile phone reception, water supply and dangerous wildlife.',
  }
}
