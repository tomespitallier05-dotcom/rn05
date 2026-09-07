/**
 * Illustrations schématiques : elles suggèrent l'interface sans montrer
 * de vraies données. Aucun nom, aucune photo, aucune information réelle
 * — contrainte de la page publique.
 *
 * Palette identique au design system. Tout est en SVG inline : pas de
 * fichier image à charger, mise à l'échelle parfaite, et le contenu
 * reste modifiable.
 */

const NUIT = '#0B1F3A'
const PRIMAIRE = '#12386E'
const CLAIR = '#E8EEF7'
const BORDURE = '#E4E7EC'
const SURFACE = '#FFFFFF'
const TEXTE_FANTOME = '#D4DBE5'

const REUNION = '#2563EB'
const EVENEMENT = '#B3121A'
const DEPLACEMENT = '#B45309'
const PERMANENCE = '#15803D'

const cadre = {
  width: '100%',
  height: 'auto',
  display: 'block',
} as const

/** Barres grises simulant du texte, sans écrire de fausses données. */
function Ligne({
  x,
  y,
  w,
  h = 6,
  fill = TEXTE_FANTOME,
  rx = 3,
}: {
  x: number
  y: number
  w: number
  h?: number
  fill?: string
  rx?: number
}) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
}

/* ----------------------------------------------------------------
   AGENDA — grille mensuelle avec quelques blocs colorés
   ---------------------------------------------------------------- */
export function IllustrationAgenda() {
  const colonnes = 7
  const lignes = 4
  const cw = 40
  const ch = 34
  const x0 = 16
  const y0 = 46

  const evenements = [
    { c: 1, l: 0, couleur: REUNION, w: 30 },
    { c: 3, l: 0, couleur: PERMANENCE, w: 24 },
    { c: 2, l: 1, couleur: EVENEMENT, w: 32 },
    { c: 5, l: 1, couleur: REUNION, w: 26 },
    { c: 0, l: 2, couleur: DEPLACEMENT, w: 30 },
    { c: 4, l: 2, couleur: REUNION, w: 28 },
    { c: 6, l: 3, couleur: PERMANENCE, w: 24 },
    { c: 2, l: 3, couleur: EVENEMENT, w: 30 },
  ]

  return (
    <svg viewBox="0 0 320 200" style={cadre} role="img" aria-label="Vue mensuelle d'un agenda avec des événements de couleurs différentes">
      <rect x="0" y="0" width="320" height="200" rx="12" fill={SURFACE} stroke={BORDURE} />

      {/* barre d'outils */}
      <Ligne x={16} y={18} w={56} h={8} fill={NUIT} />
      <rect x={236} y={14} width={30} height={16} rx={8} fill={CLAIR} />
      <rect x={270} y={14} width={34} height={16} rx={8} fill={PRIMAIRE} />

      {/* en-têtes de jours */}
      {Array.from({ length: colonnes }).map((_, c) => (
        <Ligne key={`j${c}`} x={x0 + c * cw + 10} y={38} w={16} h={4} />
      ))}

      {/* grille */}
      {Array.from({ length: lignes }).map((_, l) =>
        Array.from({ length: colonnes }).map((_, c) => (
          <rect
            key={`${l}-${c}`}
            x={x0 + c * cw}
            y={y0 + l * ch}
            width={cw}
            height={ch}
            fill="none"
            stroke={BORDURE}
          />
        )),
      )}

      {/* jour courant */}
      <circle cx={x0 + 3 * cw + 8} cy={y0 + 1 * ch + 8} r="7" fill={PRIMAIRE} />

      {/* blocs d'événements */}
      {evenements.map((e, i) => (
        <g key={i}>
          <rect
            x={x0 + e.c * cw + 4}
            y={y0 + e.l * ch + 16}
            width={e.w}
            height={10}
            rx={2}
            fill={e.couleur}
            opacity="0.14"
          />
          <rect
            x={x0 + e.c * cw + 4}
            y={y0 + e.l * ch + 16}
            width={2.5}
            height={10}
            rx={1}
            fill={e.couleur}
          />
        </g>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------------------
   ANNUAIRE — cartes membres anonymes
   ---------------------------------------------------------------- */
export function IllustrationAnnuaire() {
  const cartes = [0, 1, 2, 3, 4, 5]
  const cw = 92
  const ch = 74
  const x0 = 16
  const y0 = 52

  return (
    <svg viewBox="0 0 320 200" style={cadre} role="img" aria-label="Annuaire des membres présenté en cartes uniformes">
      <rect x="0" y="0" width="320" height="200" rx="12" fill={SURFACE} stroke={BORDURE} />

      {/* barre de recherche */}
      <rect x={16} y={16} width={190} height={22} rx={8} fill={SURFACE} stroke={BORDURE} />
      <circle cx={30} cy={27} r="5" fill="none" stroke={TEXTE_FANTOME} strokeWidth="2" />
      <Ligne x={42} y={24} w={70} h={6} />
      <rect x={216} y={16} width={40} height={22} rx={8} fill={CLAIR} />
      <rect x={264} y={16} width={40} height={22} rx={8} fill={CLAIR} />

      {cartes.map((i) => {
        const c = i % 3
        const l = Math.floor(i / 3)
        const x = x0 + c * (cw + 8)
        const y = y0 + l * (ch + 8)
        return (
          <g key={i}>
            <rect x={x} y={y} width={cw} height={ch} rx={8} fill={SURFACE} stroke={BORDURE} />
            <circle cx={x + cw / 2} cy={y + 22} r="13" fill={CLAIR} />
            <circle cx={x + cw / 2} cy={y + 18} r="4.5" fill={PRIMAIRE} opacity="0.45" />
            <path
              d={`M ${x + cw / 2 - 8} ${y + 32} a 8 8 0 0 1 16 0 z`}
              fill={PRIMAIRE}
              opacity="0.45"
            />
            <Ligne x={x + 20} y={y + 44} w={52} h={6} />
            <Ligne x={x + 28} y={y + 56} w={36} h={5} />
          </g>
        )
      })}
    </svg>
  )
}

/* ----------------------------------------------------------------
   ANNONCES — fil d'annonces avec une épinglée
   ---------------------------------------------------------------- */
export function IllustrationAnnonces() {
  return (
    <svg viewBox="0 0 320 200" style={cadre} role="img" aria-label="Fil d'annonces internes avec une annonce épinglée">
      <rect x="0" y="0" width="320" height="200" rx="12" fill={SURFACE} stroke={BORDURE} />

      <Ligne x={16} y={18} w={70} h={8} fill={NUIT} />

      {/* annonce épinglée */}
      <rect x={16} y={38} width={288} height={48} rx={8} fill={CLAIR} stroke={BORDURE} />
      <rect x={16} y={38} width={3} height={48} rx={1.5} fill={EVENEMENT} />
      <rect x={28} y={48} width={44} height={12} rx={6} fill={EVENEMENT} opacity="0.16" />
      <Ligne x={34} y={51} w={32} h={5} fill={EVENEMENT} />
      <Ligne x={82} y={51} w={110} h={6} fill={NUIT} />
      <Ligne x={28} y={68} w={210} h={5} />

      {/* annonces suivantes */}
      {[96, 138].map((y, i) => (
        <g key={i}>
          <rect x={16} y={y} width={288} height={44} rx={8} fill={SURFACE} stroke={BORDURE} />
          <rect x={28} y={y + 10} width={40} height={12} rx={6} fill={PRIMAIRE} opacity="0.12" />
          <Ligne x={34} y={y + 13} w={28} h={5} fill={PRIMAIRE} />
          <Ligne x={78} y={y + 13} w={i === 0 ? 130 : 96} h={6} fill={NUIT} />
          <Ligne x={28} y={y + 30} w={i === 0 ? 190 : 220} h={5} />
        </g>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------------------
   DOCUMENTS — arborescence et liste de fichiers
   ---------------------------------------------------------------- */
export function IllustrationDocuments() {
  const fichiers = [0, 1, 2, 3]

  return (
    <svg viewBox="0 0 320 200" style={cadre} role="img" aria-label="Bibliothèque de documents classés par dossiers">
      <rect x="0" y="0" width="320" height="200" rx="12" fill={SURFACE} stroke={BORDURE} />

      {/* colonne dossiers */}
      <rect x="0" y="0" width="104" height="200" rx="12" fill="#FAFBFC" />
      <rect x="96" y="0" width="8" height="200" fill="#FAFBFC" />
      <line x1="104" y1="0" x2="104" y2="200" stroke={BORDURE} />

      {[24, 54, 84, 114].map((y, i) => (
        <g key={i}>
          {i === 1 && <rect x={10} y={y - 8} width={84} height={26} rx={6} fill={CLAIR} />}
          <path
            d={`M 20 ${y} h 8 l 3 4 h 11 v 12 h -22 z`}
            fill={i === 1 ? PRIMAIRE : TEXTE_FANTOME}
            opacity={i === 1 ? 0.7 : 1}
          />
          <Ligne x={50} y={y + 5} w={i === 1 ? 38 : 32} h={6} fill={i === 1 ? PRIMAIRE : TEXTE_FANTOME} />
        </g>
      ))}

      {/* liste fichiers */}
      <Ligne x={122} y={20} w={64} h={8} fill={NUIT} />
      {fichiers.map((i) => {
        const y = 46 + i * 34
        return (
          <g key={i}>
            <rect x={120} y={y} width={184} height={26} rx={6} fill={SURFACE} stroke={BORDURE} />
            <rect x={130} y={y + 6} width={11} height={14} rx={2} fill={TEXTE_FANTOME} />
            <Ligne x={150} y={y + 10} w={i % 2 === 0 ? 88 : 66} h={6} />
            <rect x={272} y={y + 8} width={22} height={10} rx={5} fill={CLAIR} />
          </g>
        )
      })}
    </svg>
  )
}

/* ----------------------------------------------------------------
   APPELS — fenêtre d'appel 1↔1
   ---------------------------------------------------------------- */
export function IllustrationAppels() {
  return (
    <svg viewBox="0 0 320 200" style={cadre} role="img" aria-label="Fenêtre d'appel audio et vidéo entre deux membres">
      <rect x="0" y="0" width="320" height="200" rx="12" fill={NUIT} />

      {/* interlocuteur */}
      <circle cx="160" cy="76" r="30" fill={PRIMAIRE} />
      <circle cx="160" cy="68" r="10" fill={CLAIR} opacity="0.8" />
      <path d="M 142 92 a 18 18 0 0 1 36 0 z" fill={CLAIR} opacity="0.8" />
      <Ligne x={124} y={118} w={72} h={7} fill="#FFFFFF" />
      <Ligne x={140} y={132} w={40} h={5} fill="#5B7BA8" />

      {/* incrustation locale */}
      <rect x="242" y="20" width="58" height="40" rx="6" fill={PRIMAIRE} opacity="0.55" />
      <circle cx="271" cy="34" r="6" fill={CLAIR} opacity="0.6" />
      <path d="M 260 50 a 11 11 0 0 1 22 0 z" fill={CLAIR} opacity="0.6" />

      {/* contrôles */}
      <circle cx="116" cy="166" r="15" fill="#FFFFFF" opacity="0.14" />
      <circle cx="152" cy="166" r="15" fill="#FFFFFF" opacity="0.14" />
      <circle cx="188" cy="166" r="15" fill="#FFFFFF" opacity="0.14" />
      <circle cx="224" cy="166" r="15" fill={EVENEMENT} />
      <rect x="217" y="163" width="14" height="5" rx="2.5" fill="#FFFFFF" transform="rotate(135 224 166)" />
    </svg>
  )
}
