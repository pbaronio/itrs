import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import LevelShape, { SHAPE_PATHS } from './LevelShape.jsx'
import { FACTORS, LEVELS } from '../data/itrs.js'
import badgeDifficultyGreen from '../assets/badges/difficulty-green.webp'
import badgeExposureGreen from '../assets/badges/exposure-green.webp'
import minimapImg from '../assets/photos/minimap.webp'
import './Cards.css'

/*
 * Card e righe (§6 "Card"), dal Figma pagina UI Design:
 * card overlay (3625:17384), card listing (3625:17581), riga rating (3625:18875),
 * small card rating (3677:5163).
 */

/* ---------- Meta: distanza, dislivello, tempo ---------- */

export function Meta({ distance, climb, duration, level }) {
  return (
    <div className="meta t-sm">
      {level && (
        <span className="meta__item meta__item--level">
          <LevelShape level={level} size={14} />
          {FACTORS.difficulty.names[level]}
        </span>
      )}
      {distance && <span className="meta__item"><Icon name="distance" size={18} />{distance}</span>}
      {climb && <span className="meta__item"><Icon name="climb" size={18} />{climb}</span>}
      {duration && <span className="meta__item"><Icon name="duration" size={18} />{duration}</span>}
    </div>
  )
}

/* Etichetta livello Mona Sans 12 maiuscola, con forma */
export function LevelLabel({ level, factor = 'difficulty' }) {
  return (
    <span className="level-label">
      <LevelShape level={level} size={13} />
      <span className="t-display">{FACTORS[factor].names[level]}</span>
    </span>
  )
}

/* ---------- Card overlay (carosello) 347×125 ---------- */

export function RouteCard({ route, onClick, active }) {
  return (
    <button type="button" className={`route-card${active ? ' is-active' : ''}`} onClick={onClick}>
      <img className="route-card__img" src={route.photo} alt="" draggable="false" />
      <span className="route-card__body">
        <LevelLabel level={route.level} />
        <span className="route-card__title t-md-em">{route.name}</span>
        <Meta distance={route.distance} duration={route.duration} />
      </span>
    </button>
  )
}

/* ---------- Card listing 370 ---------- */

export function ListingCard({ route, saved, onSave, onClick }) {
  return (
    <article className="listing-card">
      <div className="listing-card__media">
        <PhotoGallery photos={route.photos ?? [route]} label={route.name} onClick={onClick} className="listing-card__gallery" />
        <button type="button" className="listing-card__save" aria-label={saved ? 'Saved' : 'Save'} aria-pressed={saved} onClick={onSave}>
          <Icon name="bookmarkFilled" size={16} />
        </button>
        <MiniMap route={route} />
      </div>
      <div className="listing-card__body">
        <h3 className="t-md-em">{route.name}</h3>
        <p className="t-sm listing-card__place">{route.place}</p>
        <Meta level={route.level} distance={route.distance} climb={route.climbLabel ?? route.climb} duration={route.duration} />
      </div>
    </article>
  )
}

/* ---------- Galleria foto: scorre col dito, punti in basso (card listing, pagina route) ---------- */

export function PhotoGallery({ photos, label, onClick, className = '' }) {
  const [index, setIndex] = useState(0)
  const ref = useRef(null)
  const onScroll = () => {
    const el = ref.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) setIndex(i)
  }
  const interactive = onClick ? {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } },
  } : { 'aria-label': label ? `Photos of ${label}` : undefined }
  return (
    <div className={`gallery ${className}`}>
      <div ref={ref} className="gallery__track" onScroll={onScroll} {...interactive}>
        {photos.map((p, i) => (
          <img
            key={i}
            src={p.photo}
            alt=""
            draggable="false"
            loading={i ? 'lazy' : undefined}
            style={{ objectPosition: p.photoPosition }}
          />
        ))}
      </div>
      {photos.length > 1 && <GalleryDots count={photos.length} index={index} />}
    </div>
  )
}

// Punti galleria (Figma): attivo pieno, gli altri al 70% e più piccoli allontanandosi
function GalleryDots({ count, index }) {
  const n = Math.min(count, 5)
  const start = Math.max(0, Math.min(index - 2, count - n))
  const dots = Array.from({ length: n }, (_, k) => start + k)
  let x = 0
  const items = dots.map((i) => {
    const r = Math.max(2, 3 - 0.25 * Math.abs(i - index))
    const cx = x + r
    x += 2 * r + 4
    return { i, r, cx }
  })
  const width = x - 4
  return (
    <span className="gallery__dots" aria-hidden="true">
      <svg width={width} height="6" viewBox={`0 0 ${width} 6`}>
        {items.map(({ i, r, cx }) => <circle key={i} cx={cx} cy="3" r={r} opacity={i === index ? 1 : 0.7} />)}
      </svg>
    </span>
  )
}

/* Mini-mappa 76 con il tracciato (card listing, pagina route) */
export function MiniMap({ route, className = '' }) {
  return (
    <span className={`listing-card__map ${className}`} aria-hidden="true">
      <img src={minimapImg} alt="" draggable="false" />
      <span className="listing-card__map-tint" />
      {route.points ? <MiniRoute points={route.points} level={route.level} /> : (
        <svg className="listing-card__map-route" width="58.86" height="25.82" viewBox="0 0 58.8645 25.8175">
          <path stroke={LEVELS[route.level].color} strokeWidth="1.72669" fill="none" d="M35.5758 16.205C36.544 15.0944 35.9175 15.8633 37.0282 15.4931C37.2779 15.4098 38.1433 15.5263 38.4061 15.5421C38.93 15.5736 39.6695 15.6219 40.6449 15.6924C43.0085 15.8633 40.9866 15.7494 41.6416 15.8633C42.2966 15.9772 42.2966 16.1481 43.4642 16.4328C44.6318 16.7176 43.7205 16.6891 44.0053 16.7461C44.29 16.8031 44.4609 17.0594 44.8026 17.1163C45.1444 17.1733 45.751 17.3157 45.9702 17.3157H47.9067H49.6154C50.3558 17.2302 50.8969 16.8315 51.4665 16.4328C52.036 16.0342 51.6089 16.1196 52.0967 15.0374C52.2119 14.7526 52.6341 14.8381 53.2321 14.4109C53.8301 13.9837 53.4884 14.2685 53.9156 14.2685C54.3427 14.2685 54.8269 14.4109 55.4819 14.2685C56.1369 14.1261 56.0514 14.297 56.8488 14.0692C57.5512 13.8685 57.7896 13.5131 57.9921 12.6138C58.0474 12.3684 57.8414 11.9952 57.7115 11.7797C57.5216 11.4645 57.2927 11.2789 56.9386 11.1787C56.5179 11.0596 56.0958 10.9094 56.0514 10.7879C55.9999 10.6467 55.5461 10.6305 55.1631 10.648C54.939 10.6582 54.7144 10.6641 54.4907 10.6468L52.2272 10.4718C52.1478 10.4657 52.0722 10.5067 52.0341 10.5766C52.0014 10.6366 51.9406 10.676 51.8724 10.6814L50.7336 10.7713C50.5938 10.7824 50.4533 10.7807 50.3138 10.7662L49.4107 10.6728C49.1247 10.6366 47.6387 9.4974 47.3968 9.34053C47.3578 9.31521 47.3169 9.28938 47.2741 9.26304C47.2476 9.24676 47.1934 9.15723 47.1807 9.12889C47.1138 8.98033 46.8516 8.82895 46.6887 8.82895H46.2792C46.2027 8.82895 46.1293 8.85936 46.0751 8.91349L45.9553 9.0333C45.8245 9.16415 45.647 9.23766 45.462 9.23766H44.9846C44.7471 9.23766 44.51 9.21062 44.288 9.12601C43.6985 8.90123 42.597 8.36479 41.153 7.34737C40.9307 7.16955 40.5775 6.87288 40.2412 6.58717C39.7677 6.18487 39.1854 5.93958 38.5872 5.77195C38.5602 5.76439 38.5332 5.75663 38.5062 5.74868C38.0142 5.60347 37.5677 5.43036 37.0767 5.28164C36.7321 5.17727 36.3196 5.10864 35.9598 5.09466C35.4444 5.07463 34.6189 5.0142 33.479 4.87193C33.0781 4.82189 32.682 4.73498 32.3026 4.59609C31.0484 4.13694 29.6369 3.44899 28.7178 2.96669C28.3364 2.7666 28.0626 2.41229 27.9517 1.99619L27.8588 1.64794C27.7707 1.31758 27.5139 1.05879 27.1843 0.968135L26.9116 0.893157C26.3444 0.737167 25.8122 1.23478 25.9299 1.81119C26.0468 2.38424 25.9366 2.47041 25.4402 2.16113C25.2093 2.01728 24.9169 1.85591 24.5491 1.67649C22.4544 0.654716 20.9217 1.11452 18.1118 3.0559C15.302 4.99728 10.8572 4.79292 11.2148 5.45708C11.3586 5.72403 11.5083 6.5868 11.6369 7.55424C11.8666 9.28266 11.3061 11.0119 10.1931 12.3541L8.11296 15.2342C7.73045 15.7639 7.27342 16.2341 6.77639 16.6581C5.98515 17.3332 5.10504 18.1617 5.13526 18.4337C5.16291 18.6825 4.38163 20.5039 3.60434 22.2311C2.96982 23.641 1.69194 24.6513 0.179679 24.9731" />
          <circle cx="33.8993" cy="18.3788" r="2.83996" fill="var(--text-strong-950)" />
        </svg>
      )}
    </span>
  )
}


/* Percorso vero nella mini-mappa: tracciato adattato al cerchio da 76, partenza nera */
function MiniRoute({ points, level }) {
  const size = 76
  const pad = 16
  const k = Math.cos((points[0][1] * Math.PI) / 180)
  const xs = points.map((p) => p[0] * k)
  const ys = points.map((p) => -p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = (size - 2 * pad) / Math.max(maxX - minX, maxY - minY, 1e-9)
  const ox = (size - (maxX - minX) * scale) / 2
  const oy = (size - (maxY - minY) * scale) / 2
  const step = Math.max(1, Math.floor(points.length / 120))
  const pts = points.filter((_, i) => i % step === 0 || i === points.length - 1)
    .map((p) => [ox + (p[0] * k - minX) * scale, oy + (-p[1] - minY) * scale])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  return (
    <svg className="listing-card__map-route listing-card__map-route--real" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={d} stroke={LEVELS[level].color} strokeWidth="1.73" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r="2.84" fill="var(--text-strong-950)" />
    </svg>
  )
}

/* ---------- Pentagono piccolo 47 (righe rating) ---------- */

const PENTAGON = 'M27.3933 4.76393C28.7952 3.74536 30.6936 3.74536 32.0956 4.76393L49.8397 17.6558C51.2416 18.6744 51.8283 20.4798 51.2928 22.1279L44.5151 42.9874C43.9796 44.6355 42.4438 45.7514 40.7109 45.7514H18.7779C17.045 45.7514 15.5092 44.6355 14.9737 42.9874L8.19605 22.1279C7.66055 20.4798 8.24718 18.6744 9.64913 17.6558L27.3933 4.76393Z'

// Simboli ITRS dentro il pentagono (stesso sistema di coordinate del Figma)
const FACTOR_SYMBOL = {
  exposure: (fill) => (
    <g fill={fill}>
      <path d="M21.7464 17.8783L23.9132 17.8728C24.3471 17.8725 24.8588 17.8601 25.2873 17.8831C25.4074 18.0699 25.7958 19.0805 25.8902 19.3171L26.8513 21.7307C27.0522 22.2356 27.2527 22.7725 27.4804 23.2621L28.9491 23.9795C29.3304 24.1619 29.9866 24.4271 30.2697 24.7093C30.4716 25.6139 30.6672 26.5158 30.867 27.4249C30.9964 28.0138 31.1098 28.7761 31.3134 29.3391C31.3678 29.4898 31.8242 29.965 31.9597 30.1171L33.2008 31.5179C33.3647 31.7037 33.8158 32.1972 33.9324 32.3816C34.1522 32.7294 34.4083 33.4581 34.5648 33.8657C34.7629 34.3812 35.0056 34.9382 35.1918 35.4482C34.4756 35.4256 33.6876 35.4405 32.9656 35.4404L28.9846 35.4399C26.632 35.4398 24.0937 35.393 21.7533 35.453C21.7333 34.2566 21.7534 32.9918 21.7534 31.7916L21.7534 22.7667C21.7534 21.1591 21.7765 19.4827 21.7464 17.8783Z" />
      <path d="M34.2374 17.8744C35.3611 17.8494 36.6142 17.8666 37.7442 17.8755C37.6966 18.1159 37.6732 18.5094 37.6501 18.7615C37.5938 19.3683 37.5426 19.9755 37.4966 20.5831C37.3429 22.2177 37.2007 23.8534 37.0702 25.49C37.0581 25.6957 37.0309 25.9209 37.01 26.1275C36.3158 26.1205 35.6216 26.1235 34.9275 26.1367C34.9181 25.5845 34.8121 24.9801 34.7798 24.4234C34.6542 22.2577 34.316 20.0373 34.2374 17.8744Z" />
      <path d="M34.7525 27.6329C34.9951 27.6184 35.387 27.6372 35.64 27.6388C36.1707 27.6432 36.7013 27.6392 37.2318 27.627C37.2144 27.8847 37.2348 30.0452 37.2153 30.0919C36.386 30.083 35.5566 30.0831 34.7273 30.0924C34.7206 29.8326 34.7038 27.7131 34.7525 27.6329Z" />
    </g>
  ),
  fitness: (fill) => (
    <path fill={fill} d="M39.7444 23.6227C39.7444 29.8727 30.4774 34.9316 30.0828 35.1406C29.9788 35.1965 29.8625 35.2258 29.7444 35.2258C29.6263 35.2258 29.51 35.1965 29.406 35.1406C29.1069 34.9798 23.7319 32.0432 21.131 27.9182C21.0975 27.8642 21.079 27.8022 21.0774 27.7386C21.0758 27.675 21.0913 27.6122 21.1221 27.5566C21.153 27.501 21.1981 27.4546 21.2529 27.4223C21.3077 27.3899 21.3701 27.3728 21.4337 27.3727H24.7444C24.862 27.3728 24.9779 27.3438 25.0816 27.2883C25.1853 27.2329 25.2738 27.1527 25.3391 27.0548L26.173 25.8048L28.4355 29.1977C28.5222 29.3277 28.6491 29.4257 28.7968 29.4767C28.9446 29.5276 29.1049 29.5287 29.2533 29.4798C29.4107 29.4267 29.5452 29.3215 29.6346 29.1816L30.8408 27.3727H32.6016C32.6995 27.3729 32.7964 27.353 32.8863 27.3142C32.9762 27.2754 33.0571 27.2185 33.1241 27.147C33.1911 27.0756 33.2427 26.9912 33.2757 26.899C33.3087 26.8068 33.3223 26.7088 33.3158 26.6111C33.2999 26.4275 33.2151 26.2567 33.0784 26.133C32.9418 26.0093 32.7635 25.9419 32.5792 25.9441H30.4587C30.3411 25.944 30.2252 25.973 30.1215 26.0285C30.0178 26.0839 29.9293 26.1641 29.8641 26.262L29.0301 27.512L26.7676 24.1191C26.6809 23.9891 26.554 23.8911 26.4063 23.8401C26.2585 23.7892 26.0982 23.7881 25.9498 23.837C25.7924 23.8901 25.658 23.9953 25.5685 24.1352L24.3623 25.9441H20.4167C20.3404 25.9443 20.266 25.9201 20.2045 25.8749C20.1429 25.8298 20.0975 25.7661 20.0748 25.6932C19.8593 25.024 19.7479 24.3257 19.7444 23.6227C19.7461 22.155 20.3298 20.748 21.3676 19.7102C22.4054 18.6724 23.8125 18.0886 25.2801 18.087C27.1239 18.087 28.7382 18.8798 29.7444 20.22C30.7507 18.8798 32.3649 18.087 34.2087 18.087C35.6764 18.0886 37.0834 18.6724 38.1212 19.7102C39.159 20.748 39.7428 22.155 39.7444 23.6227Z" />
  ),
  wilderness: (fill) => (
    <g fill={fill}>
      <path d="M22.0699 19.0838C22.2047 19.0743 22.3909 19.0798 22.5297 19.0797C22.9594 19.3377 23.5915 20.4355 23.9349 20.873C24.3277 21.3734 24.7703 21.9916 25.1193 22.5189C25.5722 23.2133 24.4371 23.8162 23.9737 24.1869C22.646 25.2488 22.9434 25.6407 23.918 26.8093L24.8698 27.9697L28.7349 32.7152C28.8541 32.8624 29.0031 33.0538 29.1599 33.1614C30.403 34.0146 31.6849 31.8176 32.4504 31.9132C32.577 31.929 32.6696 32.0056 32.7625 32.0872C33.2074 32.478 33.6008 32.959 34.0173 33.3834C34.4087 33.7754 34.7975 34.1701 35.1836 34.5674C35.7936 35.1929 36.2757 35.4874 35.2976 36.143C34.8619 36.5183 33.9981 36.8778 33.4515 37.0801C32.0847 37.5857 30.9067 37.7042 29.5655 37.0869C25.9395 35.4179 21.0116 29.2502 19.6544 25.5715C19.1752 24.2728 19.048 23.2462 19.6442 21.9632C20.0008 21.1955 21.2482 19.3842 22.0699 19.0838Z" />
      <path d="M32.4322 15.8329C33.5652 15.7788 35.0525 15.8267 36.2176 15.8181C36.2102 17.1525 36.2132 18.4869 36.2267 19.8213C36.4283 19.794 37.2552 19.8147 37.5 19.8154C38.4299 19.8183 39.3098 19.8258 40.2415 19.7852C40.1817 20.8542 40.2205 22.4549 40.2442 23.5405C39.3415 23.5246 38.4386 23.5196 37.5357 23.5254C37.1393 23.5265 36.5813 23.5543 36.2081 23.5227C36.2408 24.8461 36.2191 26.2718 36.2198 27.6032C36.0461 27.569 35.0843 27.5712 34.8441 27.5761C34.0729 27.5919 33.204 27.5511 32.4441 27.5938C32.4501 26.7309 32.4506 25.868 32.4457 25.0052C32.4432 24.581 32.4176 23.9283 32.4603 23.524C31.6612 23.5553 30.8292 23.5029 30.0269 23.5244C29.5067 23.5383 28.9707 23.5014 28.4524 23.5502L28.4516 19.7877C28.8124 19.8299 29.2462 19.8061 29.611 19.8185C30.5234 19.8493 31.5688 19.7728 32.4622 19.815C32.3832 18.6053 32.4874 17.0932 32.4322 15.8329Z" />
    </g>
  ),
}

export function Pentagon({ factor, level, size = 47 }) {
  const { color, shape } = LEVELS[level]
  return (
    <svg className="pentagon" width={size} height={size} viewBox="6.14 3.06 47.2 47.2" aria-hidden="true" focusable="false">
      <path d={PENTAGON} fill="var(--sabbia-dark)" />
      {factor === 'difficulty' ? (
        <svg x="17.29" y="14.21" width="24.9" height="24.9" viewBox="0 0 14 14">{SHAPE_PATHS[shape](color)}</svg>
      ) : (
        FACTOR_SYMBOL[factor](color)
      )}
    </svg>
  )
}

/* ---------- Riga rating (route) ---------- */

export function RatingRow({ factor, level, description, onClick }) {
  const label = factor === 'difficulty' ? 'Difficulty level' : FACTORS[factor].label
  return (
    <button type="button" className="rating-row" onClick={onClick}>
      <Pentagon factor={factor} level={level} />
      <span className="rating-row__text">
        <span className="t-label">{label}</span>
        <span className="t-md-em rating-row__value">{FACTORS[factor].names[level]}</span>
        {description && <span className="t-sm rating-row__desc">{description}</span>}
      </span>
      <Icon name="chevronRight" size={24} className="rating-row__chevron" />
    </button>
  )
}

/* ---------- Small card rating (track) 181×194 ---------- */

// Badge in rilievo disponibili nel Figma; gli altri usano il pentagono piatto
const BADGES = {
  'difficulty-green': badgeDifficultyGreen,
  'exposure-green': badgeExposureGreen,
}

export function Badge({ factor, level, className }) {
  const src = BADGES[`${factor}-${level}`]
  if (src) return <img className={className} src={src} alt="" draggable="false" />
  return <span className={className}><Pentagon factor={factor} level={level} size="100%" /></span>
}

export function RatingCard({ factor, level, onClick }) {
  const label = factor === 'difficulty' ? 'Difficulty level' : FACTORS[factor].label
  return (
    <button type="button" className="rating-card" onClick={onClick}>
      <Badge factor={factor} level={level} className="rating-card__badge" />
      <span className="t-label">{label}</span>
      <span className="t-lg-em rating-card__value">{FACTORS[factor].names[level]}</span>
    </button>
  )
}
