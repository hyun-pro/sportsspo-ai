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

// MLB 팀 매핑 - 한국식 표기 (도시명 기준)
const MLB_TEAMS = {
  'New York Yankees': { kr: 'NY 양키스', code: 'NYY' },
  'Boston Red Sox': { kr: '보스턴', code: 'BOS' },
  'Toronto Blue Jays': { kr: '토론토', code: 'TOR' },
  'Baltimore Orioles': { kr: '볼티모어', code: 'BAL' },
  'Tampa Bay Rays': { kr: '탬파베이', code: 'TB' },
  'Cleveland Guardians': { kr: '클리블랜드', code: 'CLE' },
  'Minnesota Twins': { kr: '미네소타', code: 'MIN' },
  'Detroit Tigers': { kr: '디트로이트', code: 'DET' },
  'Chicago White Sox': { kr: '시카고 삭스', code: 'CWS' },
  'Kansas City Royals': { kr: '캔자스시티', code: 'KC' },
  'Houston Astros': { kr: '휴스턴', code: 'HOU' },
  'Seattle Mariners': { kr: '시애틀', code: 'SEA' },
  'Texas Rangers': { kr: '텍사스', code: 'TEX' },
  'Los Angeles Angels': { kr: 'LA 에인절스', code: 'LAA' },
  'Oakland Athletics': { kr: '오클랜드', code: 'OAK' },
  'Athletics': { kr: '오클랜드', code: 'OAK' },
  'Atlanta Braves': { kr: '애틀랜타', code: 'ATL' },
  'Philadelphia Phillies': { kr: '필라델피아', code: 'PHI' },
  'New York Mets': { kr: 'NY 메츠', code: 'NYM' },
  'Miami Marlins': { kr: '마이애미', code: 'MIA' },
  'Washington Nationals': { kr: '워싱턴', code: 'WSH' },
  'Milwaukee Brewers': { kr: '밀워키', code: 'MIL' },
  'Chicago Cubs': { kr: '시카고 컵스', code: 'CHC' },
  'Cincinnati Reds': { kr: '신시내티', code: 'CIN' },
  'Pittsburgh Pirates': { kr: '피츠버그', code: 'PIT' },
  'St. Louis Cardinals': { kr: '세인트루이스', code: 'STL' },
  'Los Angeles Dodgers': { kr: 'LA 다저스', code: 'LAD' },
  'San Diego Padres': { kr: '샌디에이고', code: 'SD' },
  'Arizona Diamondbacks': { kr: '애리조나', code: 'ARI' },
  'San Francisco Giants': { kr: '샌프란시스코', code: 'SF' },
  'Colorado Rockies': { kr: '콜로라도', code: 'COL' },
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
