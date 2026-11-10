import { LEVELS, FACTORS } from '../data/itrs.js'
import { SHAPE_PATHS } from './LevelShape.jsx'
import './ItrsCircle.css'

/*
 * Cerchio ITRS (Figma 3625:18874, istruzioni §5 "Cerchio ITRS"): 262 di diametro, 4 quadranti.
 * Senso orario da in alto a sinistra: Difficulty, Fitness, Exposure, Wilderness.
 * Ogni quadrante ha il colore del suo livello e un'icona bianca; divisori sabbia;
 * etichette text-soft-500 curve lungo il bordo esterno.
 * Quadrante, icone e divisori sono i tracciati del Figma; l'icona di Difficulty è la forma
 * del livello (cerchio per Beginner, quadrato per Intermediate…), alla stessa scala del Figma.
 */
const R = 131.25
const W = 370                  // larghezza della card: le etichette escono dal cerchio
const H = 350
const CX = W / 2
const CY = 175.09

// Quadrante in alto a sinistra (Vector 15), gli altri sono il suo specchio
const QUAD = 'M131.273 131.295H0C6.38942 21.4992 94.8377 1.69046 131.273 0V131.295Z'

// Icone bianche del Figma, con il loro riquadro e il centro rispetto al centro del cerchio
const ICONS = {
  fitness: {
    w: 43.7149, h: 38, dx: 54.58, dy: -55.4,
    body: <path d="M41.8316 12.9408C41.8316 25.4245 23.3219 35.5291 22.5336 35.9464C22.3258 36.0582 22.0936 36.1167 21.8577 36.1167C21.6218 36.1167 21.3895 36.0582 21.1818 35.9464C20.5844 35.6254 9.84838 29.7599 4.65339 21.5206C4.58637 21.4127 4.5494 21.2889 4.54628 21.1619C4.54316 21.0349 4.57401 20.9093 4.63564 20.7983C4.69727 20.6872 4.78745 20.5946 4.89685 20.53C5.00626 20.4654 5.13092 20.4312 5.25795 20.431H11.8707C12.1057 20.4311 12.337 20.3733 12.5442 20.2625C12.7514 20.1518 12.9281 19.9915 13.0585 19.7961L14.7242 17.2994L19.2433 24.0762C19.4164 24.3359 19.67 24.5317 19.965 24.6335C20.2601 24.7352 20.5804 24.7375 20.8768 24.6398C21.1911 24.5337 21.4597 24.3236 21.6383 24.0441L24.0477 20.431H27.5645C27.7601 20.4314 27.9537 20.3916 28.1332 20.3141C28.3128 20.2366 28.4745 20.1229 28.6083 19.9803C28.7421 19.8376 28.8451 19.669 28.911 19.4848C28.9769 19.3006 29.0042 19.1049 28.9912 18.9098C28.9593 18.543 28.7899 18.202 28.5171 17.9549C28.2442 17.7078 27.888 17.573 27.5199 17.5776H23.2844C23.0495 17.5774 22.8181 17.6353 22.6109 17.746C22.4037 17.8568 22.2271 18.017 22.0967 18.2125L20.431 20.7092L15.9119 13.9323C15.7387 13.6726 15.4852 13.4769 15.1901 13.3751C14.8951 13.2733 14.5748 13.2711 14.2783 13.3688C13.9641 13.4749 13.6954 13.685 13.5168 13.9644L11.1075 17.5776H3.22668C3.07422 17.578 2.92564 17.5296 2.80271 17.4394C2.67979 17.3492 2.589 17.222 2.54364 17.0764C2.11334 15.7398 1.8908 14.345 1.88379 12.9408C1.88709 10.0093 3.05308 7.19882 5.12595 5.12595C7.19882 3.05308 10.0093 1.88709 12.9408 1.88379C16.6235 1.88379 19.8478 3.46743 21.8577 6.14429C23.8676 3.46743 27.0919 1.88379 30.7746 1.88379C33.7061 1.88709 36.5166 3.05308 38.5894 5.12595C40.6623 7.19882 41.8283 10.0093 41.8316 12.9408Z" />,
  },
  exposure: {
    w: 31.3642, h: 34.4821, dx: 54.58, dy: 52.78,
    body: (
      <>
        <path d="M0.00383356 0.0316693L4.25126 0.0207577C5.10192 0.020338 6.10498 -0.00405643 6.94488 0.0411127C7.18038 0.407135 7.94164 2.38828 8.12678 2.85209L10.0107 7.58326C10.4044 8.57289 10.7974 9.62547 11.2438 10.5852L14.1229 11.9914C14.8702 12.3488 16.1565 12.8688 16.7115 13.422C17.1072 15.1953 17.4908 16.9632 17.8824 18.7452C18.1361 19.8995 18.3584 21.3938 18.7574 22.4975C18.8641 22.7928 19.7588 23.7243 20.0243 24.0224L22.4571 26.7684C22.7785 27.1325 23.6628 28.0999 23.8912 28.4614C24.322 29.1432 24.8241 30.5716 25.131 31.3706C25.5192 32.3811 25.9949 33.4729 26.3601 34.4727C24.9561 34.4284 23.4113 34.4576 21.9961 34.4573L14.1925 34.4564C9.58085 34.4562 4.60516 34.3645 0.0174212 34.4821C-0.0218723 32.1369 0.0175784 29.6576 0.0176309 27.305L0.0176837 9.61399C0.0175788 6.46269 0.0628525 3.17657 0.00383356 0.0316693Z" />
        <path d="M24.4901 0.0254256C26.6928 -0.0235733 29.1493 0.0102647 31.3642 0.0276293C31.2709 0.498942 31.225 1.27033 31.1798 1.76446C31.0694 2.95381 30.9691 4.14411 30.879 5.33514C30.5776 8.53942 30.2989 11.7457 30.0431 14.9539C30.0193 15.357 29.966 15.7985 29.9251 16.2035C28.5643 16.1897 27.2034 16.1957 25.8428 16.2214C25.8245 15.139 25.6166 13.9543 25.5532 12.863C25.3071 8.61769 24.6442 4.26519 24.4901 0.0254256Z" />
        <path d="M25.4993 19.1562C25.9747 19.1278 26.743 19.1647 27.239 19.1679C28.2791 19.1764 29.3193 19.1686 30.3592 19.1447C30.3251 19.6499 30.3651 23.8849 30.3268 23.9765C28.7012 23.9589 27.0755 23.9592 25.4499 23.9773C25.4367 23.4682 25.4038 19.3135 25.4993 19.1562Z" />
      </>
    ),
  },
  wilderness: {
    w: 33.6268, h: 34.7472, dx: -55.73, dy: 51.02,
    body: (
      <>
        <path d="M4.52445 5.24726C4.7402 5.23203 5.03835 5.24082 5.26059 5.24067C5.94872 5.65384 6.96088 7.41167 7.51086 8.11231C8.13977 8.91349 8.84851 9.90346 9.40732 10.7479C10.1326 11.8598 8.315 12.8252 7.57289 13.4187C5.44684 15.1192 5.92305 15.7467 7.48365 17.6179L9.00781 19.476L15.1969 27.0749C15.3878 27.3107 15.6264 27.6171 15.8775 27.7894C17.868 29.1557 19.9207 25.6376 21.1465 25.7907C21.3492 25.816 21.4975 25.9386 21.6462 26.0693C22.3586 26.6951 22.9885 27.4653 23.6555 28.1449C24.2823 28.7726 24.9048 29.4046 25.5231 30.0408C26.4998 31.0424 27.2719 31.5139 25.7056 32.5637C25.0079 33.1647 23.6247 33.7405 22.7495 34.0643C20.5608 34.8739 18.6745 35.0638 16.5269 34.0753C10.7207 31.4027 2.82975 21.5266 0.656455 15.6358C-0.110749 13.5563 -0.314468 11.9124 0.640135 9.85793C1.21126 8.62874 3.20856 5.72823 4.52445 5.24726Z" />
        <path d="M21.1172 0.0419031C22.9313 -0.0447099 25.3129 0.0320725 27.1787 0.0182335C27.1667 2.15497 27.1716 4.29176 27.1932 6.42845C27.5159 6.38483 28.8402 6.4179 29.2321 6.4191C30.7211 6.42368 32.13 6.4357 33.622 6.37076C33.5263 8.0824 33.5884 10.6456 33.6263 12.384C32.1808 12.3586 30.7351 12.3505 29.2893 12.3597C28.6545 12.3616 27.7609 12.406 27.1634 12.3555C27.2158 14.4746 27.181 16.7575 27.1822 18.8895C26.904 18.8347 25.3639 18.8383 24.9792 18.8462C23.7444 18.8714 22.3529 18.8061 21.1362 18.8745C21.1457 17.4928 21.1466 16.111 21.1387 14.7293C21.1347 14.0501 21.0937 13.005 21.1621 12.3575C19.8826 12.4077 18.5502 12.3237 17.2656 12.3581C16.4325 12.3805 15.5743 12.3214 14.7444 12.3995L14.7432 6.37477C15.3208 6.44234 16.0155 6.40421 16.5996 6.42397C18.0606 6.47331 19.7346 6.35076 21.1651 6.41838C21.0388 4.4814 21.2055 2.0601 21.1172 0.0419031Z" />
      </>
    ),
  },
}

// Difficulty: forma del livello alla scala del Figma (cerchio Beginner r 17.26 → riquadro 53.7)
const SHAPE_BOX = (17.2595 / 4.5) * 14
const DIFF = { dx: -54.73, dy: -55.4 }

// Quadranti: specchio del primo, angolo centrale per le etichette
const QUADRANTS = {
  difficulty: { sx: 1, sy: 1, label: 'Difficulty level', angle: -135, top: true },
  fitness:    { sx: -1, sy: 1, label: 'Fitness', angle: -45, top: true },
  exposure:   { sx: -1, sy: -1, label: 'Exposure', angle: 45, top: false },
  wilderness: { sx: 1, sy: -1, label: 'Wilderness', angle: 135, top: false },
}

const rad = (deg) => (deg * Math.PI) / 180
const pt = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))]

// Arco per l'etichetta: in alto in senso orario (testo verso l'esterno), in basso al contrario
// (testo leggibile, con la parte alta delle lettere verso il cerchio)
function arc(angle, top) {
  const r = top ? R + 6 : R + 16
  const a0 = angle - 40, a1 = angle + 40
  const [x0, y0] = pt(r, top ? a0 : a1)
  const [x1, y1] = pt(r, top ? a1 : a0)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 ${top ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export default function ItrsCircle({ ratings }) {
  const summary = Object.keys(QUADRANTS)
    .map((f) => `${FACTORS[f].label}: ${FACTORS[f].names[ratings[f]]}`)
    .join(', ')
  return (
    <svg className="itrs-circle" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ITRS rating. ${summary}`}>
      <defs>
        {Object.entries(QUADRANTS).map(([f, q]) => <path key={f} id={`itrs-arc-${f}`} d={arc(q.angle, q.top)} />)}
      </defs>
      {Object.entries(QUADRANTS).map(([f, q]) => (
        <path
          key={f}
          d={QUAD}
          fill={LEVELS[ratings[f]].color}
          transform={`translate(${CX} ${CY}) scale(${q.sx} ${q.sy}) translate(-131.273 -131.295)`}
        />
      ))}
      <line className="itrs-circle__divider" x1={CX - R} x2={CX + R} y1={CY} y2={CY} />
      <line className="itrs-circle__divider" x1={CX} x2={CX} y1={CY - R} y2={CY + R} />

      <svg
        x={CX + DIFF.dx - SHAPE_BOX / 2}
        y={CY + DIFF.dy - SHAPE_BOX / 2}
        width={SHAPE_BOX}
        height={SHAPE_BOX}
        viewBox="0 0 14 14"
      >
        {SHAPE_PATHS[LEVELS[ratings.difficulty].shape]('var(--gray-0)')}
      </svg>
      {Object.entries(ICONS).map(([f, ic]) => (
        <g key={f} fill="var(--gray-0)" transform={`translate(${(CX + ic.dx - ic.w / 2).toFixed(2)} ${(CY + ic.dy - ic.h / 2).toFixed(2)})`}>
          {ic.body}
        </g>
      ))}

      {Object.entries(QUADRANTS).map(([f, q]) => (
        <text key={f} className="itrs-circle__label">
          <textPath href={`#itrs-arc-${f}`} startOffset="50%" textAnchor="middle">{q.label}</textPath>
        </text>
      ))}
    </svg>
  )
}
