import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { load as cheerioLoad } from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8000
const SECRET = process.env.JWT_SECRET || 'ballpredict-secret-key-2024'
const NODE_ENV = process.env.NODE_ENV || 'development'

// CORS — 프로덕션에서는 허용된 origin만 허용
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({
  origin: true, // 모든 origin 허용 (Vercel 프리뷰 등)
  credentials: true,
}))
app.use(express.json())

// Trust proxy (Railway/Render 등 리버스 프록시 뒤에서 동작)
app.set('trust proxy', 1)

// ── Database Setup ──────────────────────────────────────────
const db = new Database(join(__dirname, 'ballpredict.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    name TEXT,
    nickname TEXT UNIQUE,
    phone TEXT,
    birthday TEXT,
    privacy_agreed INTEGER DEFAULT 0,
    plan TEXT DEFAULT 'free',
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    subscription_status TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS team_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL,
    league TEXT NOT NULL,
    avg_runs_scored REAL DEFAULT 0,
    avg_runs_allowed REAL DEFAULT 0,
    win_rate_last5 REAL DEFAULT 0.5,
    win_rate_home REAL DEFAULT 0.5,
    win_rate_away REAL DEFAULT 0.5,
    elo_rating REAL DEFAULT 1500,
    run_differential REAL DEFAULT 0,
    league_rank INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    rest_days INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS pitchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team TEXT NOT NULL,
    league TEXT NOT NULL,
    era REAL DEFAULT 4.5,
    whip REAL DEFAULT 1.3,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    innings_pitched REAL DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    recent_form REAL DEFAULT 0.5
  );
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE,
    sport TEXT DEFAULT 'baseball',
    league TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    game_date TEXT NOT NULL,
    game_time TEXT,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT DEFAULT 'scheduled',
    home_odds REAL,
    away_odds REAL,
    home_pitcher TEXT,
    away_pitcher TEXT,
    current_inning INTEGER,
    inning_half TEXT,
    outs INTEGER,
    period TEXT,
    clock TEXT,
    live_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER UNIQUE NOT NULL,
    home_win_probability REAL NOT NULL,
    away_win_probability REAL NOT NULL,
    recommended_pick TEXT NOT NULL,
    confidence_score INTEGER NOT NULL,
    team_form_score REAL,
    pitcher_score REAL,
    home_advantage_score REAL,
    elo_diff_score REAL,
    h2h_score REAL,
    bullpen_score REAL,
    recent_form_score REAL,
    FOREIGN KEY (game_id) REFERENCES games(id)
  );
`)

// 커뮤니티 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    game_league TEXT,
    game_teams TEXT,
    bet_odds REAL,
    bet_amount INTEGER,
    bet_profit INTEGER,
    bet_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS saved_bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    selections TEXT NOT NULL,
    total_odds REAL,
    bet_amount INTEGER,
    potential_win INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS live_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT,
    admin_reply_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'notice',
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

// 안전하게 컬럼 추가 (이미 있으면 무시)
try { db.exec('ALTER TABLE predictions ADD COLUMN bullpen_score REAL') } catch {}
try { db.exec('ALTER TABLE predictions ADD COLUMN recent_form_score REAL') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN current_inning INTEGER') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN inning_half TEXT') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN outs INTEGER') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN live_data TEXT') } catch {}
// 유저 신규 컬럼
try { db.exec("ALTER TABLE games ADD COLUMN sport TEXT DEFAULT 'baseball'") } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN home_logo TEXT') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN away_logo TEXT') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN period TEXT') } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN clock TEXT') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN nickname TEXT UNIQUE') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN birthday TEXT') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN privacy_agreed INTEGER DEFAULT 0') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN plan TEXT DEFAULT "free"') } catch {}

// ── Korean Team Name Mapping ────────────────────────────────
const TEAM_NAME_KR = {
  // MLB
  'New York Yankees': '뉴욕 양키스', 'Boston Red Sox': '보스턴 레드삭스',
  'Toronto Blue Jays': '토론토 블루제이스', 'Baltimore Orioles': '볼티모어 오리올스',
  'Tampa Bay Rays': '탬파베이 레이스', 'Cleveland Guardians': '클리블랜드 가디언스',
  'Minnesota Twins': '미네소타 트윈스', 'Detroit Tigers': '디트로이트 타이거스',
  'Chicago White Sox': '시카고 화이트삭스', 'Kansas City Royals': '캔자스시티 로열스',
  'Houston Astros': '휴스턴 애스트로스', 'Seattle Mariners': '시애틀 매리너스',
  'Texas Rangers': '텍사스 레인저스', 'Los Angeles Angels': 'LA 에인절스',
  'Oakland Athletics': '오클랜드 애슬레틱스', 'Athletics': '오클랜드 애슬레틱스',
  'Atlanta Braves': '애틀랜타 브레이브스', 'Philadelphia Phillies': '필라델피아 필리스',
  'New York Mets': '뉴욕 메츠', 'Miami Marlins': '마이애미 말린스',
  'Washington Nationals': '워싱턴 내셔널스', 'Milwaukee Brewers': '밀워키 브루어스',
  'Chicago Cubs': '시카고 컵스', 'Cincinnati Reds': '신시내티 레즈',
  'Pittsburgh Pirates': '피츠버그 파이리츠', 'St. Louis Cardinals': '세인트루이스 카디널스',
  'Los Angeles Dodgers': 'LA 다저스', 'San Diego Padres': '샌디에이고 파드리스',
  'Arizona Diamondbacks': '애리조나 다이아몬드백스', 'San Francisco Giants': '샌프란시스코 자이언츠',
  'Colorado Rockies': '콜로라도 로키스',
  // NPB
  'Yomiuri Giants': '요미우리 자이언츠', 'Hanshin Tigers': '한신 타이거스',
  'Yokohama DeNA BayStars': '요코하마 DeNA 베이스타즈', 'Hiroshima Toyo Carp': '히로시마 도요 카프',
  'Chunichi Dragons': '주니치 드래곤즈', 'Tokyo Yakult Swallows': '도쿄 야쿠르트 스왈로즈',
  'Orix Buffaloes': '오릭스 버팔로즈', 'Fukuoka SoftBank Hawks': '후쿠오카 소프트뱅크 호크스',
  'Saitama Seibu Lions': '사이타마 세이부 라이온즈',
  'Tohoku Rakuten Eagles': '도호쿠 라쿠텐 이글스', 'Tohoku Rakuten Golden Eagles': '도호쿠 라쿠텐 이글스',
  'Chiba Lotte Marines': '지바 롯데 마린스',
  'Nippon-Ham Fighters': '닛폰햄 파이터즈', 'Hokkaido Nippon-Ham Fighters': '닛폰햄 파이터즈',
  // KBO
  'Samsung Lions': '삼성 라이온즈', 'Kia Tigers': '기아 타이거즈',
  'LG Twins': 'LG 트윈스', 'Doosan Bears': '두산 베어스',
  'KT Wiz': 'KT 위즈', 'SSG Landers': 'SSG 랜더스',
  'NC Dinos': 'NC 다이노스', 'Lotte Giants': '롯데 자이언츠',
  'Hanwha Eagles': '한화 이글스', 'Kiwoom Heroes': '키움 히어로즈',
}

// ── NPB Japanese -> English Name Mapping ─────────────────────
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

// KBO Korean -> English Name Mapping
const KBO_NAME_MAP = {
  'SSG': 'SSG Landers', 'KT': 'KT Wiz', 'LG': 'LG Twins',
  '한화': 'Hanwha Eagles', 'NC': 'NC Dinos', '삼성': 'Samsung Lions',
  '두산': 'Doosan Bears', '롯데': 'Lotte Giants', 'KIA': 'Kia Tigers',
  '키움': 'Kiwoom Heroes',
}

// ── Prediction Engine (Enhanced v3) ─────────────────────────
function sigmoid(x) { return 1.0 / (1.0 + Math.exp(-x)) }
function normalize(val, min, max) {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (val - min) / (max - min)))
}

function predictGame(ht, at, hp, ap) {
  // ── 1. 팀 폼 (최근 성적 + 연승/연패 모멘텀 강화) ──
  const hWinPct = ht.games_played > 0 ? ht.wins / ht.games_played : 0.5
  const aWinPct = at.games_played > 0 ? at.wins / at.games_played : 0.5

  // 연승/연패를 최근 폼에 반영: streak이 있으면 win_rate_last5 보정
  const adjustedLast5 = (t) => {
    const base = t.win_rate_last5 || 0.5
    const streakBonus = normalize(t.streak, -8, 8) * 0.15 - 0.075 // -0.075 ~ +0.075
    return Math.min(1, Math.max(0, base + streakBonus))
  }

  // 최근 폼(35%) > 득점력(15%) > 실점억제(15%) > 연승모멘텀(15%) > 시즌승률(10%) > 휴식(10%)
  const calcForm = (t, winPct) => {
    const restBonus = normalize(t.rest_days || 1, 0, 4) * 0.1
    const last5Adj = adjustedLast5(t)
    const streakMomentum = normalize(t.streak, -8, 8)
    return (last5Adj * 0.35) +
      (normalize(t.avg_runs_scored, 2, 7) * 0.15) +
      ((1 - normalize(t.avg_runs_allowed, 2, 7)) * 0.15) +
      (streakMomentum * 0.15) +
      (winPct * 0.10) +
      restBonus
  }

  const hForm = calcForm(ht, hWinPct)
  const aForm = calcForm(at, aWinPct)
  const teamForm = sigmoid((hForm - aForm) * 5.0)

  // ── 2. 투수 매치업 + 불펜 소모도 ──
  let pitcherScore = 0.5
  let bullpenScore = 0.5
  if (hp || ap) {
    const pitcherStr = (p) => {
      if (!p) return 0.45
      const eraScore = 1 - normalize(p.era, 1.0, 7.0)
      const whipScore = 1 - normalize(p.whip, 0.7, 2.0)
      // 투수 최근 폼: ERA 기반 보정 (ERA 낮을수록 폼 좋음)
      const eraForm = p.era > 0 ? Math.max(0, 1 - (p.era - 3.5) / 5.0) : 0.5
      const formScore = p.recent_form ? (p.recent_form * 0.4 + eraForm * 0.6) : eraForm
      const kPerIP = p.innings_pitched > 0 ? p.strikeouts / p.innings_pitched : 0
      const kScore = normalize(kPerIP, 0.3, 1.5)
      const totalDec = (p.wins || 0) + (p.losses || 0)
      const winPct = totalDec > 0 ? p.wins / totalDec : 0.5
      const staminaScore = normalize(p.innings_pitched, 10, 180)
      return eraScore * 0.28 + whipScore * 0.20 + formScore * 0.18 + kScore * 0.12 + winPct * 0.10 + staminaScore * 0.12
    }
    const hpStr = pitcherStr(hp)
    const apStr = pitcherStr(ap)
    pitcherScore = sigmoid((hpStr - apStr) * 5.0)

    // 불펜 소모도
    const hBullpenLoad = hp ? Math.max(0, 1 - normalize(hp.innings_pitched / Math.max(1, (hp.wins + hp.losses) * 5.5), 0.5, 1.2)) : 0.5
    const aBullpenLoad = ap ? Math.max(0, 1 - normalize(ap.innings_pitched / Math.max(1, (ap.wins + ap.losses) * 5.5), 0.5, 1.2)) : 0.5
    bullpenScore = sigmoid((aBullpenLoad - hBullpenLoad) * 3.0)
  }

  // ── 3. 홈/원정 어드밴티지 (리그별 + 실제 홈/원정 성적 강화) ──
  const LEAGUE_HOME_ADV = { KBO: 0.56, NPB: 0.54, MLB: 0.53 }
  const baseHomeAdv = LEAGUE_HOME_ADV[ht.league] || 0.54
  // 홈팀 홈성적과 원정팀 원정성적의 차이를 더 크게 반영
  const homeRecordAdj = (ht.win_rate_home - 0.5) * 0.6
  const awayWeaknessAdj = (0.5 - at.win_rate_away) * 0.45
  const homeStreakAdj = (normalize(ht.streak, -5, 5) - 0.5) * 0.12
  const homeAdv = Math.min(0.70, Math.max(0.30,
    baseHomeAdv + homeRecordAdj + awayWeaknessAdj + homeStreakAdj
  ))

  // ── 4. ELO 차이 ──
  const eloDiff = ht.elo_rating - at.elo_rating
  const eloScore = 1.0 / (1.0 + Math.pow(10, -eloDiff / 400))

  // ── 5. 상대전적 (득실차 + 순위 차이 기반 근사) ──
  const rdDiff = (ht.run_differential || 0) - (at.run_differential || 0)
  const rankDiff = (at.league_rank || 5) - (ht.league_rank || 5)
  const h2hScore = sigmoid((rdDiff * 0.25 + rankDiff * 0.15) * 1.5)

  // ── 6. 최근 성적 직접 비교 (연승/연패 반영 강화) ──
  const hRecent = adjustedLast5(ht)
  const aRecent = adjustedLast5(at)
  const recentDiff = hRecent - aRecent
  const recentScore = sigmoid(recentDiff * 6.0)

  // ── 최종 가중합 (홈어드밴티지 & 최근폼 가중치 상향) ──
  // 투수(20%) + 팀폼(18%) + ELO(15%) + 홈어드밴티지(14%) + 최근성적(14%) + 상대전적(8%) + 불펜(6%) + 기본(5%)
  const weighted =
    pitcherScore * 0.20 +
    teamForm * 0.18 +
    eloScore * 0.15 +
    homeAdv * 0.14 +
    recentScore * 0.14 +
    h2hScore * 0.08 +
    bullpenScore * 0.06 +
    0.5 * 0.05

  const homeProb = Math.round(weighted * 1000) / 10
  const awayProb = Math.round((1 - weighted) * 1000) / 10
  const confidence = Math.min(99, Math.max(1, Math.round(Math.abs(weighted - 0.5) * 220)))

  return {
    home_win_probability: homeProb, away_win_probability: awayProb,
    recommended_pick: weighted >= 0.5 ? 'home' : 'away', confidence_score: confidence,
    team_form_score: Math.round(teamForm * 10000) / 10000,
    pitcher_score: Math.round(pitcherScore * 10000) / 10000,
    home_advantage_score: Math.round(homeAdv * 10000) / 10000,
    elo_diff_score: Math.round(eloScore * 10000) / 10000,
    h2h_score: Math.round(h2hScore * 10000) / 10000,
    bullpen_score: Math.round(bullpenScore * 10000) / 10000,
    recent_form_score: Math.round(recentScore * 10000) / 10000,
  }
}

// ── In-Game Live Prediction Engine ──────────────────────────
// 기대득점 매트릭스 (아웃카운트 x 주자상황) - MLB 2015-2024 평균 기반
const RUN_EXPECTANCY = {
  // [아웃카운트][주자상황] = 기대득점
  // 주자: 'empty', '1b', '2b', '3b', '12b', '13b', '23b', 'loaded'
  0: { empty: 0.481, '1b': 0.859, '2b': 1.100, '3b': 1.344, '12b': 1.437, '13b': 1.784, '23b': 1.920, loaded: 2.282 },
  1: { empty: 0.254, '1b': 0.509, '2b': 0.664, '3b': 0.950, '12b': 0.884, '13b': 1.130, '23b': 1.352, loaded: 1.520 },
  2: { empty: 0.098, '1b': 0.224, '2b': 0.319, '3b': 0.353, '12b': 0.429, '13b': 0.478, '23b': 0.540, loaded: 0.752 },
}

// 득점 확률 매트릭스 (해당 이닝에서 최소 1점 이상 득점할 확률)
const SCORING_PROBABILITY = {
  0: { empty: 0.277, '1b': 0.432, '2b': 0.601, '3b': 0.853, '12b': 0.637, '13b': 0.867, '23b': 0.862, loaded: 0.876 },
  1: { empty: 0.163, '1b': 0.278, '2b': 0.412, '3b': 0.674, '12b': 0.407, '13b': 0.650, '23b': 0.690, loaded: 0.679 },
  2: { empty: 0.068, '1b': 0.130, '2b': 0.222, '3b': 0.270, '12b': 0.225, '13b': 0.291, '23b': 0.312, loaded: 0.350 },
}

function encodeRunners(r1, r2, r3) {
  if (!r1 && !r2 && !r3) return 'empty'
  if (r1 && r2 && r3) return 'loaded'
  if (r1 && r2) return '12b'
  if (r1 && r3) return '13b'
  if (r2 && r3) return '23b'
  if (r1) return '1b'
  if (r2) return '2b'
  return '3b'
}

function predictLiveGame({ inning, isTop, outs, runner1b, runner2b, runner3b,
  homeScore, awayScore, pitcherEra, pitcherPitchCount, pitcherInnings,
  homeBullpenEra, awayBullpenEra, homeWinPctPregame }) {

  const runners = encodeRunners(runner1b, runner2b, runner3b)
  const expectedRuns = RUN_EXPECTANCY[outs]?.[runners] ?? 0.25
  const scoringProb = SCORING_PROBABILITY[outs]?.[runners] ?? 0.15

  // ── 투수 피로도 보정 ──
  const pitchFatigue = normalize(pitcherPitchCount || 0, 0, 120)
  const inningFatigue = normalize(pitcherInnings || 0, 0, 8)
  const fatigueMultiplier = 1 + (pitchFatigue * 0.3 + inningFatigue * 0.2)
  const adjustedExpectedRuns = expectedRuns * fatigueMultiplier

  // ── 투수 ERA 보정 ──
  const eraMultiplier = (pitcherEra || 4.5) / 4.5
  const finalExpectedRuns = Math.round(adjustedExpectedRuns * eraMultiplier * 1000) / 1000
  const finalScoringProb = Math.min(0.99, Math.round(scoringProb * eraMultiplier * fatigueMultiplier * 0.85 * 1000) / 1000)

  // ── 이닝 종료 예측 ──
  const inningEndProb = {
    0: 0.08,  // 0아웃: 이닝 곧 끝날 확률 낮음
    1: 0.28,  // 1아웃: 중간
    2: 0.72,  // 2아웃: 높음
  }
  const baseInningEnd = inningEndProb[outs] ?? 0.5
  // 주자가 없으면 빨리 끝날 수 있음
  const runnerPenalty = runners === 'empty' ? 1.1 : runners === 'loaded' ? 0.8 : 0.95
  const inningEndProbFinal = Math.min(0.95, Math.round(baseInningEnd * runnerPenalty * 1000) / 1000)

  // ── 승률 계산 (점수차 + 이닝 + 경기전 승률) ──
  const scoreDiff = homeScore - awayScore // 홈팀 기준 점수차
  const remainingInnings = Math.max(0.5, 9 - inning + (isTop ? 0.5 : 0))
  const totalInnings = 9

  // 점수차의 영향력은 남은 이닝이 적을수록 커짐
  const leverageIndex = totalInnings / Math.max(0.5, remainingInnings)
  const scoreDiffImpact = sigmoid(scoreDiff * leverageIndex * 0.4)

  // 경기전 승률과 현재 상황 결합
  const pregameWin = homeWinPctPregame || 0.5
  const inGameWeight = Math.min(0.85, inning / totalInnings) // 이닝 진행될수록 인게임 비중 ↑
  const pregameWeight = 1 - inGameWeight

  // 공격 흐름 보너스 (현재 공격팀에 주자가 많으면 흐름 좋음)
  const runnerCount = (runner1b ? 1 : 0) + (runner2b ? 1 : 0) + (runner3b ? 1 : 0)
  const momentumBonus = runnerCount * 0.015 * (outs < 2 ? 1.5 : 0.5) // 2아웃 미만이면 모멘텀 더 큼
  const attackingTeamIsHome = !isTop
  const momentumForHome = attackingTeamIsHome ? momentumBonus : -momentumBonus

  // 불펜 ERA 차이 (남은 이닝에 영향)
  const bullpenImpact = remainingInnings > 2
    ? sigmoid(((awayBullpenEra || 4.5) - (homeBullpenEra || 4.5)) * 0.3) - 0.5
    : 0
  const bullpenAdj = bullpenImpact * 0.1

  const homeWinProb = Math.min(0.99, Math.max(0.01,
    scoreDiffImpact * inGameWeight +
    pregameWin * pregameWeight +
    momentumForHome +
    bullpenAdj
  ))

  return {
    // 기대득점
    expected_runs: finalExpectedRuns,
    scoring_probability: finalScoringProb,
    no_scoring_probability: Math.round((1 - finalScoringProb) * 1000) / 1000,
    // 이닝 종료
    inning_end_probability: inningEndProbFinal,
    // 승률
    home_win_probability: Math.round(homeWinProb * 1000) / 10,
    away_win_probability: Math.round((1 - homeWinProb) * 1000) / 10,
    // 상황 요약
    situation: {
      inning, isTop, outs,
      runners, runner_count: runnerCount,
      score_diff: scoreDiff,
      remaining_innings: remainingInnings,
      pitcher_fatigue: Math.round(pitchFatigue * 100),
      leverage_index: Math.round(leverageIndex * 100) / 100,
      momentum: attackingTeamIsHome ? 'home' : 'away',
      momentum_strength: Math.round(Math.abs(momentumBonus) * 1000) / 1000,
    },
    // 시나리오 예측
    scenarios: generateScenarios(outs, runners, finalExpectedRuns, scoreDiff, inning, isTop),
  }
}

function generateScenarios(outs, runners, expectedRuns, scoreDiff, inning, isTop) {
  const scenarios = []

  if (outs === 0 && runners === 'empty') {
    scenarios.push({ desc: '무사 주자 없음 - 평균적 상황', type: 'neutral' })
  }
  if (outs === 2 && runners === 'empty') {
    scenarios.push({ desc: '2사 주자 없음 → 무득점 가능성 높음', type: 'low_scoring', prob: '93.2%' })
  }
  if (runners === 'loaded') {
    scenarios.push({ desc: '만루 → 최소 1득점 가능성 매우 높음', type: 'high_scoring',
      prob: `${Math.round(SCORING_PROBABILITY[outs]?.loaded * 100)}%` })
  }
  if (runners === '2b' && outs < 2) {
    scenarios.push({ desc: `${outs}사 2루 → 안타 시 득점 가능`, type: 'scoring_position',
      prob: `${Math.round(SCORING_PROBABILITY[outs]?.['2b'] * 100)}%` })
  }
  if (runners === '3b') {
    scenarios.push({ desc: `${outs}사 3루 → 희생플라이로도 득점 가능`, type: 'scoring_position',
      prob: `${Math.round(SCORING_PROBABILITY[outs]?.['3b'] * 100)}%` })
  }
  if (runners === '23b' || runners === '13b') {
    scenarios.push({ desc: '득점권 복수 주자 → 빅이닝 가능성', type: 'high_scoring',
      prob: `기대득점 ${expectedRuns.toFixed(2)}점` })
  }

  // 점수 상황 시나리오
  if (Math.abs(scoreDiff) <= 1 && inning >= 7) {
    scenarios.push({ desc: '접전 후반부 → 한 점이 결정적', type: 'close_game' })
  }
  if (Math.abs(scoreDiff) >= 5 && inning >= 6) {
    scenarios.push({ desc: '대량 점수차 → 역전 확률 매우 낮음', type: 'blowout' })
  }

  return scenarios
}

// ── MLB Stats API Fetcher ───────────────────────────────────
const MLB_API = 'https://statsapi.mlb.com/api/v1'

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

async function fetchMLBSchedule(startDate, endDate) {
  console.log(`  MLB 일정 조회: ${startDate} ~ ${endDate}`)
  const url = `${MLB_API}/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=probablePitcher(note),linescore,team`
  const data = await fetchJSON(url)
  if (!data?.dates) return []

  const games = []
  for (const dateObj of data.dates) {
    for (const g of dateObj.games) {
      const homeTeam = g.teams.home.team.name
      const awayTeam = g.teams.away.team.name
      const status = g.status.abstractGameState // Preview, Live, Final
      const gameDate = g.officialDate || dateObj.date
      const gameTime = g.gameDate ? new Date(g.gameDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null

      const homePitcher = g.teams.home.probablePitcher?.fullName || null
      const awayPitcher = g.teams.away.probablePitcher?.fullName || null
      const homeScore = (status === 'Final' || status === 'Live') ? (g.teams.home.score ?? null) : null
      const awayScore = (status === 'Final' || status === 'Live') ? (g.teams.away.score ?? null) : null

      // 라이브 경기 상세 정보
      const linescore = g.linescore || null
      const currentInning = linescore?.currentInning || null
      const inningHalf = linescore?.inningHalf || null // 'Top' or 'Bottom'
      const outs = linescore?.outs || null

      games.push({
        external_id: `mlb_${g.gamePk}`,
        league: 'MLB',
        home_team: homeTeam,
        away_team: awayTeam,
        game_date: gameDate,
        game_time: gameTime,
        status: status === 'Final' ? 'final' : status === 'Live' ? 'live' : 'scheduled',
        home_score: homeScore,
        away_score: awayScore,
        home_pitcher: homePitcher,
        away_pitcher: awayPitcher,
        current_inning: currentInning,
        inning_half: inningHalf,
        outs: outs,
      })
    }
  }
  console.log(`  MLB 경기 ${games.length}개 조회 완료`)
  return games
}

async function fetchMLBStandings() {
  console.log('  MLB 순위 조회...')
  const year = new Date().getFullYear()
  const data = await fetchJSON(`${MLB_API}/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&hydrate=team`)
  if (!data?.records) return []

  const teams = []
  for (const record of data.records) {
    for (const tr of record.teamRecords) {
      const name = tr.team.name
      const w = tr.wins || 0
      const l = tr.losses || 0
      const gp = w + l
      const winPct = tr.winningPercentage ? parseFloat(tr.winningPercentage) : (gp > 0 ? w / gp : 0.5)
      const rd = tr.runDifferential || 0
      const streak = tr.streak?.streakNumber || 0
      const streakType = tr.streak?.streakType // 'wins' or 'losses'
      const streakVal = streakType === 'losses' ? -streak : streak

      // ELO 근사: 1500 기반 + 승률 반영
      const elo = Math.round(1500 + (winPct - 0.5) * 600 + rd * 0.3)

      const runsScored = tr.runsScored || 0
      const runsAllowed = tr.runsAllowed || 0
      const avgRS = gp > 0 ? Math.round((runsScored / gp) * 100) / 100 : 4.5
      const avgRA = gp > 0 ? Math.round((runsAllowed / gp) * 100) / 100 : 4.5

      // 홈/원정 성적
      const homeW = tr.records?.splitRecords?.find(r => r.type === 'home')?.wins || Math.round(w * 0.55)
      const homeL = tr.records?.splitRecords?.find(r => r.type === 'home')?.losses || Math.round(l * 0.45)
      const awayW = tr.records?.splitRecords?.find(r => r.type === 'away')?.wins || w - homeW
      const awayL = tr.records?.splitRecords?.find(r => r.type === 'away')?.losses || l - homeL
      const winRateHome = (homeW + homeL) > 0 ? Math.round(homeW / (homeW + homeL) * 1000) / 1000 : 0.5
      const winRateAway = (awayW + awayL) > 0 ? Math.round(awayW / (awayW + awayL) * 1000) / 1000 : 0.5

      // 최근 10경기 성적을 last5 근사로
      const last10 = tr.records?.splitRecords?.find(r => r.type === 'lastTen')
      const winLast5 = last10 ? Math.round((last10.wins / (last10.wins + last10.losses)) * 1000) / 1000 : winPct

      teams.push({
        team_name: name, league: 'MLB', avg_runs_scored: avgRS, avg_runs_allowed: avgRA,
        win_rate_last5: winLast5, win_rate_home: winRateHome, win_rate_away: winRateAway,
        elo_rating: elo, run_differential: rd, league_rank: tr.divisionRank ? parseInt(tr.divisionRank) : 0,
        games_played: gp, wins: w, losses: l, streak: streakVal, rest_days: 1,
      })
    }
  }
  console.log(`  MLB 팀 ${teams.length}개 순위 조회 완료`)
  return teams
}

async function fetchMLBPitcherStats(pitcherName, teamName) {
  // 투수 이름으로 검색
  const searchUrl = `${MLB_API}/people/search?names=${encodeURIComponent(pitcherName)}&sportId=1`
  const data = await fetchJSON(searchUrl)
  if (!data?.people?.[0]) return null

  const person = data.people[0]
  const year = new Date().getFullYear()
  const statsUrl = `${MLB_API}/people/${person.id}/stats?stats=season&season=${year}&group=pitching`
  const statsData = await fetchJSON(statsUrl)
  const splits = statsData?.stats?.[0]?.splits
  if (!splits?.length) return null

  const s = splits[0].stat
  return {
    name: person.fullName, team: teamName, league: 'MLB',
    era: parseFloat(s.era) || 4.5, whip: parseFloat(s.whip) || 1.3,
    wins: s.wins || 0, losses: s.losses || 0,
    innings_pitched: parseFloat(s.inningsPitched) || 0,
    strikeouts: s.strikeOuts || 0,
    recent_form: s.winPercentage ? parseFloat(s.winPercentage) : 0.5,
  }
}

// ── Data Sync ───────────────────────────────────────────────
async function syncMLBData() {
  console.log('\n=== MLB 실제 데이터 동기화 시작 ===')

  // 1. 순위 & 팀 스탯
  const standings = await fetchMLBStandings()
  if (standings.length > 0) {
    db.prepare('DELETE FROM team_stats WHERE league = ?').run('MLB')
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    for (const t of standings) {
      insertTeam.run(t.team_name, t.league, t.avg_runs_scored, t.avg_runs_allowed,
        t.win_rate_last5, t.win_rate_home, t.win_rate_away, t.elo_rating,
        t.run_differential, t.league_rank, t.games_played, t.wins, t.losses, t.streak, t.rest_days)
    }
  }

  // 2. 경기 일정 (오늘 기준 -3일 ~ +7일)
  const today = new Date()
  const start = new Date(today); start.setDate(today.getDate() - 3)
  const end = new Date(today); end.setDate(today.getDate() + 7)
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const mlbGames = await fetchMLBSchedule(startStr, endStr)

  const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status,home_odds,away_odds,home_pitcher,away_pitcher,current_inning,inning_half,outs) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  const updateGame = db.prepare('UPDATE games SET status=?, home_score=?, away_score=?, home_pitcher=?, away_pitcher=?, game_time=?, current_inning=?, inning_half=?, outs=? WHERE external_id=?')

  for (const g of mlbGames) {
    const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(g.external_id)
    if (existing) {
      updateGame.run(g.status, g.home_score, g.away_score, g.home_pitcher, g.away_pitcher, g.game_time, g.current_inning, g.inning_half, g.outs, g.external_id)
    } else {
      insertGame.run(g.external_id, g.league, g.home_team, g.away_team, g.game_date, g.game_time,
        g.home_score, g.away_score, g.status, null, null, g.home_pitcher, g.away_pitcher, g.current_inning, g.inning_half, g.outs)
    }
  }

  // 3. 선발투수 스탯 가져오기 (고유 투수만)
  const pitcherNames = new Set()
  const pitcherTeamMap = {}
  for (const g of mlbGames) {
    if (g.home_pitcher) { pitcherNames.add(g.home_pitcher); pitcherTeamMap[g.home_pitcher] = g.home_team }
    if (g.away_pitcher) { pitcherNames.add(g.away_pitcher); pitcherTeamMap[g.away_pitcher] = g.away_team }
  }

  console.log(`  선발투수 ${pitcherNames.size}명 스탯 조회 중...`)
  const insertPitcher = db.prepare('INSERT OR REPLACE INTO pitchers (name,team,league,era,whip,wins,losses,innings_pitched,strikeouts,recent_form) VALUES (?,?,?,?,?,?,?,?,?,?)')

  // 병렬 요청 (5개씩 배치)
  const pitcherArr = [...pitcherNames]
  for (let i = 0; i < pitcherArr.length; i += 5) {
    const batch = pitcherArr.slice(i, i + 5)
    const results = await Promise.all(
      batch.map(name => fetchMLBPitcherStats(name, pitcherTeamMap[name]))
    )
    for (const stats of results) {
      if (stats) {
        insertPitcher.run(stats.name, stats.team, stats.league, stats.era, stats.whip,
          stats.wins, stats.losses, stats.innings_pitched, stats.strikeouts, stats.recent_form)
      }
    }
  }

  // 4. 예측 생성
  console.log('  예측 생성 중...')
  const getTeam = db.prepare('SELECT * FROM team_stats WHERE team_name = ?')
  const getPitcher = db.prepare('SELECT * FROM pitchers WHERE name = ?')
  const insertPred = db.prepare('INSERT OR REPLACE INTO predictions (game_id,home_win_probability,away_win_probability,recommended_pick,confidence_score,team_form_score,pitcher_score,home_advantage_score,elo_diff_score,h2h_score,bullpen_score,recent_form_score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')

  const allGames = db.prepare("SELECT * FROM games WHERE league = 'MLB'").all()
  let predCount = 0
  for (const g of allGames) {
    const ht = getTeam.get(g.home_team)
    const at = getTeam.get(g.away_team)
    if (!ht || !at) continue

    const hp = g.home_pitcher ? getPitcher.get(g.home_pitcher) : null
    const ap = g.away_pitcher ? getPitcher.get(g.away_pitcher) : null
    const pred = predictGame(ht, at, hp, ap)
    insertPred.run(g.id, pred.home_win_probability, pred.away_win_probability,
      pred.recommended_pick, pred.confidence_score, pred.team_form_score,
      pred.pitcher_score, pred.home_advantage_score, pred.elo_diff_score, pred.h2h_score,
      pred.bullpen_score, pred.recent_form_score)
    predCount++
  }
  console.log(`  MLB 예측 ${predCount}개 생성 완료`)
  console.log('=== MLB 동기화 완료 ===\n')
}

// ── KBO Web Scraping ────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

async function syncKBOData() {
  console.log('\n=== KBO 실제 데이터 스크래핑 시작 ===')

  // 1. KBO 순위 (koreabaseball.com)
  try {
    console.log('  KBO 순위 조회...')
    const res = await fetch('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: { 'User-Agent': UA }
    })
    const html = await res.text()
    const ch = cheerioLoad(html)

    db.prepare("DELETE FROM team_stats WHERE league = 'KBO'").run()
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')

    const rows = ch('table.tData').first().find('tbody tr')
    let teamCount = 0
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

      // 연속 (ex: "3승", "2패")
      const streakText = tds.eq(9).text().trim()
      let streak = 0
      const streakMatch = streakText.match(/(\d+)(승|패)/)
      if (streakMatch) streak = streakMatch[2] === '승' ? parseInt(streakMatch[1]) : -parseInt(streakMatch[1])

      // 홈/원정 성적 파싱 (ex: "4승2패")
      const homeText = tds.eq(10).text().trim()
      const awayText = tds.eq(11).text().trim()
      const parseRecord = (text) => {
        const m = text.match(/(\d+)승(\d+)패/)
        if (m) return parseInt(m[1]) / (parseInt(m[1]) + parseInt(m[2]))
        return 0.5
      }
      const winRateHome = parseRecord(homeText)
      const winRateAway = parseRecord(awayText)

      // ELO 근사: 승률 기반
      const elo = Math.round(1500 + (pct - 0.5) * 500)
      const avgRS = 4.5 + (pct - 0.5) * 2  // 추정
      const avgRA = 4.5 - (pct - 0.5) * 2
      const rd = Math.round((avgRS - avgRA) * 100) / 100

      // 최근 폼 근사: 연승/연패 반영하여 시즌 승률 보정
      const streakAdj = streak > 0 ? Math.min(streak * 0.04, 0.15) : Math.max(streak * 0.04, -0.15)
      const winRateLast5 = Math.min(1, Math.max(0, pct + streakAdj))

      insertTeam.run(teamEn, 'KBO', Math.round(avgRS * 100) / 100, Math.round(avgRA * 100) / 100,
        winRateLast5, winRateHome, winRateAway, elo, rd, rank, gp, w, l, streak, 1)
      teamCount++
    })
    console.log(`  KBO 팀 ${teamCount}개 순위 반영 완료`)
  } catch (e) { console.error('  KBO 순위 오류:', e.message) }

  // 2. KBO 경기 일정/결과 (mykbostats.com)
  try {
    console.log('  KBO 경기 조회...')
    const res = await fetch('https://mykbostats.com', { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status,home_pitcher,away_pitcher) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    const updateGame = db.prepare('UPDATE games SET status=?, home_score=?, away_score=? WHERE external_id=?')

    let gameCount = 0
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

      // Clean team names — 투수 정보 등 제거하고 팀명만 추출
      const KBO_TEAM_NAMES = [
        'Samsung Lions', 'Kia Tigers', 'LG Twins', 'Doosan Bears',
        'KT Wiz', 'SSG Landers', 'NC Dinos', 'Lotte Giants',
        'Hanwha Eagles', 'Kiwoom Heroes'
      ]
      const cleanTeam = (name) => {
        const text = name.split('\n').map(s => s.trim()).filter(Boolean).join(' ')
        // 알려진 KBO 팀명과 매칭
        for (const t of KBO_TEAM_NAMES) {
          if (text.includes(t)) return t
        }
        // 매칭 안되면 첫 2~3 단어만 (투수 정보 제거)
        const words = text.split(/\s+/)
        if (words.length > 2 && /^[A-Z]/.test(words[2])) return words.slice(0, 3).join(' ')
        return words.slice(0, 2).join(' ')
      }

      const home = cleanTeam(homeTeam)
      const away = cleanTeam(awayTeam)

      // Determine game date
      let gameDate = new Date().toISOString().split('T')[0]
      if (datetime) {
        gameDate = new Date(datetime).toISOString().split('T')[0]
      }

      // Game time (KST)
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
        if (isFinal) {
          updateGame.run('final', parseInt(homeScore) || null, parseInt(awayScore) || null, externalId)
        }
      } else {
        insertGame.run(externalId, 'KBO', home, away, gameDate, gameTime,
          isFinal ? (parseInt(homeScore) || null) : null,
          isFinal ? (parseInt(awayScore) || null) : null,
          isFinal ? 'final' : 'scheduled', null, null)
        gameCount++
      }
    })
    console.log(`  KBO 경기 ${gameCount}개 추가`)
  } catch (e) { console.error('  KBO 경기 오류:', e.message) }

  // 3. KBO 예측 생성
  generatePredictions('KBO')
  console.log('=== KBO 동기화 완료 ===\n')
}

// ── NPB Web Scraping ────────────────────────────────────────
async function syncNPBData() {
  console.log('\n=== NPB 실제 데이터 스크래핑 시작 ===')

  // 1. NPB 순위 (npb.jp)
  try {
    console.log('  NPB 순위 조회...')
    const year = new Date().getFullYear()
    const res = await fetch(`https://npb.jp/bis/${year}/stats/`, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    db.prepare("DELETE FROM team_stats WHERE league = 'NPB'").run()
    const insertTeam = db.prepare('INSERT INTO team_stats (team_name,league,avg_runs_scored,avg_runs_allowed,win_rate_last5,win_rate_home,win_rate_away,elo_rating,run_differential,league_rank,games_played,wins,losses,streak,rest_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')

    const tables = ch('table')
    let teamCount = 0

    // Table 0 = Central League, Table 1 = Pacific League
    for (let tableIdx = 0; tableIdx < 2; tableIdx++) {
      const rows = ch(tables[tableIdx]).find('tr')
      rows.each((j, tr) => {
        const thCell = ch(tr).find('th')
        const cells = ch(tr).find('td')
        if (cells.length === 0 || thCell.length === 0) return // skip header

        // Team name is in <th>, stats are in <td>
        const rawName = thCell.first().text().trim()
        let teamEn = null
        for (const [jpName, enName] of Object.entries(NPB_NAME_MAP)) {
          if (rawName.includes(jpName)) {
            teamEn = enName
            break
          }
        }
        if (!teamEn) return

        const gp = parseInt(cells.eq(0).text().trim()) || 0
        const w = parseInt(cells.eq(1).text().trim()) || 0
        const l = parseInt(cells.eq(2).text().trim()) || 0
        const pctText = cells.eq(4).text().trim().replace('.', '0.')
        const pct = parseFloat(pctText) || 0.5

        const rank = j
        const elo = Math.round(1500 + (pct - 0.5) * 500)
        const avgRS = 4.0 + (pct - 0.5) * 2
        const avgRA = 4.0 - (pct - 0.5) * 2
        const rd = Math.round((avgRS - avgRA) * 100) / 100

        // NPB: 홈/원정 성적 근사 (일본 야구는 홈 어드밴티지가 큼)
        const npbWinRateHome = Math.min(0.75, Math.max(0.25, 0.5 + (pct - 0.5) * 0.8 + 0.04))
        const npbWinRateAway = Math.min(0.75, Math.max(0.25, 0.5 + (pct - 0.5) * 0.7 - 0.02))
        // 최근 폼: streak이 없으므로 순위 기반 보정
        const npbRankAdj = (7 - rank) * 0.02 // 1위 +0.12, 6위 +0.02
        const npbLast5 = Math.min(1, Math.max(0, pct + npbRankAdj * 0.5))

        insertTeam.run(teamEn, 'NPB', Math.round(avgRS * 100) / 100, Math.round(avgRA * 100) / 100,
          npbLast5, npbWinRateHome, npbWinRateAway,
          elo, rd, rank, gp, w, l, 0, 1)
        teamCount++
      })
    }
    console.log(`  NPB 팀 ${teamCount}개 순위 반영 완료`)
  } catch (e) { console.error('  NPB 순위 오류:', e.message) }

  // 2. NPB 경기 일정 (npb.jp)
  try {
    console.log('  NPB 경기 조회...')
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const todayStr = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    const res = await fetch(`https://npb.jp/games/${year}/schedule_${month}.html`, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const ch = cheerioLoad(html)

    const insertGame = db.prepare('INSERT OR IGNORE INTO games (external_id,league,home_team,away_team,game_date,game_time,home_score,away_score,status) VALUES (?,?,?,?,?,?,?,?,?)')

    // NPB venue -> team mapping
    const VENUE_HOME = {
      '甲子園': 'Hanshin Tigers', '東京ドーム': 'Yomiuri Giants',
      '横浜': 'Yokohama DeNA BayStars', 'マツダ': 'Hiroshima Toyo Carp',
      'バンテリン': 'Chunichi Dragons', '神宮': 'Tokyo Yakult Swallows',
      'みずほPayPay': 'Fukuoka SoftBank Hawks', 'PayPay': 'Fukuoka SoftBank Hawks',
      '京セラD大阪': 'Orix Buffaloes', '京セラ': 'Orix Buffaloes',
      'ベルーナ': 'Saitama Seibu Lions', '楽天モバイル': 'Tohoku Rakuten Golden Eagles',
      'ZOZOマリン': 'Chiba Lotte Marines', 'エスコン': 'Hokkaido Nippon-Ham Fighters',
    }

    // NPB team abbreviations
    const NPB_ABBR = {
      't': 'Hanshin Tigers', 'g': 'Yomiuri Giants', 'db': 'Yokohama DeNA BayStars',
      'c': 'Hiroshima Toyo Carp', 'd': 'Chunichi Dragons', 's': 'Tokyo Yakult Swallows',
      'h': 'Fukuoka SoftBank Hawks', 'bs': 'Orix Buffaloes', 'b': 'Orix Buffaloes',
      'l': 'Saitama Seibu Lions', 'e': 'Tohoku Rakuten Golden Eagles',
      'm': 'Chiba Lotte Marines', 'f': 'Hokkaido Nippon-Ham Fighters',
    }

    let gameCount = 0
    ch('a[href*="/scores/' + year + '/"]').each((i, el) => {
      const href = ch(el).attr('href') || ''
      const text = ch(el).text().trim()

      // Parse href like /scores/2026/0409/t-s-03/
      const hrefMatch = href.match(/\/scores\/\d{4}\/(\d{4})\/([a-z]+)-([a-z]+)-(\d+)/)
      if (!hrefMatch) return

      const dateStr = hrefMatch[1]  // MMDD
      const awayAbbr = hrefMatch[2]
      const homeAbbr = hrefMatch[3]

      const awayTeam = NPB_ABBR[awayAbbr]
      const homeTeam = NPB_ABBR[homeAbbr]
      if (!awayTeam || !homeTeam) return

      const gameDate = `${year}-${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}`
      const externalId = `npb_${dateStr}_${awayAbbr}_${homeAbbr}`

      // Parse score from text (e.g., "1-0\n(venue)")
      const scoreMatch = text.match(/(\d+)-(\d+)/)
      const isCanceled = text.includes('中止')
      if (isCanceled) return

      let status = 'scheduled'
      let awayScore = null, homeScore = null
      let npbInning = null, npbInningHalf = null
      if (scoreMatch) {
        awayScore = parseInt(scoreMatch[1])
        homeScore = parseInt(scoreMatch[2])
        // 이닝 정보 파싱 (例: "5回表", "3回裏")
        const inningMatch = text.match(/(\d+)回([表裏])/)
        if (inningMatch) {
          npbInning = parseInt(inningMatch[1])
          npbInningHalf = inningMatch[2] === '表' ? 'Top' : 'Bottom'
        }
        // Check if it's final or in progress
        if (text.includes('回') && !text.includes('試合終了')) {
          status = 'live'
        } else if (dateStr < todayStr) {
          status = 'final'
        } else if (dateStr === todayStr && text.includes('回')) {
          status = 'live'
        }
      }

      const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(externalId)
      if (!existing) {
        insertGame.run(externalId, 'NPB', homeTeam, awayTeam, gameDate, '18:00',
          homeScore, awayScore, status)
        gameCount++
      } else if (status === 'final' || status === 'live') {
        db.prepare('UPDATE games SET status=?, home_score=?, away_score=?, current_inning=?, inning_half=? WHERE external_id=?')
          .run(status, homeScore, awayScore, npbInning, npbInningHalf, externalId)
      }
    })
    console.log(`  NPB 경기 ${gameCount}개 추가`)
  } catch (e) { console.error('  NPB 경기 오류:', e.message) }

  // 3. NPB 예측 생성
  generatePredictions('NPB')
  console.log('=== NPB 동기화 완료 ===\n')
}

// ── Generate Predictions for a League ───────────────────────
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

function seedUsers() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get()
  if (existing.c > 0) return
  const insertUser = db.prepare('INSERT INTO users (email, hashed_password, name, nickname, is_admin, subscription_status, plan, privacy_agreed) VALUES (?,?,?,?,?,?,?,?)')
  insertUser.run('admin@ballpredict.com', bcrypt.hashSync('admin123', 10), 'Admin', '운영자', 1, 'active', 'premium', 1)
  insertUser.run('0000', bcrypt.hashSync('0000', 10), 'PRO 테스트', 'PRO유저', 0, 'active', 'pro', 1)
  insertUser.run('demo01', bcrypt.hashSync('demo0000!', 10), '데모유저', '야구팬', 0, 'free', 'free', 1)
  console.log('사용자 계정 생성 완료')
}

// ── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ detail: 'Not authenticated' })
  try {
    const payload = jwt.verify(header.slice(7), SECRET)
    req.user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    if (!req.user) return res.status(401).json({ detail: 'User not found' })
    next()
  } catch { return res.status(401).json({ detail: 'Invalid token' }) }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) { req.user = null; return next() }
  try {
    const payload = jwt.verify(header.slice(7), SECRET)
    req.user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
  } catch { req.user = null }
  next()
}

function isPremium(user) {
  return user && (user.subscription_status === 'active' || user.is_admin)
}

// ── Auth Routes ─────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, nickname, phone, birthday, privacy_agreed } = req.body
  if (!email || !password || !nickname) return res.status(400).json({ detail: '아이디, 비밀번호, 닉네임을 입력하세요' })
  // 아이디 검증: 영문+숫자 6자 이상
  if (!/^[a-zA-Z0-9]{6,}$/.test(email)) return res.status(400).json({ detail: '아이디는 영문, 숫자 조합 6자 이상이어야 합니다' })
  // 비밀번호 검증: 영문+숫자+특수문자 8자 이상
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return res.status(400).json({ detail: '비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다' })
  // 닉네임 중복 검사
  if (db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname))
    return res.status(400).json({ detail: '이미 사용중인 닉네임입니다' })
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email))
    return res.status(400).json({ detail: '이미 등록된 아이디입니다' })
  if (!privacy_agreed) return res.status(400).json({ detail: '개인정보 수집에 동의해주세요' })

  const hashed = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (email, hashed_password, name, nickname, phone, birthday, privacy_agreed, plan) VALUES (?,?,?,?,?,?,?,?)').run(
    email, hashed, name || null, nickname, phone || null, birthday || null, privacy_agreed ? 1 : 0, 'free'
  )
  const token = jwt.sign({ sub: result.lastInsertRowid }, SECRET, { expiresIn: '24h' })
  res.status(201).json({ access_token: token, token_type: 'bearer' })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !bcrypt.compareSync(password, user.hashed_password))
    return res.status(401).json({ detail: '아이디 또는 비밀번호가 올바르지 않습니다' })
  const token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: '24h' })
  res.json({ access_token: token, token_type: 'bearer' })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user
  res.json({ id: u.id, email: u.email, name: u.name, nickname: u.nickname, phone: u.phone, birthday: u.birthday, subscription_status: u.subscription_status, plan: u.plan || 'free', is_admin: !!u.is_admin, created_at: u.created_at })
})

// 닉네임 중복 검사
app.get('/api/auth/check-nickname', (req, res) => {
  const { nickname } = req.query
  const exists = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname)
  res.json({ available: !exists })
})

// ── Support (고객센터) ───────────────────────────────────────
// 문의 작성
app.post('/api/support/tickets', authMiddleware, (req, res) => {
  const { category, title, content } = req.body
  if (!category || !title || !content) return res.status(400).json({ detail: '카테고리, 제목, 내용을 모두 입력하세요' })
  const result = db.prepare('INSERT INTO support_tickets (user_id, category, title, content) VALUES (?,?,?,?)').run(req.user.id, category, title, content)
  res.status(201).json({ id: result.lastInsertRowid })
})

// 내 문의 목록
app.get('/api/support/tickets', authMiddleware, (req, res) => {
  const tickets = db.prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(tickets)
})

// 문의 상세
app.get('/api/support/tickets/:id', authMiddleware, (req, res) => {
  const ticket = db.prepare('SELECT t.*, u.nickname, u.email FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ detail: '문의를 찾을 수 없습니다' })
  if (ticket.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ detail: '권한이 없습니다' })
  res.json(ticket)
})

// 관리자: 전체 문의 목록
app.get('/api/admin/support/tickets', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 전용' })
  const { status } = req.query
  let q = 'SELECT t.*, u.nickname, u.email FROM support_tickets t JOIN users u ON u.id = t.user_id'
  const params = []
  if (status) { q += ' WHERE t.status = ?'; params.push(status) }
  q += ' ORDER BY t.created_at DESC'
  res.json(db.prepare(q).all(...params))
})

// 관리자: 답변
app.put('/api/admin/support/tickets/:id/reply', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 전용' })
  const { reply } = req.body
  if (!reply) return res.status(400).json({ detail: '답변 내용을 입력하세요' })
  db.prepare('UPDATE support_tickets SET admin_reply = ?, admin_reply_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?').run(reply, 'replied', req.params.id)
  res.json({ ok: true })
})

// ── Announcements (공지사항) ────────────────────────────────
app.get('/api/announcements', (req, res) => {
  const posts = db.prepare('SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 20').all()
  res.json(posts)
})

app.post('/api/admin/announcements', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 전용' })
  const { title, content, category, is_pinned } = req.body
  if (!title || !content) return res.status(400).json({ detail: '제목과 내용을 입력하세요' })
  const result = db.prepare('INSERT INTO announcements (title, content, category, is_pinned) VALUES (?,?,?,?)').run(title, content, category || 'notice', is_pinned ? 1 : 0)
  res.status(201).json({ id: result.lastInsertRowid })
})

app.delete('/api/admin/announcements/:id', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 전용' })
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── 배트맨 데이터 프록시 ─────────────────────────────────────
app.get('/api/betman/games', async (req, res) => {
  try {
    const response = await fetch('https://www.betman.co.kr/gameinfo/inqItrstGameList.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ _sbmInfo: { debugMode: 'false' }, GM_ID: req.query.gm_id || 'G102', GM_TS: req.query.gm_ts || '' }),
    })
    const data = await response.json()
    const games = (data.dl_itrstGameList || []).map(g => ({
      home: (g.HOME_S_NM || g.HOME_NM || '').trim(),
      away: (g.AWAY_S_NM || g.AWAY_NM || '').trim(),
      date: g.MCH_DTM,
      round: g.GM_TS,
      gameId: g.GM_ID,
      seq: g.GM_SEQ,
      league: g.GM_LEAG_CD,
      stadium: (g.STDM_NM || '').trim(),
    }))
    // 최근 경기만 (향후 2주)
    res.json({ games: games.slice(0, 200), total: games.length })
  } catch (e) {
    res.json({ games: [], total: 0, error: e.message })
  }
})

// ── 배당 계산기 저장/불러오기 ────────────────────────────────
app.get('/api/bets/saved', authMiddleware, (req, res) => {
  const bets = db.prepare('SELECT * FROM saved_bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id)
  res.json(bets.map(b => ({ ...b, selections: JSON.parse(b.selections) })))
})

app.post('/api/bets/save', authMiddleware, (req, res) => {
  const { name, selections, total_odds, bet_amount, potential_win } = req.body
  if (!selections?.length) return res.status(400).json({ detail: '선택한 경기가 없습니다' })
  const result = db.prepare('INSERT INTO saved_bets (user_id, name, selections, total_odds, bet_amount, potential_win) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, name || `배팅 ${new Date().toLocaleDateString('ko-KR')}`, JSON.stringify(selections), total_odds || 0, bet_amount || 0, potential_win || 0)
  res.status(201).json({ id: result.lastInsertRowid })
})

app.delete('/api/bets/saved/:id', authMiddleware, (req, res) => {
  const bet = db.prepare('SELECT * FROM saved_bets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!bet) return res.status(404).json({ detail: '찾을 수 없습니다' })
  db.prepare('DELETE FROM saved_bets WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── 실시간 채팅 ─────────────────────────────────────────────
app.get('/api/games/:id/chat', (req, res) => {
  const after = req.query.after || 0
  const msgs = db.prepare(`
    SELECT c.id, c.message, c.created_at, u.nickname, u.plan
    FROM live_chats c JOIN users u ON u.id = c.user_id
    WHERE c.game_id = ? AND c.id > ?
    ORDER BY c.created_at DESC LIMIT 50
  `).all(req.params.id, parseInt(after))
  res.json(msgs.reverse())
})

app.post('/api/games/:id/chat', authMiddleware, (req, res) => {
  const { message } = req.body
  if (!message || message.trim().length === 0) return res.status(400).json({ detail: '메시지를 입력하세요' })
  if (message.length > 200) return res.status(400).json({ detail: '200자 이내로 입력하세요' })
  const result = db.prepare('INSERT INTO live_chats (game_id, user_id, message) VALUES (?,?,?)').run(req.params.id, req.user.id, message.trim())
  res.status(201).json({ id: result.lastInsertRowid })
})

// ── 문자 중계 (MLB Play-by-Play) ────────────────────────────
app.get('/api/games/:id/playbyplay', async (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id)
  if (!game) return res.status(404).json({ detail: '경기를 찾을 수 없습니다' })

  // MLB 경기만 지원
  if (!game.external_id?.startsWith('mlb_')) {
    return res.json({ plays: [], supported: false, message: '현재 MLB 경기만 문자중계를 지원합니다' })
  }

  const gamePk = game.external_id.replace('mlb_', '')
  try {
    const data = await fetchJSON(`${MLB_API}/v1.1/game/${gamePk}/feed/live`)
    if (!data?.liveData?.plays) return res.json({ plays: [], supported: true })

    const allPlays = data.liveData.plays.allPlays || []
    const currentPlay = data.liveData.plays.currentPlay || null

    // 최근 20개 플레이 (역순 = 최신부터)
    const plays = allPlays.slice(-20).reverse().map(p => ({
      inning: p.about?.inning,
      halfInning: p.about?.halfInning === 'top' ? '초' : '말',
      isComplete: p.about?.isComplete,
      batter: p.matchup?.batter?.fullName,
      batterId: p.matchup?.batter?.id,
      pitcher: p.matchup?.pitcher?.fullName,
      pitcherId: p.matchup?.pitcher?.id,
      result: p.result?.description,
      resultType: p.result?.type, // atBat, strikeout, etc
      rbi: p.result?.rbi || 0,
      awayScore: p.result?.awayScore,
      homeScore: p.result?.homeScore,
      count: { balls: p.count?.balls, strikes: p.count?.strikes, outs: p.count?.outs },
      events: (p.playEvents || []).map(e => ({
        type: e.type, // pitch, action, etc
        description: e.details?.description,
        code: e.details?.code, // B, S, X, F, etc
        pitchType: e.pitchData?.type?.description, // 4-Seam Fastball, etc
        speed: e.pitchData?.startSpeed, // mph
        count: e.count,
        isStrike: e.details?.isStrike,
        isBall: e.details?.isBall,
        isInPlay: e.details?.isInPlay,
      })),
    }))

    // 현재 타석 정보
    const current = currentPlay ? {
      inning: currentPlay.about?.inning,
      halfInning: currentPlay.about?.halfInning === 'top' ? '초' : '말',
      batter: currentPlay.matchup?.batter?.fullName,
      pitcher: currentPlay.matchup?.pitcher?.fullName,
      count: currentPlay.count,
      events: (currentPlay.playEvents || []).map(e => ({
        type: e.type,
        description: e.details?.description,
        code: e.details?.code,
        pitchType: e.pitchData?.type?.description,
        speed: e.pitchData?.startSpeed,
        count: e.count,
        isStrike: e.details?.isStrike,
        isBall: e.details?.isBall,
      })),
    } : null

    res.json({ plays, current, supported: true, totalPlays: allPlays.length })
  } catch (e) {
    res.json({ plays: [], supported: true, error: e.message })
  }
})

// ── 경기 검색 (커뮤니티 베팅기록용) ─────────────────────────
app.get('/api/games/search', (req, res) => {
  const { q, date } = req.query
  const targetDate = date || new Date().toISOString().split('T')[0]
  let games
  if (q) {
    games = db.prepare(`SELECT id, sport, league, home_team, away_team, game_date, game_time, status, home_score, away_score
      FROM games WHERE (home_team LIKE ? OR away_team LIKE ? OR league LIKE ?) AND game_date >= date(?, '-7 days')
      ORDER BY game_date DESC, game_time ASC LIMIT 30`).all(`%${q}%`, `%${q}%`, `%${q}%`, targetDate)
  } else {
    games = db.prepare(`SELECT id, sport, league, home_team, away_team, game_date, game_time, status, home_score, away_score
      FROM games WHERE game_date BETWEEN date(?, '-1 days') AND date(?, '+1 days')
      ORDER BY game_date DESC, game_time ASC LIMIT 50`).all(targetDate, targetDate)
  }
  res.json(games)
})

// ── Community Routes ────────────────────────────────────────
// 글 목록
app.get('/api/community/posts', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = 20
  const offset = (page - 1) * limit
  const total = db.prepare('SELECT COUNT(*) as c FROM posts').get().c
  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.plan FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset)

  const postsWithComments = posts.map(p => ({
    ...p,
    comment_count: db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id = ?').get(p.id).c,
  }))
  res.json({ posts: postsWithComments, total, page, pages: Math.ceil(total / limit) })
})

// 글 상세
app.get('/api/community/posts/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.nickname, u.plan FROM posts p
    JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(req.params.id)
  if (!post) return res.status(404).json({ detail: '글을 찾을 수 없습니다' })

  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.plan FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id)

  res.json({ post, comments })
})

// 글 작성
app.post('/api/community/posts', authMiddleware, (req, res) => {
  const { title, content, game_league, game_teams, bet_odds, bet_amount, bet_profit, bet_result } = req.body
  if (!title || !content) return res.status(400).json({ detail: '제목과 내용을 입력하세요' })
  const result = db.prepare(
    'INSERT INTO posts (user_id, title, content, game_league, game_teams, bet_odds, bet_amount, bet_profit, bet_result) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(req.user.id, title, content, game_league || null, game_teams || null, bet_odds || null, bet_amount || null, bet_profit || null, bet_result || null)
  res.status(201).json({ id: result.lastInsertRowid })
})

// 글 삭제 (본인 또는 관리자)
app.delete('/api/community/posts/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ detail: '글을 찾을 수 없습니다' })
  if (post.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ detail: '권한이 없습니다' })
  db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id)
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// 댓글 작성
app.post('/api/community/posts/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body
  if (!content) return res.status(400).json({ detail: '댓글 내용을 입력하세요' })
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ detail: '글을 찾을 수 없습니다' })
  const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)').run(req.params.id, req.user.id, content)
  res.status(201).json({ id: result.lastInsertRowid })
})

// 댓글 수정
app.put('/api/community/comments/:id', authMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
  if (!comment) return res.status(404).json({ detail: '댓글을 찾을 수 없습니다' })
  if (comment.user_id !== req.user.id) return res.status(403).json({ detail: '권한이 없습니다' })
  db.prepare('UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.body.content, req.params.id)
  res.json({ ok: true })
})

// 댓글 삭제
app.delete('/api/community/comments/:id', authMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
  if (!comment) return res.status(404).json({ detail: '댓글을 찾을 수 없습니다' })
  if (comment.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ detail: '권한이 없습니다' })
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Notification Routes ─────────────────────────────────────
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id)
  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c
  res.json({ notifications: notifs, unread })
})

app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id)
  res.json({ ok: true })
})

// ── Admin Stats ─────────────────────────────────────────────
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 전용' })
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c
  const proUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE plan = 'pro'").get().c
  const premiumUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE plan = 'premium'").get().c
  const todayUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").get().c
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM posts').get().c
  const totalComments = db.prepare('SELECT COUNT(*) as c FROM comments').get().c
  const totalGames = db.prepare('SELECT COUNT(*) as c FROM games').get().c
  const totalPredictions = db.prepare('SELECT COUNT(*) as c FROM predictions').get().c
  const accuracy = db.prepare(`
    SELECT COUNT(CASE WHEN (p.recommended_pick='home' AND g.home_score>g.away_score) OR (p.recommended_pick='away' AND g.away_score>g.home_score) THEN 1 END) as correct,
    COUNT(*) as total
    FROM predictions p JOIN games g ON g.id=p.game_id WHERE g.status='final' AND g.home_score IS NOT NULL
  `).get()
  const recentUsers = db.prepare('SELECT id, email, nickname, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10').all()
  const planBreakdown = db.prepare("SELECT plan, COUNT(*) as count FROM users GROUP BY plan").all()

  res.json({
    totalUsers, proUsers, premiumUsers, todayUsers,
    totalPosts, totalComments, totalGames, totalPredictions,
    accuracy: { correct: accuracy.correct, total: accuracy.total, rate: accuracy.total > 0 ? Math.round(accuracy.correct / accuracy.total * 1000) / 10 : 0 },
    recentUsers, planBreakdown,
    mrr: proUsers * 29900 + premiumUsers * 59900,
  })
})

// ── Games Routes ────────────────────────────────────────────
app.get('/api/games', optionalAuth, (req, res) => {
  const { league, game_date, min_confidence, sport, page = 1, per_page = 25 } = req.query
  let where = [], params = []
  if (league) { where.push('g.league = ?'); params.push(league) }
  if (game_date) { where.push('g.game_date = ?'); params.push(game_date) }
  if (min_confidence) { where.push('p.confidence_score >= ?'); params.push(parseInt(min_confidence)) }
  if (sport) { where.push('g.sport = ?'); params.push(sport) }
  // 날짜 필터 없으면 오늘부터 보여주기
  if (!game_date) { const today = new Date().toISOString().split('T')[0]; where.push('g.game_date >= ?'); params.push(today) }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const offset = (parseInt(page) - 1) * parseInt(per_page)

  const total = db.prepare(`SELECT COUNT(*) as c FROM games g LEFT JOIN predictions p ON p.game_id = g.id ${whereClause}`).get(...params).c
  const games = db.prepare(`
    SELECT g.*, p.id as pred_id, p.home_win_probability, p.away_win_probability,
      p.recommended_pick, p.confidence_score, p.team_form_score, p.pitcher_score,
      p.home_advantage_score, p.elo_diff_score, p.h2h_score, p.bullpen_score, p.recent_form_score
    FROM games g LEFT JOIN predictions p ON p.game_id = g.id
    ${whereClause} ORDER BY g.game_date ASC, g.game_time ASC, g.id LIMIT ? OFFSET ?
  `).all(...params, parseInt(per_page), offset)

  // 선발투수 상세 스탯 가져오기
  const getPitcherStats = db.prepare('SELECT * FROM pitchers WHERE name = ?')

  const premium = isPremium(req.user)
  const result = games.map((g, i) => {
    const hpStats = g.home_pitcher ? getPitcherStats.get(g.home_pitcher) : null
    const apStats = g.away_pitcher ? getPitcherStats.get(g.away_pitcher) : null
    return {
      id: g.id, sport: g.sport, league: g.league, home_team: g.home_team, away_team: g.away_team,
      home_team_kr: TEAM_NAME_KR[g.home_team] || null,
      away_team_kr: TEAM_NAME_KR[g.away_team] || null,
      home_logo: g.home_logo, away_logo: g.away_logo,
      game_date: g.game_date, game_time: g.game_time, status: g.status,
      home_score: g.home_score, away_score: g.away_score,
      home_odds: g.home_odds, away_odds: g.away_odds,
      home_pitcher: g.home_pitcher, away_pitcher: g.away_pitcher,
      home_pitcher_stats: hpStats ? { era: hpStats.era, whip: hpStats.whip, wins: hpStats.wins, losses: hpStats.losses, ip: hpStats.innings_pitched, k: hpStats.strikeouts } : null,
      away_pitcher_stats: apStats ? { era: apStats.era, whip: apStats.whip, wins: apStats.wins, losses: apStats.losses, ip: apStats.innings_pitched, k: apStats.strikeouts } : null,
      prediction: g.pred_id ? {
        id: g.pred_id,
        home_win_probability: (!premium && i >= 1) ? 0 : g.home_win_probability,
        away_win_probability: (!premium && i >= 1) ? 0 : g.away_win_probability,
        recommended_pick: (!premium && i >= 1) ? 'locked' : g.recommended_pick,
        confidence_score: (!premium && i >= 1) ? 0 : g.confidence_score,
        team_form_score: g.team_form_score, pitcher_score: g.pitcher_score,
        home_advantage_score: g.home_advantage_score, elo_diff_score: g.elo_diff_score, h2h_score: g.h2h_score,
        bullpen_score: g.bullpen_score, recent_form_score: g.recent_form_score,
      } : null,
    }
  })

  res.json({ games: result, total, page: parseInt(page), per_page: parseInt(per_page) })
})

app.get('/api/games/:id', optionalAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id)
  if (!g) return res.status(404).json({ detail: '경기를 찾을 수 없습니다' })

  const pred = db.prepare('SELECT * FROM predictions WHERE game_id = ?').get(g.id)
  const homeStats = db.prepare('SELECT * FROM team_stats WHERE team_name = ?').get(g.home_team)
  const awayStats = db.prepare('SELECT * FROM team_stats WHERE team_name = ?').get(g.away_team)
  const homePitcher = g.home_pitcher ? db.prepare('SELECT * FROM pitchers WHERE name = ?').get(g.home_pitcher) : null
  const awayPitcher = g.away_pitcher ? db.prepare('SELECT * FROM pitchers WHERE name = ?').get(g.away_pitcher) : null
  const premium = isPremium(req.user)

  res.json({
    game: {
      id: g.id, league: g.league, home_team: g.home_team, away_team: g.away_team,
      home_team_kr: TEAM_NAME_KR[g.home_team] || null,
      away_team_kr: TEAM_NAME_KR[g.away_team] || null,
      game_date: g.game_date, game_time: g.game_time, status: g.status,
      home_score: g.home_score, away_score: g.away_score,
      home_odds: g.home_odds, away_odds: g.away_odds,
      home_pitcher: g.home_pitcher, away_pitcher: g.away_pitcher,
      home_win_probability: premium && pred ? pred.home_win_probability : null,
      away_win_probability: premium && pred ? pred.away_win_probability : null,
      recommended_pick: premium && pred ? pred.recommended_pick : null,
      confidence_score: premium && pred ? pred.confidence_score : null,
    },
    home_team_stats: homeStats || null,
    away_team_stats: awayStats || null,
    home_pitcher_stats: homePitcher || null,
    away_pitcher_stats: awayPitcher || null,
    is_premium: premium,
  })
})

// ── Stats Routes ────────────────────────────────────────────
app.get('/api/stats/teams', (req, res) => {
  const { league } = req.query
  let query = 'SELECT * FROM team_stats'; const params = []
  if (league) { query += ' WHERE league = ?'; params.push(league) }
  query += ' ORDER BY elo_rating DESC'
  const teams = db.prepare(query).all(...params)
  res.json(teams.map(t => ({ ...t, team_name_kr: TEAM_NAME_KR[t.team_name] || null })))
})

app.get('/api/stats/pitchers', (req, res) => {
  const { league, team } = req.query
  let where = [], params = []
  if (league) { where.push('league = ?'); params.push(league) }
  if (team) { where.push('team = ?'); params.push(team) }
  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : ''
  res.json(db.prepare(`SELECT * FROM pitchers${whereClause} ORDER BY era ASC`).all(...params))
})

// ── Subscription Routes ─────────────────────────────────────
app.get('/api/subscription/status', authMiddleware, (req, res) => {
  res.json({ subscription_status: req.user.subscription_status, is_premium: isPremium(req.user) })
})
app.post('/api/subscription/create-checkout', authMiddleware, (req, res) => {
  db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('active', req.user.id)
  res.json({ checkout_url: '/subscription?success=true', demo: true })
})
app.post('/api/subscription/cancel', authMiddleware, (req, res) => {
  db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('free', req.user.id)
  res.json({ status: '구독이 취소되었습니다' })
})

// ── Admin Routes ────────────────────────────────────────────
app.get('/api/admin/dashboard', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 권한이 필요합니다' })
  res.json({
    total_users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    active_subscriptions: db.prepare("SELECT COUNT(*) as c FROM users WHERE subscription_status = 'active'").get().c,
    total_games: db.prepare('SELECT COUNT(*) as c FROM games').get().c,
    total_predictions: db.prepare('SELECT COUNT(*) as c FROM predictions').get().c,
  })
})
app.get('/api/admin/users', authMiddleware, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 권한이 필요합니다' })
  const users = db.prepare('SELECT id, email, name, subscription_status, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 100').all()
  res.json(users.map(u => ({ ...u, is_admin: !!u.is_admin })))
})

// ── Data Refresh Endpoint ───────────────────────────────────
app.post('/api/admin/refresh-mlb', authMiddleware, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ detail: '관리자 권한이 필요합니다' })
  await syncKBOData()
  await syncNPBData()
  await syncMLBData()
  res.json({ status: '전체 데이터 갱신 완료 (KBO/NPB/MLB)' })
})

// ── Dashboard Routes ────────────────────────────────────────
app.get('/api/dashboard/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0]

  const todayGames = db.prepare('SELECT COUNT(*) as c FROM games WHERE game_date = ?').get(today).c
  const totalPredictions = db.prepare('SELECT COUNT(*) as c FROM predictions').get().c

  // League counts today
  const leagueCounts = db.prepare('SELECT league, COUNT(*) as c FROM games WHERE game_date = ? GROUP BY league').all(today)
  const leagueToday = {}
  for (const row of leagueCounts) leagueToday[row.league] = row.c

  // Accuracy calculation
  const finished = db.prepare(`
    SELECT g.*, p.recommended_pick, p.confidence_score
    FROM games g JOIN predictions p ON p.game_id = g.id
    WHERE g.status = 'final' AND g.home_score IS NOT NULL AND g.away_score IS NOT NULL AND g.home_score != g.away_score
  `).all()

  let totalFinished = 0, correct = 0, highConfTotal = 0, highConfCorrect = 0
  const correctByLeague = { MLB: [0, 0], NPB: [0, 0], KBO: [0, 0] }

  for (const g of finished) {
    totalFinished++
    const actual = g.home_score > g.away_score ? 'home' : 'away'
    const isCorrect = g.recommended_pick === actual
    if (correctByLeague[g.league]) {
      correctByLeague[g.league][1]++
      if (isCorrect) correctByLeague[g.league][0]++
    }
    if (isCorrect) correct++
    if (g.confidence_score >= 70) {
      highConfTotal++
      if (isCorrect) highConfCorrect++
    }
  }

  const accuracy = totalFinished > 0 ? Math.round(correct / totalFinished * 1000) / 10 : 0
  const highConfAcc = highConfTotal > 0 ? Math.round(highConfCorrect / highConfTotal * 1000) / 10 : 0

  const leagueAccuracy = {}
  for (const [league, [c, t]] of Object.entries(correctByLeague)) {
    leagueAccuracy[league] = { correct: c, total: t, accuracy: t > 0 ? Math.round(c / t * 1000) / 10 : 0 }
  }

  res.json({
    today_games: todayGames, total_predictions: totalPredictions,
    total_finished: totalFinished, overall_accuracy: accuracy,
    correct_predictions: correct, high_confidence_accuracy: highConfAcc,
    high_confidence_total: highConfTotal, league_today: leagueToday,
    league_accuracy: leagueAccuracy,
  })
})

app.get('/api/dashboard/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const { league, sort, sport } = req.query
  let where = 'WHERE g.game_date = ?', params = [today]
  if (league) { where += ' AND g.league = ?'; params.push(league) }
  if (sport) { where += ' AND g.sport = ?'; params.push(sport) }

  const ORDER_MAP = {
    time: 'g.game_time ASC, g.id',
    confidence: 'p.confidence_score DESC, g.game_time ASC',
    league: 'g.league ASC, g.game_time ASC',
    pick: "CASE p.recommended_pick WHEN 'home' THEN 0 ELSE 1 END, p.confidence_score DESC",
  }
  const orderBy = ORDER_MAP[sort] || ORDER_MAP.time

  const games = db.prepare(`
    SELECT g.*, p.home_win_probability, p.away_win_probability,
      p.recommended_pick, p.confidence_score
    FROM games g LEFT JOIN predictions p ON p.game_id = g.id
    ${where} ORDER BY ${orderBy}
  `).all(...params)

  res.json(games.map(g => ({
    id: g.id, sport: g.sport, league: g.league,
    home_team: g.home_team, away_team: g.away_team,
    home_logo: g.home_logo, away_logo: g.away_logo,
    game_time: g.game_time, game_date: g.game_date, status: g.status,
    home_score: g.home_score, away_score: g.away_score,
    home_odds: g.home_odds, away_odds: g.away_odds,
    home_pitcher: g.home_pitcher, away_pitcher: g.away_pitcher,
    period: g.period, clock: g.clock,
    live_data: g.live_data ? JSON.parse(g.live_data) : null,
    prediction: g.home_win_probability != null ? {
      home_win_probability: g.home_win_probability,
      away_win_probability: g.away_win_probability,
      recommended_pick: g.recommended_pick,
      confidence_score: g.confidence_score,
    } : null,
  })))
})

app.get('/api/dashboard/top-picks', (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const games = db.prepare(`
    SELECT g.*, p.home_win_probability, p.away_win_probability,
      p.recommended_pick, p.confidence_score
    FROM games g JOIN predictions p ON p.game_id = g.id
    WHERE g.game_date IN (?, ?) AND p.confidence_score >= 60
    ORDER BY p.confidence_score DESC LIMIT 10
  `).all(today, tomorrow)

  res.json(games.map(g => ({
    id: g.id, league: g.league,
    home_team: g.home_team, away_team: g.away_team,
    game_date: g.game_date, game_time: g.game_time, status: g.status,
    prediction: {
      home_win_probability: g.home_win_probability,
      away_win_probability: g.away_win_probability,
      recommended_pick: g.recommended_pick,
      confidence_score: g.confidence_score,
    },
  })))
})

app.get('/api/dashboard/recent-results', (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))

  const games = db.prepare(`
    SELECT g.*, p.recommended_pick, p.confidence_score
    FROM games g JOIN predictions p ON p.game_id = g.id
    WHERE g.status = 'final' AND g.home_score IS NOT NULL
    ORDER BY g.game_date DESC, g.id DESC LIMIT ?
  `).all(limit)

  res.json(games.filter(g => g.home_score !== g.away_score).map(g => {
    const actual = g.home_score > g.away_score ? 'home' : 'away'
    return {
      id: g.id, league: g.league,
      home_team: g.home_team, away_team: g.away_team,
      game_date: g.game_date,
      home_score: g.home_score, away_score: g.away_score,
      predicted_pick: g.recommended_pick,
      confidence_score: g.confidence_score,
      actual_winner: actual,
      is_correct: g.recommended_pick === actual,
    }
  }))
})

app.get('/api/dashboard/league-standings', (req, res) => {
  const { league } = req.query
  if (!league || !['MLB', 'NPB', 'KBO'].includes(league))
    return res.status(400).json({ detail: 'league must be MLB, NPB, or KBO' })

  const teams = db.prepare('SELECT * FROM team_stats WHERE league = ? ORDER BY league_rank ASC').all(league)
  res.json(teams.map(t => ({
    team_name: t.team_name, league: t.league, rank: t.league_rank,
    wins: t.wins, losses: t.losses, games_played: t.games_played,
    win_rate: t.games_played > 0 ? Math.round(t.wins / t.games_played * 1000) / 1000 : 0,
    elo_rating: t.elo_rating,
    avg_runs_scored: t.avg_runs_scored, avg_runs_allowed: t.avg_runs_allowed,
    run_differential: t.run_differential, streak: t.streak,
  })))
})

// ── Live In-Game Prediction API ─────────────────────────────
app.post('/api/games/:id/live-predict', optionalAuth, (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id)
  if (!game) return res.status(404).json({ detail: '경기를 찾을 수 없습니다' })

  const { inning = 1, isTop = true, outs = 0,
    runner1b = false, runner2b = false, runner3b = false,
    homeScore = 0, awayScore = 0,
    pitcherEra, pitcherPitchCount, pitcherInnings,
    homeBullpenEra, awayBullpenEra } = req.body

  // 경기전 승률 가져오기
  const pred = db.prepare('SELECT home_win_probability FROM predictions WHERE game_id = ?').get(game.id)
  const homeWinPctPregame = pred ? pred.home_win_probability / 100 : 0.5

  const result = predictLiveGame({
    inning, isTop, outs,
    runner1b, runner2b, runner3b,
    homeScore, awayScore,
    pitcherEra: pitcherEra ?? 4.5,
    pitcherPitchCount: pitcherPitchCount ?? 0,
    pitcherInnings: pitcherInnings ?? 0,
    homeBullpenEra: homeBullpenEra ?? 4.5,
    awayBullpenEra: awayBullpenEra ?? 4.5,
    homeWinPctPregame,
  })

  res.json({
    game_id: game.id,
    home_team: game.home_team,
    away_team: game.away_team,
    home_team_kr: TEAM_NAME_KR[game.home_team] || null,
    away_team_kr: TEAM_NAME_KR[game.away_team] || null,
    ...result,
  })
})

// 독립 실시간 예측 (경기 ID 없이)
app.post('/api/live-predict', (req, res) => {
  const { inning = 1, isTop = true, outs = 0,
    runner1b = false, runner2b = false, runner3b = false,
    homeScore = 0, awayScore = 0,
    pitcherEra, pitcherPitchCount, pitcherInnings,
    homeBullpenEra, awayBullpenEra, homeWinPctPregame } = req.body

  const result = predictLiveGame({
    inning, isTop, outs,
    runner1b, runner2b, runner3b,
    homeScore, awayScore,
    pitcherEra: pitcherEra ?? 4.5,
    pitcherPitchCount: pitcherPitchCount ?? 0,
    pitcherInnings: pitcherInnings ?? 0,
    homeBullpenEra: homeBullpenEra ?? 4.5,
    awayBullpenEra: awayBullpenEra ?? 4.5,
    homeWinPctPregame: homeWinPctPregame ?? 0.5,
  })

  res.json(result)
})

// ── Live Games (실시간 경기) ─────────────────────────────────
app.get('/api/dashboard/live', (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const games = db.prepare(`
    SELECT g.*, p.home_win_probability, p.away_win_probability,
      p.recommended_pick, p.confidence_score
    FROM games g LEFT JOIN predictions p ON p.game_id = g.id
    WHERE g.game_date = ? AND g.status = 'live'
    ORDER BY g.league ASC, g.game_time ASC
  `).all(today)

  res.json(games.map(g => ({
    id: g.id, sport: g.sport, league: g.league,
    home_team: g.home_team, away_team: g.away_team,
    home_logo: g.home_logo, away_logo: g.away_logo,
    game_time: g.game_time, game_date: g.game_date, status: g.status,
    home_score: g.home_score, away_score: g.away_score,
    current_inning: g.current_inning,
    inning_half: g.inning_half,
    outs: g.outs,
    period: g.period, clock: g.clock,
    live_data: g.live_data ? JSON.parse(g.live_data) : null,
    home_pitcher: g.home_pitcher, away_pitcher: g.away_pitcher,
    prediction: g.home_win_probability != null ? {
      home_win_probability: g.home_win_probability,
      away_win_probability: g.away_win_probability,
      recommended_pick: g.recommended_pick,
      confidence_score: g.confidence_score,
    } : null,
  })))
})

// ── Live Score Quick Sync (라이브 스코어 빠른 동기화) ─────────
async function syncLiveScores() {
  const today = new Date().toISOString().split('T')[0]
  const liveGames = db.prepare("SELECT external_id FROM games WHERE status = 'live' AND game_date = ?").all(today)
  if (liveGames.length === 0) return

  try {
    const url = `${MLB_API}/schedule?sportId=1&date=${today}&hydrate=linescore,team`
    const data = await fetchJSON(url)
    if (!data?.dates?.[0]?.games) return

    const updateLive = db.prepare('UPDATE games SET home_score=?, away_score=?, status=?, current_inning=?, inning_half=?, outs=?, live_data=? WHERE external_id=?')

    for (const g of data.dates[0].games) {
      const status = g.status.abstractGameState
      if (status === 'Preview') continue

      const ls = g.linescore || {}

      // 상세 라이브 데이터 구성
      const liveData = {
        balls: ls.balls ?? 0,
        strikes: ls.strikes ?? 0,
        outs: ls.outs ?? 0,
        currentInning: ls.currentInning || null,
        inningHalf: ls.inningHalf || null,
        // 주자 상황
        runners: {
          first: !!(ls.offense?.first),
          second: !!(ls.offense?.second),
          third: !!(ls.offense?.third),
        },
        // 이닝별 스코어
        innings: (ls.innings || []).map(inn => ({
          num: inn.num,
          away: inn.away?.runs ?? null,
          home: inn.home?.runs ?? null,
        })),
        // 팀별 요약
        totals: {
          away: { runs: g.teams.away.score ?? 0, hits: ls.teams?.away?.hits ?? 0, errors: ls.teams?.away?.errors ?? 0 },
          home: { runs: g.teams.home.score ?? 0, hits: ls.teams?.home?.hits ?? 0, errors: ls.teams?.home?.errors ?? 0 },
        },
      }

      updateLive.run(
        g.teams.home.score ?? null,
        g.teams.away.score ?? null,
        status === 'Final' ? 'final' : 'live',
        ls.currentInning || null,
        ls.inningHalf || null,
        ls.outs || null,
        JSON.stringify(liveData),
        `mlb_${g.gamePk}`
      )
    }
  } catch (e) {
    // 라이브 스코어 동기화 실패 시 무시
  }
}

// ── KBO 팀명 정리 (기존 DB에 투수 정보 포함된 팀명 수정) ─────
function cleanKBOTeamNames() {
  const KBO_TEAMS = [
    'Samsung Lions', 'Kia Tigers', 'LG Twins', 'Doosan Bears',
    'KT Wiz', 'SSG Landers', 'NC Dinos', 'Lotte Giants',
    'Hanwha Eagles', 'Kiwoom Heroes'
  ]
  const dirty = db.prepare("SELECT id, home_team, away_team FROM games WHERE league = 'KBO'").all()
  let fixed = 0
  for (const g of dirty) {
    let newHome = g.home_team, newAway = g.away_team
    for (const t of KBO_TEAMS) {
      if (g.home_team.includes(t) && g.home_team !== t) newHome = t
      if (g.away_team.includes(t) && g.away_team !== t) newAway = t
    }
    if (newHome !== g.home_team || newAway !== g.away_team) {
      db.prepare('UPDATE games SET home_team = ?, away_team = ? WHERE id = ?').run(newHome, newAway, g.id)
      fixed++
    }
  }
  if (fixed > 0) console.log(`[cleanup] KBO 팀명 ${fixed}개 수정됨`)
}

// ── 프론트엔드 정적 파일 서빙 ────────────────────────────────
const clientBuildPath = join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(clientBuildPath))

// ── Health ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  version: '3.0.0',
  env: NODE_ENV,
  uptime: Math.floor(process.uptime()),
}))

// ── 주기적 데이터 동기화 ────────────────────────────────────
const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MS
  ? parseInt(process.env.SYNC_INTERVAL_MS)
  : 30 * 60 * 1000 // 기본 30분

let syncTimer = null

// ── ESPN 멀티스포츠 동기화 ──────────────────────────────────
const ESPN_LEAGUES = [
  // 축구
  { sport: 'soccer', espn: 'eng.1', league: 'EPL', name: '프리미어리그' },
  { sport: 'soccer', espn: 'esp.1', league: 'LALIGA', name: '라리가' },
  { sport: 'soccer', espn: 'ger.1', league: 'BUNDESLIGA', name: '분데스리가' },
  { sport: 'soccer', espn: 'ita.1', league: 'SERIE_A', name: '세리에A' },
  { sport: 'soccer', espn: 'fra.1', league: 'LIGUE1', name: '리그1' },
  { sport: 'soccer', espn: 'uefa.champions', league: 'UCL', name: '챔피언스리그' },
  { sport: 'soccer', espn: 'jpn.1', league: 'J_LEAGUE', name: 'J리그' },
  { sport: 'soccer', espn: 'usa.1', league: 'MLS', name: 'MLS' },
  { sport: 'soccer', espn: 'uefa.europa', league: 'UEL', name: '유로파리그' },
  { sport: 'soccer', espn: 'afc.champions', league: 'ACL', name: 'AFC챔스' },
  // 농구
  { sport: 'basketball', espn: 'nba', league: 'NBA', name: 'NBA', espnSport: 'basketball' },
  // 아이스하키
  { sport: 'hockey', espn: 'nhl', league: 'NHL', name: 'NHL', espnSport: 'hockey' },
]

async function syncESPNSports() {
  const insertGame = db.prepare(`INSERT OR IGNORE INTO games
    (external_id, sport, league, home_team, away_team, home_logo, away_logo, game_date, game_time, home_score, away_score, status, period, clock, live_data)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  const updateGame = db.prepare(`UPDATE games SET
    home_score=?, away_score=?, status=?, period=?, clock=?, live_data=?, home_logo=?, away_logo=?
    WHERE external_id=?`)

  for (const lg of ESPN_LEAGUES) {
    try {
      const espnSport = lg.espnSport || 'soccer'
      const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/${lg.espn}/scoreboard`
      const data = await fetchJSON(url)
      if (!data?.events) continue

      let count = 0
      for (const ev of data.events) {
        const comp = ev.competitions?.[0]
        if (!comp) continue

        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home')
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away')
        if (!homeTeam || !awayTeam) continue

        const externalId = `espn_${lg.league}_${ev.id}`
        const gameDate = ev.date ? new Date(ev.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        const gameTime = ev.date ? new Date(ev.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }) : null

        const statusType = ev.status?.type?.name
        let status = 'scheduled'
        if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FULL_TIME') status = 'final'
        else if (['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF', 'STATUS_END_PERIOD'].includes(statusType)) status = 'live'
        else if (['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_SUSPENDED', 'STATUS_DELAYED'].includes(statusType)) status = 'cancelled'

        const homeScore = parseInt(homeTeam.score) || null
        const awayScore = parseInt(awayTeam.score) || null
        const homeName = homeTeam.team?.displayName || homeTeam.team?.name || ''
        const awayName = awayTeam.team?.displayName || awayTeam.team?.name || ''
        const homeLogo = homeTeam.team?.logo || null
        const awayLogo = awayTeam.team?.logo || null

        // 라이브 데이터
        const period = ev.status?.period ? `${ev.status.period}` : null
        const clock = ev.status?.displayClock || null
        const liveData = {
          statusDetail: ev.status?.type?.shortDetail || '',
          period: ev.status?.period,
          clock: ev.status?.displayClock,
          homeSets: homeTeam.linescores?.map(l => l.value) || [],
          awaySets: awayTeam.linescores?.map(l => l.value) || [],
          homeRecord: homeTeam.records?.[0]?.summary || '',
          awayRecord: awayTeam.records?.[0]?.summary || '',
        }

        const existing = db.prepare('SELECT id FROM games WHERE external_id = ?').get(externalId)
        if (existing) {
          updateGame.run(homeScore, awayScore, status, period, clock, JSON.stringify(liveData), homeLogo, awayLogo, externalId)
        } else {
          insertGame.run(externalId, lg.sport, lg.league, homeName, awayName, homeLogo, awayLogo, gameDate, gameTime, homeScore, awayScore, status, period, clock, JSON.stringify(liveData))
          count++
        }
      }
      if (count > 0) console.log(`  [ESPN] ${lg.name} (${lg.league}): ${count}경기 추가`)
    } catch (e) {
      console.error(`  [ESPN] ${lg.league} 오류:`, e.message)
    }
  }
}

// ESPN 라이브 스코어 빠른 동기화
async function syncESPNLive() {
  const liveLeagues = db.prepare("SELECT DISTINCT league, sport FROM games WHERE status = 'live' AND sport != 'baseball'").all()
  if (liveLeagues.length === 0) return

  for (const { league, sport } of liveLeagues) {
    const lgConfig = ESPN_LEAGUES.find(l => l.league === league)
    if (!lgConfig) continue
    try {
      const espnSport = lgConfig.espnSport || 'soccer'
      const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/${lgConfig.espn}/scoreboard`
      const data = await fetchJSON(url)
      if (!data?.events) continue

      for (const ev of data.events) {
        const comp = ev.competitions?.[0]
        if (!comp) continue
        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home')
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away')
        if (!homeTeam || !awayTeam) continue

        const statusType = ev.status?.type?.name
        let status = 'scheduled'
        if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FULL_TIME') status = 'final'
        else if (['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF'].includes(statusType)) status = 'live'

        const liveData = {
          statusDetail: ev.status?.type?.shortDetail || '',
          period: ev.status?.period,
          clock: ev.status?.displayClock,
          homeSets: homeTeam.linescores?.map(l => l.value) || [],
          awaySets: awayTeam.linescores?.map(l => l.value) || [],
        }

        db.prepare('UPDATE games SET home_score=?, away_score=?, status=?, period=?, clock=?, live_data=? WHERE external_id=?')
          .run(parseInt(homeTeam.score) || null, parseInt(awayTeam.score) || null, status, ev.status?.period?.toString() || null, ev.status?.displayClock || null, JSON.stringify(liveData), `espn_${league}_${ev.id}`)
      }
    } catch {}
  }
}

async function syncAllData() {
  const start = Date.now()
  console.log(`[sync] 데이터 동기화 시작 (${new Date().toISOString()})`)
  try {
    await syncKBOData()
    await syncNPBData()
    await syncMLBData()
    await syncESPNSports()
    console.log(`[sync] 완료 (${Date.now() - start}ms)`)
  } catch (err) {
    console.error('[sync] 동기화 실패:', err.message)
  }
}

// ── Graceful Shutdown ───────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] 서버 종료 시작...`)
  if (syncTimer) clearInterval(syncTimer)
  server.close(() => {
    db.close()
    console.log('[shutdown] 정상 종료 완료')
    process.exit(0)
  })
  // 10초 뒤 강제 종료
  setTimeout(() => {
    console.error('[shutdown] 강제 종료')
    process.exit(1)
  }, 10000)
}

// ── Start ───────────────────────────────────────────────────
let server

async function start() {
  seedUsers()
  cleanKBOTeamNames()

  // 초기 데이터 동기화
  await syncAllData()
  cleanKBOTeamNames() // 동기화 후에도 한번 더

  // 주기적 동기화 스케줄
  syncTimer = setInterval(syncAllData, SYNC_INTERVAL)
  console.log(`[sync] 주기: ${SYNC_INTERVAL / 1000 / 60}분마다 자동 동기화`)

  // 라이브 스코어 빠른 동기화 (2분마다)
  setInterval(syncLiveScores, 2 * 60 * 1000)
  setInterval(syncESPNLive, 2 * 60 * 1000)
  console.log(`[live] 라이브 스코어: 2분마다 업데이트 (야구+축구+농구+배구)`)

  // SPA fallback — /api 이외 모든 요청은 index.html로
  const fs = await import('fs')
  const indexPath = join(clientBuildPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    app.get('*', (req, res) => res.sendFile(indexPath))
    console.log(`[static] 프론트엔드 서빙: ${clientBuildPath}`)
  }

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  스포츠스포AI: http://0.0.0.0:${PORT}`)
    console.log(`  Environment: ${NODE_ENV}`)
    console.log(`  Health check: /api/health\n`)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()
