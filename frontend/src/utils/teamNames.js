// KBO 팀 매핑 - 한국 스포츠사이트 기준 표기
const KBO_TEAMS = {
  'Samsung Lions': { kr: '삼성', code: 'SS' },
  'Kia Tigers': { kr: '기아', code: 'KIA' },
  'LG Twins': { kr: 'LG', code: 'LG' },
  'Doosan Bears': { kr: '두산', code: 'OB' },
  'KT Wiz': { kr: 'KT', code: 'KT' },
  'SSG Landers': { kr: 'SSG', code: 'SSG' },
  'NC Dinos': { kr: 'NC', code: 'NC' },
  'Lotte Giants': { kr: '롯데', code: 'LT' },
  'Hanwha Eagles': { kr: '한화', code: 'HH' },
  'Kiwoom Heroes': { kr: '키움', code: 'WO' },
}

// MLB 팀 매핑 - 한글 + 국제 표준 약어
const MLB_TEAMS = {
  'New York Yankees': { kr: '양키스', code: 'NYY' },
  'Boston Red Sox': { kr: '레드삭스', code: 'BOS' },
  'Toronto Blue Jays': { kr: '블루제이스', code: 'TOR' },
  'Baltimore Orioles': { kr: '오리올스', code: 'BAL' },
  'Tampa Bay Rays': { kr: '레이스', code: 'TB' },
  'Cleveland Guardians': { kr: '가디언스', code: 'CLE' },
  'Minnesota Twins': { kr: '트윈스', code: 'MIN' },
  'Detroit Tigers': { kr: '타이거스', code: 'DET' },
  'Chicago White Sox': { kr: '화이트삭스', code: 'CWS' },
  'Kansas City Royals': { kr: '로열스', code: 'KC' },
  'Houston Astros': { kr: '애스트로스', code: 'HOU' },
  'Seattle Mariners': { kr: '매리너스', code: 'SEA' },
  'Texas Rangers': { kr: '레인저스', code: 'TEX' },
  'Los Angeles Angels': { kr: '에인절스', code: 'LAA' },
  'Oakland Athletics': { kr: '애슬레틱스', code: 'OAK' },
  'Athletics': { kr: '애슬레틱스', code: 'OAK' },
  'Atlanta Braves': { kr: '브레이브스', code: 'ATL' },
  'Philadelphia Phillies': { kr: '필리스', code: 'PHI' },
  'New York Mets': { kr: '메츠', code: 'NYM' },
  'Miami Marlins': { kr: '말린스', code: 'MIA' },
  'Washington Nationals': { kr: '내셔널스', code: 'WSH' },
  'Milwaukee Brewers': { kr: '브루어스', code: 'MIL' },
  'Chicago Cubs': { kr: '컵스', code: 'CHC' },
  'Cincinnati Reds': { kr: '레즈', code: 'CIN' },
  'Pittsburgh Pirates': { kr: '파이리츠', code: 'PIT' },
  'St. Louis Cardinals': { kr: '카디널스', code: 'STL' },
  'Los Angeles Dodgers': { kr: '다저스', code: 'LAD' },
  'San Diego Padres': { kr: '파드리스', code: 'SD' },
  'Arizona Diamondbacks': { kr: 'D백스', code: 'ARI' },
  'San Francisco Giants': { kr: '자이언츠', code: 'SF' },
  'Colorado Rockies': { kr: '로키스', code: 'COL' },
}

// NPB 팀 매핑 - 한국 스포츠팬 기준 짧은 표기
const NPB_TEAMS = {
  'Yomiuri Giants': { kr: '요미우리', code: 'G' },
  'Hanshin Tigers': { kr: '한신', code: 'T' },
  'Yokohama DeNA BayStars': { kr: 'DeNA', code: 'DB' },
  'Hiroshima Toyo Carp': { kr: '히로시마', code: 'C' },
  'Chunichi Dragons': { kr: '주니치', code: 'D' },
  'Tokyo Yakult Swallows': { kr: '야쿠르트', code: 'S' },
  'Fukuoka SoftBank Hawks': { kr: '소프트뱅크', code: 'H' },
  'Orix Buffaloes': { kr: '오릭스', code: 'B' },
  'Saitama Seibu Lions': { kr: '세이부', code: 'L' },
  'Tohoku Rakuten Golden Eagles': { kr: '라쿠텐', code: 'E' },
  'Tohoku Rakuten Eagles': { kr: '라쿠텐', code: 'E' },
  'Chiba Lotte Marines': { kr: '롯데', code: 'M' },
  'Hokkaido Nippon-Ham Fighters': { kr: '닛폰햄', code: 'F' },
  'Nippon-Ham Fighters': { kr: '닛폰햄', code: 'F' },
}

const ALL_TEAMS = { ...MLB_TEAMS, ...NPB_TEAMS, ...KBO_TEAMS }

export function getTeamInfo(teamName) {
  return ALL_TEAMS[teamName] || null
}

export function getKoreanName(teamName) {
  return ALL_TEAMS[teamName]?.kr || null
}

// 표시용: "한글명" (짧게)
export function displayTeamName(teamName) {
  const info = ALL_TEAMS[teamName]
  if (!info) return teamName
  return info.kr
}

// 짧은 한글명만 (배지용)
export function getShortName(teamName) {
  return ALL_TEAMS[teamName]?.kr || teamName
}

// 코드만
export function getTeamCode(teamName) {
  return ALL_TEAMS[teamName]?.code || teamName?.slice(0, 3)
}
