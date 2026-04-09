import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardSummary,
  getDashboardToday,
  getDashboardTopPicks,
  getDashboardRecentResults,
} from '../services/api'
import { getShortName } from '../utils/teamNames'
import { TeamLogo } from '../components/TeamBadge'

const LEAGUES = ['', 'KBO', 'MLB', 'NPB', 'EPL', 'LALIGA', 'BUNDESLIGA', 'SERIE_A', 'NBA', 'NHL']
const LEAGUE_LABEL = { '': '전체', KBO: 'KBO', MLB: 'MLB', NPB: 'NPB', EPL: 'EPL', LALIGA: 'LALIGA', BUNDESLIGA: 'BUN', SERIE_A: 'SERIE', NBA: 'NBA', NHL: 'NHL' }
const SORTS = [
  { key: 'time', label: '시간순' },
  { key: 'confidence', label: '신뢰도순' },
]

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [games, setGames] = useState([])
  const [recentResults, setRecentResults] = useState([])
  const [league, setLeague] = useState('')
  const [sort, setSort] = useState('time')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardToday(),
      getDashboardRecentResults({ limit: 10 }),
    ])
      .then(([s, t, r]) => {
        setSummary(s.data)
        setGames(t.data)
        setRecentResults(r.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = { sort }
    if (league) params.league = league
    getDashboardToday(params)
      .then(res => setGames(res.data))
      .catch(console.error)
  }, [sort, league])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    )
  }

  const liveGames = games.filter(g => g.status === 'live')
  const scheduledGames = games.filter(g => g.status === 'scheduled')
  const finalGames = games.filter(g => g.status === 'final')
  const allVisible = [...liveGames, ...scheduledGames, ...finalGames]

  return (
    <div className="max-w-5xl mx-auto">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight">오늘의 경기</h1>
          {summary && (
            <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
              {summary.today_games}경기 · 적중률 {summary.overall_accuracy}% ({summary.correct_predictions}/{summary.total_finished})
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {liveGames.length > 0 && (
            <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              LIVE {liveGames.length}
            </span>
          )}
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
        {LEAGUES.map(l => (
          <button key={l} onClick={() => setLeague(l)}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded whitespace-nowrap transition-colors ${
              league === l
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
            {LEAGUE_LABEL[l]}
          </button>
        ))}
        <div className="w-px h-4 bg-neutral-700 mx-1 shrink-0" />
        {SORTS.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded whitespace-nowrap transition-colors ${
              sort === s.key
                ? 'bg-neutral-700 text-neutral-200'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Match List (Desktop: table, Mobile: cards) ─── */}
      {allVisible.length === 0 ? (
        <div className="text-center py-20 text-neutral-600 text-sm">오늘 예정된 경기가 없습니다</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[60px_minmax(0,1fr)_100px_80px_60px_80px] bg-neutral-800/50 px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                <span>시간</span>
                <span>매치업</span>
                <span className="text-center">추천</span>
                <span className="text-center">승률</span>
                <span className="text-center">신뢰도</span>
                <span className="text-right">상세</span>
              </div>

              {/* Rows */}
              {allVisible.map(g => (
                <MatchRow key={g.id} game={g} />
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {allVisible.map(g => (
              <MobileMatchCard key={g.id} game={g} />
            ))}
          </div>
        </>
      )}

      {/* ─── Recent Results ─── */}
      {recentResults.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-400">최근 결과</h2>
            <Link to="/live" className="text-[10px] text-neutral-500 hover:text-neutral-300">전체보기</Link>
          </div>
          <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800/60">
            {recentResults.slice(0, 6).map(g => {
              const homeWin = g.home_score > g.away_score
              return (
                <Link key={g.id} to={`/game/${g.id}`}
                  className="flex items-center px-3 py-2 hover:bg-neutral-800/30 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2.5 ${
                    g.is_correct === true ? 'bg-emerald-500' : g.is_correct === false ? 'bg-red-400' : 'bg-neutral-700'
                  }`} />
                  <span className="text-[10px] text-neutral-600 w-8 shrink-0">{g.league}</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <TeamLogoSmall game={g} side="home" />
                    <span className={`text-xs truncate ${homeWin ? 'text-neutral-200 font-semibold' : 'text-neutral-600'}`}>
                      {getShortName(g.home_team)}
                    </span>
                    <span className="text-[10px] text-neutral-700 tabular-nums shrink-0">{g.home_score} - {g.away_score}</span>
                    <span className={`text-xs truncate ${!homeWin ? 'text-neutral-200 font-semibold' : 'text-neutral-600'}`}>
                      {getShortName(g.away_team)}
                    </span>
                    <TeamLogoSmall game={g} side="away" />
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    g.is_correct === true ? 'text-emerald-400' : g.is_correct === false ? 'text-red-400' : 'text-neutral-700'
                  }`}>
                    {g.is_correct === true ? 'HIT' : g.is_correct === false ? 'MISS' : '—'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══ Desktop Match Row ═══ */
function MatchRow({ game }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const winProb = pred ? Math.max(pred.home_win_probability, pred.away_win_probability) : null
  const pickedTeam = pred ? (pickHome ? getShortName(game.home_team) : getShortName(game.away_team)) : null

  return (
    <Link to={`/game/${game.id}`}
      className="grid grid-cols-[60px_minmax(0,1fr)_100px_80px_60px_80px] items-center px-3 py-2.5 border-t border-neutral-800/60 hover:bg-neutral-800/20 transition-colors group">

      {/* Time / Status */}
      <div>
        {isLive ? (
          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
            LIVE
          </span>
        ) : isFinal ? (
          <span className="text-[10px] text-neutral-600">종료</span>
        ) : (
          <span className="text-xs text-neutral-400 tabular-nums">{game.game_time || '—'}</span>
        )}
        <div className="text-[9px] text-neutral-700">{game.league}</div>
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-2 min-w-0">
        <TeamLogoSmall game={game} side="home" />
        <span className={`text-sm truncate ${pickHome && pred ? 'text-neutral-100 font-semibold' : 'text-neutral-400'}`}>
          {getShortName(game.home_team)}
        </span>

        {isFinal ? (
          <span className="text-xs text-neutral-500 tabular-nums shrink-0 mx-1">
            {game.home_score} <span className="text-neutral-700">:</span> {game.away_score}
          </span>
        ) : (
          <span className="text-[10px] text-neutral-700 shrink-0 mx-1">vs</span>
        )}

        <span className={`text-sm truncate ${!pickHome && pred ? 'text-neutral-100 font-semibold' : 'text-neutral-400'}`}>
          {getShortName(game.away_team)}
        </span>
        <TeamLogoSmall game={game} side="away" />
      </div>

      {/* Recommended Side */}
      <div className="text-center">
        {pred && pred.recommended_pick !== 'locked' ? (
          <span className="text-xs font-semibold text-neutral-200">{pickedTeam}</span>
        ) : pred?.recommended_pick === 'locked' ? (
          <span className="text-[10px] text-neutral-700">PRO</span>
        ) : (
          <span className="text-neutral-800">—</span>
        )}
      </div>

      {/* Win Probability */}
      <div className="text-center">
        {winProb && pred.recommended_pick !== 'locked' ? (
          <span className="text-sm font-bold text-neutral-200 tabular-nums">{winProb}%</span>
        ) : (
          <span className="text-neutral-800">—</span>
        )}
      </div>

      {/* Confidence */}
      <div className="text-center">
        {pred && pred.recommended_pick !== 'locked' ? (
          <ConfidenceDot score={pred.confidence_score} />
        ) : (
          <span className="text-neutral-800">—</span>
        )}
      </div>

      {/* CTA */}
      <div className="text-right">
        <span className="text-[10px] text-neutral-600 group-hover:text-neutral-300 transition-colors">
          분석보기 →
        </span>
      </div>
    </Link>
  )
}

/* ═══ Mobile Match Card ═══ */
function MobileMatchCard({ game }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const winProb = pred ? Math.max(pred.home_win_probability, pred.away_win_probability) : null
  const pickedTeam = pred ? (pickHome ? getShortName(game.home_team) : getShortName(game.away_team)) : null
  const locked = pred?.recommended_pick === 'locked'

  return (
    <Link to={`/game/${game.id}`}
      className="block border border-neutral-800 rounded-lg p-3 active:bg-neutral-800/30 transition-colors">

      {/* Top: league + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-neutral-500">{game.league}</span>
          {isLive && (
            <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />LIVE
            </span>
          )}
        </div>
        <span className="text-[10px] text-neutral-600 tabular-nums">
          {isFinal ? '종료' : game.game_time || '—'}
        </span>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TeamLogoSmall game={game} side="home" />
          <span className={`text-sm truncate ${pickHome && !locked ? 'text-neutral-100 font-semibold' : 'text-neutral-400'}`}>
            {getShortName(game.home_team)}
          </span>
        </div>
        <div className="px-2 shrink-0">
          {isFinal ? (
            <span className="text-sm text-neutral-400 tabular-nums font-semibold">{game.home_score} : {game.away_score}</span>
          ) : (
            <span className="text-[10px] text-neutral-700">VS</span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className={`text-sm truncate ${!pickHome && !locked ? 'text-neutral-100 font-semibold' : 'text-neutral-400'}`}>
            {getShortName(game.away_team)}
          </span>
          <TeamLogoSmall game={game} side="away" />
        </div>
      </div>

      {/* Bottom: prediction info */}
      {pred && !locked ? (
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[9px] text-neutral-600">추천</div>
              <div className="text-xs font-semibold text-neutral-200">{pickedTeam}</div>
            </div>
            <div>
              <div className="text-[9px] text-neutral-600">승률</div>
              <div className="text-sm font-bold text-neutral-200 tabular-nums">{winProb}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceDot score={pred.confidence_score} />
            <span className="text-[10px] text-neutral-600">분석보기 →</span>
          </div>
        </div>
      ) : locked ? (
        <div className="pt-2 border-t border-neutral-800/60 text-center">
          <span className="text-[10px] text-neutral-700">PRO 구독으로 예측 확인</span>
        </div>
      ) : null}
    </Link>
  )
}

/* ═══ Small helpers ═══ */
function ConfidenceDot({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-neutral-600'
  return (
    <div className="flex items-center justify-center gap-1" title={`신뢰도 ${score}`}>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-neutral-400 tabular-nums">{score}</span>
    </div>
  )
}

function TeamLogoSmall({ game, side }) {
  const logo = side === 'home' ? game.home_logo : game.away_logo
  const team = side === 'home' ? game.home_team : game.away_team
  if (logo) return <img src={logo} alt="" className="w-4 h-4 object-contain shrink-0" loading="lazy" />
  return <TeamLogo team={team} size="xs" />
}
