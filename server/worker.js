/**
 * BallPredict Data Sync Worker
 *
 * 독립 실행 가능한 데이터 동기화 워커.
 * 서버와 분리하여 별도 프로세스/컨테이너로 실행 가능.
 *
 * 사용법:
 *   node worker.js              # 1회 실행 후 종료
 *   node worker.js --loop       # 주기적 반복 실행
 *   node worker.js --league mlb # 특정 리그만 동기화
 */
import 'dotenv/config'
import Database from 'better-sqlite3'
import { load as cheerioLoad } from 'cheerio'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || join(__dirname, 'ballpredict.db')
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_MS || '1800000') // 30분

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// ── Team Name Mappings ──────────────────────────────────────
const NPB_NAME_MAP = {
  '東京ヤクルトスワローズ': 'Tokyo Yakult Swallows', '東京ヤクルト': 'Tokyo Yakult Swallows',
  '阪神タイガース': 'Hanshin Tigers', '阪神': 'Hanshin Tigers',
  '読売ジャイアンツ': 'Yomiuri Giants', '読売': 'Yomiuri Giants',
  '広島東洋カープ': 'Hiroshima Toyo Carp', '広島東洋': 'Hiroshima Toyo Carp',
  '横浜DeNAベイスターズ': 'Yokohama DeNA BayStars', '横浜DeNA': 'Yokohama DeNA BayStars',
  '中日ドラゴンズ': 'Chunichi Dragons', '中日': 'Chunichi Dragons',
  '福岡ソフトバンクホークス': 'Fukuoka SoftBank Hawks', '福岡ソフトバンク': 'Fukuoka SoftBank Hawks',
  '北海道日本ハムファイターズ': 'Hokkaido Nippon-Ham Fighters', '北海道日本ハム': 'Hokkaido Nippon-Ham Fighters',
  'オリックス・バファローズ': 'Orix Buffaloes', 'オリックス': 'Orix Buffaloes',
  '東北楽天ゴールデンイーグルス': 'Tohoku Rakuten Golden Eagles', '東北楽天': 'Tohoku Rakuten Golden Eagles',
  '埼玉西武ライオンズ': 'Saitama Seibu Lions', '埼玉西武': 'Saitama Seibu Lions',
  '千葉ロッテマリーンズ': 'Chiba Lotte Marines', '千葉ロッテ': 'Chiba Lotte Marines',
}

const KBO_NAME_MAP = {
  'SSG': 'SSG Landers', 'KT': 'KT Wiz', 'LG': 'LG Twins',
  '한화': 'Hanwha Eagles', 'NC': 'NC Dinos', '삼성': 'Samsung Lions',
  '두산': 'Doosan Bears', '롯데': 'Lotte Giants', 'KIA': 'Kia Tigers',
  '키움': 'Kiwoom Heroes',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// ── Prediction Engine (동일 로직) ───────────────────────────
function sigmoid(x) { return 1.0 / (1.0 + Math.exp(-x)) }
function normalize(val, min, max) {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (val - min) / (max - min)))
}

function predictGame(homeTeam, awayTeam, homePitcher, awayPitcher) {
  let homeAdv = 0.54 // 홈 어드밴티지 기본
  let totalScore = 0
  let components = { team_form: 0, pitcher: 0, home_adv: 0, elo: 0, h2h: 0, bullpen: 0, recent_form: 0 }

  // 1) 팀 폼 (최근 승률)
  const formDiff = (homeTeam.win_rate_last5 || 0.5) - (awayTeam.win_rate_last5 || 0.5)
  components.team_form = formDiff * 0.2
  totalScore += components.team_form

  // 2) 투수 (ERA 기반)
  if (homePitcher && awayPitcher) {
    const eraDiff = (awayPitcher.era || 4.5) - (homePitcher.era || 4.5) // 낮은 ERA가 좋음
    components.pitcher = eraDiff * 0.05
    totalScore += components.pitcher
  }

  // 3) 홈 어드밴티지
  components.home_adv = 0.04
  totalScore += components.home_adv

  // 4) ELO 차이
  const eloDiff = (homeTeam.elo_rating || 1500) - (awayTeam.elo_rating || 1500)
  components.elo = eloDiff * 0.003
  totalScore += components.elo

  // 5) 최근 폼
  const streakDiff = (homeTeam.streak || 0) - (awayTeam.streak || 0)
  components.recent_form = streakDiff * 0.01
  totalScore += components.recent_form

  const homeProb = Math.round(sigmoid(totalScore) * 1000) / 10
  const awayProb = Math.round((100 - homeProb) * 10) / 10

  const recommended = homeProb >= 50 ? homeTeam.team_name : awayTeam.team_name
  const confidence = Math.round(Math.abs(homeProb - 50) * 2)

  return {
    home_win_probability: homeProb,
    away_win_probability: awayProb,
    recommended_pick: recommended,
    confidence_score: Math.min(confidence, 95),
    team_form_score: Math.round(components.team_form * 1000) / 1000,
    pitcher_score: Math.round(components.pitcher * 1000) / 1000,
    home_advantage_score: Math.round(components.home_adv * 1000) / 1000,
    elo_diff_score: Math.round(components.elo * 1000) / 1000,
    h2h_score: 0,
    bullpen_score: 0,
    recent_form_score: Math.round(components.recent_form * 1000) / 1000,
  }
}

function generatePredictions(league) {
  console.log(`  ${league} 예측 생성 중...`)
  const getTeam = db.prepare('SELECT * FROM team_stats WHERE team_name = ?')
  const getPitcherQ = db.prepare('SELECT * FROM pitchers WHERE name = ?')
  const insertPred = db.prepare('INSERT OR REPLACE INTO predictions (game_id,home_win_probability,away_win_probability,recommended_pick,confidence_score,team_form_score,pitcher_score,home_advantage_score,elo_diff_score,h2h_score,bullpen_score,recent_form_score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')

  const games = db.prepare('SELECT * FROM games WHERE league = ?').all(league)
  let count = 0
  for (const g of games) {
    const ht = getTeam.get(g.home_team)
    const at = getTeam.get(g.away_team)
    if (!ht || !at) continue
    const hp = g.home_pitcher ? getPitcherQ.get(g.home_pitcher) : null
    const ap = g.away_pitcher ? getPitcherQ.get(g.away_pitcher) : null
    const pred = predictGame(ht, at, hp, ap)
    insertPred.run(g.id, pred.home_win_probability, pred.away_win_probability,
      pred.recommended_pick, pred.confidence_score, pred.team_form_score,
      pred.pitcher_score, pred.home_advantage_score, pred.elo_diff_score, pred.h2h_score,
      pred.bullpen_score, pred.recent_form_score)
    count++
  }
  console.log(`  ${league} 예측 ${count}개 생성 완료`)
}

// ── Fetch Helpers ───────────────────────────────────────────
async function fetchJSON(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`  API 호출 실패: ${url}`, e.message)
    return null
  }
}

// ── MLB Sync ────────────────────────────────────────────────
const MLB_API = 'https://statsapi.mlb.com/api/v1'

async function syncMLBData() {
  console.log('\n=== MLB 데이터 동기화 ===')

  // 순위
  const year = new Date().getFullYear()
  const data = await fetchJSON(`${MLB_API}/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&hydrate=team`)
  if (data?.records) {
    db.prepare("DELETE FROM team_stats WHERE league = 'MLB'").run()
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')

    for (const record of data.records) {
      for (const tr of record.teamRecords) {
        const name = tr.team.name
        const w = tr.wins || 0, l = tr.losses || 0, gp = w + l
        const winPct = tr.winningPercentage ? parseFloat(tr.winningPercentage) : (gp > 0 ? w / gp : 0.5)
        const rd = tr.runDifferential || 0
        const streak = tr.streak?.streakType === 'losses' ? -(tr.streak?.streakNumber || 0) : (tr.streak?.streakNumber || 0)
        const elo = Math.round(1500 + (winPct - 0.5) * 600 + rd * 0.3)
        const runsScored = tr.runsScored || 0, runsAllowed = tr.runsAllowed || 0
        const avgRS = gp > 0 ? Math.round((runsScored / gp) * 100) / 100 : 4.5
        const avgRA = gp > 0 ? Math.round((runsAllowed / gp) * 100) / 100 : 4.5
        const homeW = tr.records?.splitRecords?.find(r => r.type === 'home')?.wins || Math.round(w * 0.55)
        const homeL = tr.records?.splitRecords?.find(r => r.type === 'home')?.losses || Math.round(l * 0.45)
        const awayW = tr.records?.splitRecords?.find(r => r.type === 'away')?.wins || w - homeW
        const awayL = tr.records?.splitRecords?.find(r => r.type === 'away')?.losses || l - homeL
        const winRateHome = (homeW + homeL) > 0 ? Math.round(homeW / (homeW + homeL) * 1000) / 1000 : 0.5
        const winRateAway = (awayW + awayL) > 0 ? Math.round(awayW / (awayW + awayL) * 1000) / 1000 : 0.5
        const last10 = tr.records?.splitRecords?.find(r => r.type === 'lastTen')
        const winLast5 = last10 ? Math.round((last10.wins / (last10.wins + last10.losses)) * 1000) / 1000 : winPct

        insertTeam.run(name, 'MLB', avgRS, avgRA, winLast5, winRateHome, winRateAway, elo, rd,
          tr.divisionRank ? parseInt(tr.divisionRank) : 0, gp, w, l, streak, 1)
      }
    }
    console.log('  MLB 순위 반영 완료')
  }

  // 경기 일정
  const today = new Date()
  const start = new Date(today); start.setDate(today.getDate() - 3)
  const end = new Date(today); end.setDate(today.getDate() + 7)
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const schedUrl = `${MLB_API}/schedule?sportId=1&startDate=${startStr}&endDate=${endStr}&hydrate=probablePitcher(note),linescore,team`
  const schedData = await fetchJSON(schedUrl)

  if (schedData?.dates) {
    const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status,home_odds,away_odds,home_pitcher,away_pitcher) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    const updateGame = db.prepare('UPDATE games SET status=?, home_score=?, away_score=?, home_pitcher=?, away_pitcher=?, game_time=? WHERE external_id=?')

    const pitcherNames = new Set()
    const pitcherTeamMap = {}

    for (const dateObj of schedData.dates) {
      for (const g of dateObj.games) {
        const homeTeam = g.teams.home.team.name
        const awayTeam = g.teams.away.team.name
        const status = g.status.abstractGameState
        const gameDate = g.officialDate || dateObj.date
        const gameTime = g.gameDate ? new Date(g.gameDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
        const homePitcher = g.teams.home.probablePitcher?.fullName || null
        const awayPitcher = g.teams.away.probablePitcher?.fullName || null
        const homeScore = status === 'Final' ? (g.teams.home.score ?? null) : null
        const awayScore = status === 'Final' ? (g.teams.away.score ?? null) : null
        const gameStatus = status === 'Final' ? 'final' : status === 'Live' ? 'live' : 'scheduled'
        const externalId = `mlb_${g.gamePk}`

        const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(externalId)
        if (existing) {
          updateGame.run(gameStatus, homeScore, awayScore, homePitcher, awayPitcher, gameTime, externalId)
        } else {
          insertGame.run(externalId, 'MLB', homeTeam, awayTeam, gameDate, gameTime, homeScore, awayScore, gameStatus, null, null, homePitcher, awayPitcher)
        }

        if (homePitcher) { pitcherNames.add(homePitcher); pitcherTeamMap[homePitcher] = homeTeam }
        if (awayPitcher) { pitcherNames.add(awayPitcher); pitcherTeamMap[awayPitcher] = awayTeam }
      }
    }

    // 투수 스탯
    const insertPitcher = db.prepare('INSERT OR REPLACE INTO pitchers (name,team,league,era,whip,wins,losses,innings_pitched,strikeouts,recent_form) VALUES (?,?,?,?,?,?,?,?,?,?)')
    const pitcherArr = [...pitcherNames]
    for (let i = 0; i < pitcherArr.length; i += 5) {
      const batch = pitcherArr.slice(i, i + 5)
      const results = await Promise.all(batch.map(async (name) => {
        const searchUrl = `${MLB_API}/people/search?names=${encodeURIComponent(name)}&sportId=1`
        const d = await fetchJSON(searchUrl)
        if (!d?.people?.[0]) return null
        const person = d.people[0]
        const yr = new Date().getFullYear()
        const statsData = await fetchJSON(`${MLB_API}/people/${person.id}/stats?stats=season&season=${yr}&group=pitching`)
        const splits = statsData?.stats?.[0]?.splits
        if (!splits?.length) return null
        const s = splits[0].stat
        return {
          name: person.fullName, team: pitcherTeamMap[name], league: 'MLB',
          era: parseFloat(s.era) || 4.5, whip: parseFloat(s.whip) || 1.3,
          wins: s.wins || 0, losses: s.losses || 0,
          innings_pitched: parseFloat(s.inningsPitched) || 0,
          strikeouts: s.strikeOuts || 0,
          recent_form: s.winPercentage ? parseFloat(s.winPercentage) : 0.5,
        }
      }))
      for (const stats of results) {
        if (stats) {
          insertPitcher.run(stats.name, stats.team, stats.league, stats.era, stats.whip,
            stats.wins, stats.losses, stats.innings_pitched, stats.strikeouts, stats.recent_form)
        }
      }
    }
  }

  generatePredictions('MLB')
  console.log('=== MLB 동기화 완료 ===\n')
}

// ── KBO Sync ────────────────────────────────────────────────
async function syncKBOData() {
  console.log('\n=== KBO 데이터 동기화 ===')

  // 순위
  try {
    const res = await fetch('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: { 'User-Agent': UA }
    })
    const html = await res.text()
    const ch = cheerioLoad(html)

    db.prepare("DELETE FROM team_stats WHERE league = 'KBO'").run()
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')

    const rows = ch('table.tData').first().find('tbody tr')
    rows.each((i, el) => {
      const tds = ch(el).find('td')
      const rank = parseInt(tds.eq(0).text().trim()) || (i + 1)
      const teamKr = tds.eq(1).text().trim()
      const teamEn = KBO_NAME_MAP[teamKr]
      if (!teamEn) return

      const gp = parseInt(tds.eq(2).text().trim()) || 0
      const w = parseInt(tds.eq(3).text().trim()) || 0
      const l = parseInt(tds.eq(4).text().trim()) || 0
      const pct = parseFloat(tds.eq(6).text().trim()) || 0.5

      const streakText = tds.eq(9).text().trim()
      let streak = 0
      const streakMatch = streakText.match(/(\d+)(승|패)/)
      if (streakMatch) streak = streakMatch[2] === '승' ? parseInt(streakMatch[1]) : -parseInt(streakMatch[1])

      const homeText = tds.eq(10).text().trim()
      const awayText = tds.eq(11).text().trim()
      const parseRecord = (text) => {
        const m = text.match(/(\d+)승(\d+)패/)
        if (m) return parseInt(m[1]) / (parseInt(m[1]) + parseInt(m[2]))
        return 0.5
      }

      const elo = Math.round(1500 + (pct - 0.5) * 500)
      const avgRS = 4.5 + (pct - 0.5) * 2
      const avgRA = 4.5 - (pct - 0.5) * 2

      insertTeam.run(teamEn, 'KBO', Math.round(avgRS * 100) / 100, Math.round(avgRA * 100) / 100,
        pct, parseRecord(homeText), parseRecord(awayText), elo,
        Math.round((avgRS - avgRA) * 100) / 100, rank, gp, w, l, streak, 1)
    })
    console.log('  KBO 순위 반영 완료')
  } catch (e) { console.error('  KBO 순위 오류:', e.message) }

  // 경기
  try {
    const res = await fetch('https://mykbostats.com', { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status,home_pitcher,away_pitcher) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    const updateGame = db.prepare('UPDATE games SET status=?, home_score=?, away_score=? WHERE external_id=?')

    ch('a.game-line').each((i, el) => {
      const href = ch(el).attr('href') || ''
      const awayTeam = ch(el).find('.away-team').text().replace(/\s+/g, ' ').trim()
      const homeTeam = ch(el).find('.home-team').text().replace(/\s+/g, ' ').trim()
      const awayScore = ch(el).find('.score.away-score').text().trim()
      const homeScore = ch(el).find('.score.home-score').text().trim()
      const timeEl = ch(el).find('time')
      const datetime = timeEl.attr('datetime') || ''
      const status = ch(el).find('.middle .status').text().trim()

      if (!awayTeam || !homeTeam) return

      const cleanTeam = (name) => name.split('\n').map(s => s.trim()).filter(Boolean).join(' ')
      const home = cleanTeam(homeTeam)
      const away = cleanTeam(awayTeam)

      let gameDate = new Date().toISOString().split('T')[0]
      if (datetime) gameDate = new Date(datetime).toISOString().split('T')[0]

      let gameTime = null
      if (datetime) {
        const d = new Date(datetime)
        gameTime = `${String(d.getUTCHours() + 9).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
      }

      const isFinal = homeScore && awayScore && !status.includes('Cancel')
      const isCanceled = status.includes('Cancel') || status.includes('중지')
      if (isCanceled) return

      const externalId = `kbo_${href.replace(/\//g, '_') || `${gameDate}_${i}`}`
      const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(externalId)

      if (existing) {
        if (isFinal) updateGame.run('final', parseInt(homeScore) || null, parseInt(awayScore) || null, externalId)
      } else {
        insertGame.run(externalId, 'KBO', home, away, gameDate, gameTime,
          isFinal ? (parseInt(homeScore) || null) : null,
          isFinal ? (parseInt(awayScore) || null) : null,
          isFinal ? 'final' : 'scheduled', null, null)
      }
    })
    console.log('  KBO 경기 반영 완료')
  } catch (e) { console.error('  KBO 경기 오류:', e.message) }

  generatePredictions('KBO')
  console.log('=== KBO 동기화 완료 ===\n')
}

// ── NPB Sync ────────────────────────────────────────────────
async function syncNPBData() {
  console.log('\n=== NPB 데이터 동기화 ===')

  // 순위
  try {
    const year = new Date().getFullYear()
    const res = await fetch(`https://npb.jp/bis/${year}/stats/`, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    db.prepare("DELETE FROM team_stats WHERE league = 'NPB'").run()
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')

    const tables = ch('table')
    for (let tableIdx = 0; tableIdx < 2; tableIdx++) {
      ch(tables[tableIdx]).find('tr').each((j, tr) => {
        const thCell = ch(tr).find('th')
        const cells = ch(tr).find('td')
        if (cells.length === 0 || thCell.length === 0) return

        const rawName = thCell.first().text().trim()
        let teamEn = null
        for (const [jpName, enName] of Object.entries(NPB_NAME_MAP)) {
          if (rawName.includes(jpName)) { teamEn = enName; break }
        }
        if (!teamEn) return

        const gp = parseInt(cells.eq(0).text().trim()) || 0
        const w = parseInt(cells.eq(1).text().trim()) || 0
        const l = parseInt(cells.eq(2).text().trim()) || 0
        const pctText = cells.eq(4).text().trim().replace('.', '0.')
        const pct = parseFloat(pctText) || 0.5

        const elo = Math.round(1500 + (pct - 0.5) * 500)
        const avgRS = 4.0 + (pct - 0.5) * 2
        const avgRA = 4.0 - (pct - 0.5) * 2

        insertTeam.run(teamEn, 'NPB', Math.round(avgRS * 100) / 100, Math.round(avgRA * 100) / 100,
          pct, 0.5 + (pct - 0.5) * 0.3, 0.5 + (pct - 0.5) * 0.2,
          elo, Math.round((avgRS - avgRA) * 100) / 100, j, gp, w, l, 0, 1)
      })
    }
    console.log('  NPB 순위 반영 완료')
  } catch (e) { console.error('  NPB 순위 오류:', e.message) }

  // 경기
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const todayStr = `${month}${String(now.getDate()).padStart(2, '0')}`

    const res = await fetch(`https://npb.jp/games/${year}/schedule_${month}.html`, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status) VALUES (?,?,?,?,?,?,?,?,?)')

    const NPB_ABBR = {
      't': 'Hanshin Tigers', 'g': 'Yomiuri Giants', 'db': 'Yokohama DeNA BayStars',
      'c': 'Hiroshima Toyo Carp', 'd': 'Chunichi Dragons', 's': 'Tokyo Yakult Swallows',
      'h': 'Fukuoka SoftBank Hawks', 'bs': 'Orix Buffaloes', 'b': 'Orix Buffaloes',
      'l': 'Saitama Seibu Lions', 'e': 'Tohoku Rakuten Golden Eagles',
      'm': 'Chiba Lotte Marines', 'f': 'Hokkaido Nippon-Ham Fighters',
    }

    ch(`a[href*="/scores/${year}/"]`).each((i, el) => {
      const href = ch(el).attr('href') || ''
      const text = ch(el).text().trim()
      const hrefMatch = href.match(/\/scores\/\d{4}\/(\d{4})\/([a-z]+)-([a-z]+)-(\d+)/)
      if (!hrefMatch) return

      const dateStr = hrefMatch[1]
      const awayAbbr = hrefMatch[2]
      const homeAbbr = hrefMatch[3]
      const awayTeam = NPB_ABBR[awayAbbr]
      const homeTeam = NPB_ABBR[homeAbbr]
      if (!awayTeam || !homeTeam) return

      const gameDate = `${year}-${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}`
      const externalId = `npb_${dateStr}_${awayAbbr}_${homeAbbr}`
      const isCanceled = text.includes('中止')
      if (isCanceled) return

      const scoreMatch = text.match(/(\d+)-(\d+)/)
      let status = 'scheduled', awayScore = null, homeScore = null
      if (scoreMatch) {
        awayScore = parseInt(scoreMatch[1])
        homeScore = parseInt(scoreMatch[2])
        status = dateStr < todayStr ? 'final' : (text.includes('回') ? 'live' : 'scheduled')
      }

      const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(externalId)
      if (!existing) {
        insertGame.run(externalId, 'NPB', homeTeam, awayTeam, gameDate, '18:00', homeScore, awayScore, status)
      } else if (status === 'final' || status === 'live') {
        db.prepare('UPDATE games SET status=?, home_score=?, away_score=? WHERE external_id=?')
          .run(status, homeScore, awayScore, externalId)
      }
    })
    console.log('  NPB 경기 반영 완료')
  } catch (e) { console.error('  NPB 경기 오류:', e.message) }

  generatePredictions('NPB')
  console.log('=== NPB 동기화 완료 ===\n')
}

// ── Main ────────────────────────────────────────────────────
async function syncAll() {
  const start = Date.now()
  console.log(`\n[worker] 전체 동기화 시작 (${new Date().toISOString()})`)
  try {
    await syncKBOData()
    await syncNPBData()
    await syncMLBData()
    console.log(`[worker] 전체 동기화 완료 (${Date.now() - start}ms)\n`)
  } catch (err) {
    console.error('[worker] 동기화 실패:', err.message)
  }
}

const args = process.argv.slice(2)
const isLoop = args.includes('--loop')
const leagueArg = args.find((_, i, a) => a[i - 1] === '--league')

if (leagueArg) {
  // 특정 리그만
  const fn = { mlb: syncMLBData, kbo: syncKBOData, npb: syncNPBData }[leagueArg.toLowerCase()]
  if (fn) fn().then(() => { db.close(); process.exit(0) })
  else { console.error(`Unknown league: ${leagueArg}`); process.exit(1) }
} else if (isLoop) {
  // 주기적 반복
  console.log(`[worker] Loop 모드 — ${SYNC_INTERVAL / 1000 / 60}분 간격`)
  syncAll()
  setInterval(syncAll, SYNC_INTERVAL)
  process.on('SIGTERM', () => { db.close(); process.exit(0) })
  process.on('SIGINT', () => { db.close(); process.exit(0) })
} else {
  // 1회 실행
  syncAll().then(() => { db.close(); process.exit(0) })
}

// Export for use in server.js
export { syncMLBData, syncKBOData, syncNPBData, syncAll }
