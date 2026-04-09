import { useState } from 'react'
import { getShortName, getTeamCode } from '../utils/teamNames'

// MLB Team IDs → mlbstatic.com SVG logos
const MLB_LOGO_IDS = {
  'New York Yankees': 147, 'Boston Red Sox': 111, 'Toronto Blue Jays': 141,
  'Baltimore Orioles': 110, 'Tampa Bay Rays': 139, 'Cleveland Guardians': 114,
  'Minnesota Twins': 142, 'Detroit Tigers': 116, 'Chicago White Sox': 145,
  'Kansas City Royals': 118, 'Houston Astros': 117, 'Seattle Mariners': 136,
  'Texas Rangers': 140, 'Los Angeles Angels': 108, 'Oakland Athletics': 133,
  'Athletics': 133,
  'Atlanta Braves': 144, 'Philadelphia Phillies': 143, 'New York Mets': 121,
  'Miami Marlins': 146, 'Washington Nationals': 120, 'Milwaukee Brewers': 158,
  'Chicago Cubs': 112, 'Cincinnati Reds': 113, 'Pittsburgh Pirates': 134,
  'St. Louis Cardinals': 138, 'Los Angeles Dodgers': 119, 'San Diego Padres': 135,
  'Arizona Diamondbacks': 109, 'San Francisco Giants': 137, 'Colorado Rockies': 115,
}

// KBO 공식 CDN 로고 (2022년 코드 전부 작동 확인)
const KBO_LOGOS = {
  'Samsung Lions': 'SS', 'Kia Tigers': 'HT', 'LG Twins': 'LG',
  'Doosan Bears': 'OB', 'KT Wiz': 'KT', 'SSG Landers': 'SK',
  'NC Dinos': 'NC', 'Lotte Giants': 'LT', 'Hanwha Eagles': 'HH',
  'Kiwoom Heroes': 'WO',
}

// NPB 공식 로고 코드
const NPB_LOGO_CODES = {
  'Yomiuri Giants': 'g', 'Hanshin Tigers': 't',
  'Yokohama DeNA BayStars': 'db', 'Hiroshima Toyo Carp': 'c',
  'Chunichi Dragons': 'd', 'Tokyo Yakult Swallows': 's',
  'Fukuoka SoftBank Hawks': 'h', 'Orix Buffaloes': 'b',
  'Saitama Seibu Lions': 'l', 'Tohoku Rakuten Golden Eagles': 'e',
  'Tohoku Rakuten Eagles': 'e', 'Chiba Lotte Marines': 'm',
  'Hokkaido Nippon-Ham Fighters': 'f', 'Nippon-Ham Fighters': 'f',
}

// Fallback colors
const TEAM_COLORS = {
  'Samsung Lions': '#074CA1', 'Kia Tigers': '#C8102E', 'LG Twins': '#C8102E',
  'Doosan Bears': '#1D1D4E', 'KT Wiz': '#000000', 'SSG Landers': '#CE0E2D',
  'NC Dinos': '#315288', 'Lotte Giants': '#041E42', 'Hanwha Eagles': '#F37321',
  'Kiwoom Heroes': '#820024',
  'New York Yankees': '#003087', 'Boston Red Sox': '#BD3039', 'Toronto Blue Jays': '#134A8E',
  'Baltimore Orioles': '#DF4601', 'Tampa Bay Rays': '#092C5C', 'Cleveland Guardians': '#00385D',
  'Minnesota Twins': '#002B5C', 'Detroit Tigers': '#0C2340', 'Chicago White Sox': '#27251F',
  'Kansas City Royals': '#004687', 'Houston Astros': '#002D62', 'Seattle Mariners': '#0C2C56',
  'Texas Rangers': '#003278', 'Los Angeles Angels': '#BA0021', 'Oakland Athletics': '#003831',
  'Athletics': '#003831',
  'Atlanta Braves': '#CE1141', 'Philadelphia Phillies': '#E81828', 'New York Mets': '#002D72',
  'Miami Marlins': '#00A3E0', 'Washington Nationals': '#AB0003', 'Milwaukee Brewers': '#12284B',
  'Chicago Cubs': '#0E3386', 'Cincinnati Reds': '#C6011F', 'Pittsburgh Pirates': '#27251F',
  'St. Louis Cardinals': '#C41E3A', 'Los Angeles Dodgers': '#005A9C', 'San Diego Padres': '#2F241D',
  'Arizona Diamondbacks': '#A71930', 'San Francisco Giants': '#FD5A1E', 'Colorado Rockies': '#33006F',
  'Yomiuri Giants': '#F97709', 'Hanshin Tigers': '#FFE100', 'Yokohama DeNA BayStars': '#044B8E',
  'Hiroshima Toyo Carp': '#E50012', 'Chunichi Dragons': '#003C80', 'Tokyo Yakult Swallows': '#006D44',
  'Fukuoka SoftBank Hawks': '#FFD700', 'Orix Buffaloes': '#000033', 'Saitama Seibu Lions': '#003E7E',
  'Tohoku Rakuten Golden Eagles': '#8B0023', 'Tohoku Rakuten Eagles': '#8B0023',
  'Chiba Lotte Marines': '#221815', 'Hokkaido Nippon-Ham Fighters': '#004B98',
  'Nippon-Ham Fighters': '#004B98',
}

function getLogoUrl(teamName) {
  // MLB
  const mlbId = MLB_LOGO_IDS[teamName]
  if (mlbId) return `https://www.mlbstatic.com/team-logos/${mlbId}.svg`

  // KBO - 공식 CDN (2022 전팀 확인됨)
  const kboCode = KBO_LOGOS[teamName]
  if (kboCode) {
    return `https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/KBOHome/resources/images/emblem/regular/2022/${kboCode}.png`
  }

  // NPB - 공식 npb.jp
  const npbCode = NPB_LOGO_CODES[teamName]
  if (npbCode) return `https://p.npb.jp/img/common/logo/2026/logo_${npbCode}_l.gif`

  return null
}

export function getTeamColor(teamName) {
  return TEAM_COLORS[teamName] || '#374151'
}

// 팀 공식 로고
function TeamLogo({ team, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = getLogoUrl(team)
  const color = getTeamColor(team)
  const code = getTeamCode(team)

  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  }

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={team}
        className={`${sizes[size]} object-contain flex-shrink-0`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    )
  }

  // Fallback
  const fbSizes = {
    xs: 'w-4 h-4 text-[6px]',
    sm: 'w-5 h-5 text-[7px]',
    md: 'w-6 h-6 text-[8px]',
    lg: 'w-10 h-10 text-xs',
    xl: 'w-14 h-14 text-sm',
  }
  return (
    <span
      className={`${fbSizes[size]} rounded-full inline-flex items-center justify-center font-black flex-shrink-0`}
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {code?.slice(0, 2)}
    </span>
  )
}

// 팀 배지: [로고] 한글명
export default function TeamBadge({ team, showFull = false, size = 'md' }) {
  const kr = getShortName(team)
  const code = getTeamCode(team)

  if (!showFull) {
    return (
      <span className="inline-flex items-center gap-1 min-w-0">
        <TeamLogo team={team} size={size} />
        <span className="text-xs font-bold text-gray-200 truncate">{kr}</span>
      </span>
    )
  }

  // Full: [로고] 한글명 (CODE)
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <TeamLogo team={team} size={size} />
      <span className="text-sm font-bold text-gray-100 truncate">{kr}</span>
      <span className="text-[10px] font-medium text-gray-500 shrink-0">{code}</span>
    </span>
  )
}

export { TeamLogo }
