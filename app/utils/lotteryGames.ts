export type LotteryOrganization = 'onlae' | 'once' | 'otros'

export interface LotteryOrganizationInfo {
  id: LotteryOrganization
  name: string
  shortName: string
  description: string
  icon: string
  primaryColor: string
  badgeVariant: string
  accentColor: string
  hexColor: string
}

export interface LotteryGameDefinition {
  id: string
  organization: LotteryOrganization
  name: string
  shortName: string
  icon: string
  color: string
  hexColor: string
  defaultCost: number
  hasCombinations?: boolean
  hasNumbersSeries?: boolean
  description?: string
}

export const LOTTERY_ORGANIZATIONS: Record<LotteryOrganization, LotteryOrganizationInfo> = {
  onlae: {
    id: 'onlae',
    name: 'Loterías y Apuestas del Estado',
    shortName: 'ONLAE / SELAE',
    description: 'Primitiva, Bonoloto, Euromillones, Lotería Nacional, Quiniela...',
    icon: 'i-heroicons-building-library',
    primaryColor: 'brand',
    badgeVariant: 'solid',
    accentColor: '#1d4ed8',
    hexColor: '#1e40af'
  },
  once: {
    id: 'once',
    name: 'ONCE',
    shortName: 'ONCE',
    description: 'Cupón Diario, Cuponazo, Sueldazo, Eurojackpot, Rascas...',
    icon: 'i-heroicons-sparkles',
    primaryColor: 'emerald',
    badgeVariant: 'subtle',
    accentColor: '#059669',
    hexColor: '#10b981'
  },
  otros: {
    id: 'otros',
    name: 'Otras Loterías y Sorteos',
    shortName: 'Otros',
    description: 'Loto Catalunya, Rifas locales, Peñas, Sorteos especiales...',
    icon: 'i-heroicons-puzzle-piece',
    primaryColor: 'purple',
    badgeVariant: 'outline',
    accentColor: '#8b5cf6',
    hexColor: '#7c3aed'
  }
}

export const LOTTERY_GAMES: LotteryGameDefinition[] = [
  // ── ONLAE / SELAE ──────────────────────────────────────────────────────────
  {
    id: 'bonoloto',
    organization: 'onlae',
    name: 'Bonoloto',
    shortName: 'Bonoloto',
    icon: 'i-heroicons-circle-stack',
    color: 'sky',
    hexColor: '#0284c7',
    defaultCost: 1.00,
    hasCombinations: true,
    description: 'Sorteo diario (de lunes a domingo)'
  },
  {
    id: 'primitiva',
    organization: 'onlae',
    name: 'La Primitiva',
    shortName: 'Primitiva',
    icon: 'i-heroicons-star',
    color: 'blue',
    hexColor: '#2563eb',
    defaultCost: 1.00,
    hasCombinations: true,
    description: 'Jueves y sábados (+ Joker opcional 1€)'
  },
  {
    id: 'euromillones',
    organization: 'onlae',
    name: 'Euromillones',
    shortName: 'Euromillones',
    icon: 'i-heroicons-globe-europe-africa',
    color: 'indigo',
    hexColor: '#1d4ed8',
    defaultCost: 2.50,
    hasCombinations: true,
    description: 'Martes y viernes (incluye El Millón)'
  },
  {
    id: 'nacional',
    organization: 'onlae',
    name: 'Lotería Nacional',
    shortName: 'Lot. Nacional',
    icon: 'i-heroicons-ticket',
    color: 'blue',
    hexColor: '#0369a1',
    defaultCost: 6.00,
    hasNumbersSeries: true,
    description: 'Décimos de jueves (3€), sábados (6€ o 12€) y sorteos especiales'
  },
  {
    id: 'navidad_nino',
    organization: 'onlae',
    name: 'Navidad / El Niño',
    shortName: 'Navidad / Niño',
    icon: 'i-heroicons-gift',
    color: 'amber',
    hexColor: '#d97706',
    defaultCost: 20.00,
    hasNumbersSeries: true,
    description: 'Sorteo Extraordinario de Navidad (22 Dic) y El Niño (6 Ene)'
  },
  {
    id: 'gordo_primitiva',
    organization: 'onlae',
    name: 'El Gordo de la Primitiva',
    shortName: 'El Gordo',
    icon: 'i-heroicons-currency-euro',
    color: 'cyan',
    hexColor: '#0891b2',
    defaultCost: 1.50,
    hasCombinations: true,
    description: 'Sorteos los domingos'
  },
  {
    id: 'eurodreams',
    organization: 'onlae',
    name: 'EuroDreams',
    shortName: 'EuroDreams',
    icon: 'i-heroicons-moon',
    color: 'indigo',
    hexColor: '#4f46e5',
    defaultCost: 2.50,
    hasCombinations: true,
    description: 'Lunes y jueves (premio de hasta 20.000€/mes durante 30 años)'
  },
  {
    id: 'quiniela',
    organization: 'onlae',
    name: 'La Quiniela',
    shortName: 'Quiniela',
    icon: 'i-heroicons-trophy',
    color: 'emerald',
    hexColor: '#059669',
    defaultCost: 1.50,
    description: 'Pronósticos de fútbol (jornadas de fin de semana y Champions)'
  },
  {
    id: 'quinigol',
    organization: 'onlae',
    name: 'El Quinigol',
    shortName: 'Quinigol',
    icon: 'i-heroicons-shield-check',
    color: 'teal',
    hexColor: '#0d9488',
    defaultCost: 1.00,
    description: 'Pronósticos de goles en 6 partidos'
  },
  {
    id: 'lototurf',
    organization: 'onlae',
    name: 'Lototurf / Quíntuple Plus',
    shortName: 'Lototurf',
    icon: 'i-heroicons-play',
    color: 'sky',
    hexColor: '#0284c7',
    defaultCost: 1.00,
    description: 'Apuestas hípicas de carreras de caballos'
  },

  // ── ONCE ───────────────────────────────────────────────────────────────────
  {
    id: 'cupon_diario',
    organization: 'once',
    name: 'Cupón Diario ONCE',
    shortName: 'Cupón Diario',
    icon: 'i-heroicons-calendar',
    color: 'emerald',
    hexColor: '#10b981',
    defaultCost: 2.00,
    hasNumbersSeries: true,
    description: 'De lunes a jueves (55 premios de 35.000€ y paga de 3.000€/mes)'
  },
  {
    id: 'cuponazo',
    organization: 'once',
    name: 'Cuponazo de la ONCE',
    shortName: 'Cuponazo',
    icon: 'i-heroicons-fire',
    color: 'emerald',
    hexColor: '#059669',
    defaultCost: 3.00,
    hasNumbersSeries: true,
    description: 'Viernes (premio mayor de 6.000.000€ y 40.000€ a las 5 cifras)'
  },
  {
    id: 'sueldazo',
    organization: 'once',
    name: 'Sueldazo Fin de Semana',
    shortName: 'Sueldazo',
    icon: 'i-heroicons-banknotes',
    color: 'green',
    hexColor: '#16a34a',
    defaultCost: 2.00,
    hasNumbersSeries: true,
    description: 'Sábados y domingos (5.000€ al mes durante 20 años + 300.000€ al contado)'
  },
  {
    id: 'eurojackpot',
    organization: 'once',
    name: 'Eurojackpot',
    shortName: 'Eurojackpot',
    icon: 'i-heroicons-sparkles',
    color: 'teal',
    hexColor: '#0d9488',
    defaultCost: 2.00,
    hasCombinations: true,
    description: 'Martes y viernes (botes de hasta 120.000.000€)'
  },
  {
    id: 'triplex',
    organization: 'once',
    name: 'Triplex de la ONCE',
    shortName: 'Triplex',
    icon: 'i-heroicons-squares-plus',
    color: 'teal',
    hexColor: '#14b8a6',
    defaultCost: 0.50,
    description: 'Tres sorteos diarios de número de 3 cifras'
  },
  {
    id: 'mi_dia',
    organization: 'once',
    name: 'Mi Día de la ONCE',
    shortName: 'Mi Día',
    icon: 'i-heroicons-calendar-days',
    color: 'emerald',
    hexColor: '#059669',
    defaultCost: 1.00,
    description: 'Sorteos diarios con fecha especial (día, mes y año)'
  },
  {
    id: 'super_once',
    organization: 'once',
    name: 'Super Once',
    shortName: 'Super Once',
    icon: 'i-heroicons-bolt',
    color: 'emerald',
    hexColor: '#10b981',
    defaultCost: 1.00,
    description: 'Varios sorteos al día con combinaciones de 11 números'
  },
  {
    id: 'rascas',
    organization: 'once',
    name: 'Rascas de la ONCE',
    shortName: 'Rascas ONCE',
    icon: 'i-heroicons-cursor-arrow-rays',
    color: 'green',
    hexColor: '#15803d',
    defaultCost: 2.00,
    description: 'Lotería instantánea (Rasca Link, 7 y Media, Monopoly, etc.)'
  },
  {
    id: 'extra_once',
    organization: 'once',
    name: 'Extraordinario ONCE',
    shortName: 'Extra ONCE',
    icon: 'i-heroicons-gift',
    color: 'teal',
    hexColor: '#0f766e',
    defaultCost: 6.00,
    hasNumbersSeries: true,
    description: 'Sorteos especiales (Día del Padre, Madre, Verano, 11/11, Navidad)'
  },

  // ── OTROS ──────────────────────────────────────────────────────────────────
  {
    id: 'loto_catalunya',
    organization: 'otros',
    name: 'Loto Catalunya (Grossa, 6/49)',
    shortName: 'Loto Catalunya',
    icon: 'i-heroicons-flag',
    color: 'amber',
    hexColor: '#f59e0b',
    defaultCost: 5.00,
    description: 'La Grossa, 6/49, El Trio, Express'
  },
  {
    id: 'rifas',
    organization: 'otros',
    name: 'Rifas, Cestas y Sorteos Locales',
    shortName: 'Rifas y Cestas',
    icon: 'i-heroicons-shopping-bag',
    color: 'purple',
    hexColor: '#8b5cf6',
    defaultCost: 2.50,
    description: 'Papeletas benéficas, cestas de Navidad, sorteos de fiestas'
  },
  {
    id: 'peñas',
    organization: 'otros',
    name: 'Peñas y Participaciones',
    shortName: 'Peñas / Amigos',
    icon: 'i-heroicons-user-group',
    color: 'violet',
    hexColor: '#7c3aed',
    defaultCost: 5.00,
    description: 'Participaciones compartidas de lotería entre amigos o trabajo'
  },
  {
    id: 'internacional',
    organization: 'otros',
    name: 'Loterías Internacionales',
    shortName: 'Internacional',
    icon: 'i-heroicons-globe-alt',
    color: 'indigo',
    hexColor: '#6366f1',
    defaultCost: 3.50,
    description: 'Powerball, Mega Millions, SuperEnalotto, etc.'
  },
  {
    id: 'otro_juego',
    organization: 'otros',
    name: 'Otro Juego Personalizado',
    shortName: 'Otro Juego',
    icon: 'i-heroicons-tag',
    color: 'slate',
    hexColor: '#64748b',
    defaultCost: 2.00,
    description: 'Cualquier otro sorteo o apuesta no clasificada'
  }
]

export const LOTTERY_STATUSES = {
  pending: {
    id: 'pending',
    label: 'Pendiente de Sorteo',
    shortLabel: 'Pendiente',
    icon: 'i-heroicons-clock',
    color: 'blue',
    hexColor: '#3b82f6',
    badgeVariant: 'subtle'
  },
  won: {
    id: 'won',
    label: 'Premiado',
    shortLabel: 'Premiado',
    icon: 'i-heroicons-trophy',
    color: 'emerald',
    hexColor: '#10b981',
    badgeVariant: 'solid'
  },
  lost: {
    id: 'lost',
    label: 'No Premiado',
    shortLabel: 'No premiado',
    icon: 'i-heroicons-x-circle',
    color: 'neutral',
    hexColor: '#94a3b8',
    badgeVariant: 'outline'
  },
  refund: {
    id: 'refund',
    label: 'Reintegro',
    shortLabel: 'Reintegro',
    icon: 'i-heroicons-arrow-path',
    color: 'cyan',
    hexColor: '#06b6d4',
    badgeVariant: 'subtle'
  }
} as const

export type LotteryStatus = keyof typeof LOTTERY_STATUSES

export const getGameById = (gameId: string): LotteryGameDefinition => {
  return LOTTERY_GAMES.find(g => g.id === gameId) || {
    id: gameId || 'otro_juego',
    organization: 'otros',
    name: gameId ? gameId.charAt(0).toUpperCase() + gameId.slice(1) : 'Otro Juego',
    shortName: gameId || 'Otro',
    icon: 'i-heroicons-tag',
    color: 'slate',
    hexColor: '#64748b',
    defaultCost: 2.00
  }
}

export const getGamesByOrganization = (org?: LotteryOrganization | 'all'): LotteryGameDefinition[] => {
  if (!org || org === 'all') return LOTTERY_GAMES
  return LOTTERY_GAMES.filter(g => g.organization === org)
}

export const getOrganizationInfo = (org: LotteryOrganization): LotteryOrganizationInfo => {
  return LOTTERY_ORGANIZATIONS[org] || LOTTERY_ORGANIZATIONS.otros
}
