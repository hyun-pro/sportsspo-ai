import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardSummary,
  getDashboardToday,
  getDashboardRecentResults,
} from '../services/api'
import { getShortName } from '../utils/teamNames'
import { TeamLogo } from '../components/TeamBadge'

const LEAGUES = ['', 'KBO', 'MLB', 'NPB', 'EPL', 'LALIGA', 'BUNDESLIGA', 'SERIE_A', 'NBA', 'NHL']
const LEAGUE_LABEL = { '': '전체', KBO: 'KBO', MLB: 'MLB', NPB: 'NPB', EPL: 'EPL', LALIGA: 'LALIGA', BUNDESLIGA: 'BUN', SERIE_A: 'SERIE', NBA: 'NBA', NHL: 'NHL' }

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
        <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
      </div>
    )
  }

  const liveGames = games.filter(g => g.status === 'live')
  const scheduledGames = games.filter(g => g.status === 'scheduled')
  const finalGames = games.filter(g => g.status === 'final')
  const allVisible = [...liveGames, ...scheduledGames, ...finalGames]

  return (
    <div className="max-w-5xl mx-auto px-1">
      {/* ─── Top ─── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">오늘의 경기</h1>
          {summary && (
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 tabular-nums">
              {summary.today_games}경기 · 적중률 {summary.overall_accuracy}% ({summary.correct_predictions}/{summary.total_finished})
            </p>
          )}
        </div>
        {liveGames.length > 0 && (
          <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            LIVE {liveGames.length}
          </span>
        )}
      </div>

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {LEAGUES.map(l => (
          <button key={l} onClick={() => setLeague(l)}
            className={`px-2 py-1 text-[10px] font-semibold rounded whitespace-nowrap transition-colors ${
              league === l
                ? 'bg-white text-gray-900'
                : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700'
            }`}>
            {LEAGUE_LABEL[l]}
          </button>
        ))}
        <div className="w-px h-3.5 bg-dark-600 mx-0.5 shrink-0" />
        {[{ key: 'time', label: '시간순' }, { key: 'confidence', label: '신뢰도순' }].map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`px-2 py-1 text-[10px] font-semibold rounded whitespace-nowrap transition-colors ${
              sort === s.key ? 'bg-dark-600 text-gray-200' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Match List ─── */}
      {allVisible.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm">오늘 예정된 경기가 없습니다</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block border border-dark-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[56px_minmax(0,1fr)_90px_70px_50px_70px] bg-dark-800 px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-600">
              <span>시간</span>
              <span>매치업</span>
              <span className="text-center">추천</span>
              <span className="text-center">승률</span>
              <span className="text-center">신뢰</span>
              <span className="text-right">상세</span>
            </div>
            {allVisible.map(g => <DesktopRow key={g.id} game={g} />)}
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {allVisible.map(g => <MobileCard key={g.id} game={g} />)}
          </div>
        </>
      )}

      {/* ─── Recent Results ─── */}
      {recentResults.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500">최근 결과</h2>
            <Link to="/live" className="text-[10px] text-gray-600 hover:text-gray-400">전체보기</Link>
          </div>
          <div className="border border-dark-600 rounded-lg overflow-hidden">
            {recentResults.slice(0, 6).map(g => {
              const homeWin = g.home_score > g.away_score
              return (
                <Link key={g.id} to={`/game/${g.id}`}
                  className="flex items-center px-3 py-2 border-b border-dark-700/50 last:border-0 hover:bg-dark-700/30 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${
                    g.is_correct === true ? 'bg-emerald-500' : g.is_correct === false ? 'bg-red-400' : 'bg-gray-700'
                  }`} />
                  <span className="text-[10px] text-gray-600 w-7 shrink-0">{g.league}</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <SmallLogo game={g} side="home" />
                    <span className={`text-[11px] truncate ${homeWin ? 'text-gray-200 font-semibold' : 'text-gray-600'}`}>
                      {getShortName(g.home_team)}
                    </span>
                    <span className="text-[10px] text-gray-700 tabular-nums shrink-0">{g.home_score}-{g.away_score}</span>
                    <span className={`text-[11px] truncate ${!homeWin ? 'text-gray-200 font-semibold' : 'text-gray-600'}`}>
                      {getShortName(g.away_team)}
                    </span>
                    <SmallLogo game={g} side="away" />
                  </div>
                  <span className={`text-[9px] font-semibold shrink-0 ${
                    g.is_correct === true ? 'text-emerald-400' : g.is_correct === false ? 'text-red-400' : 'text-gray-700'
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

/* ═══ Desktop Row ═══ */
function DesktopRow({ game }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const locked = pred?.recommended_pick === 'locked'
  const winProb = pred && !locked ? Math.max(pred.home_win_probability, pred.away_win_probability) : null
  const pickedTeam = pred && !locked ? (pickHome ? getShortName(game.home_team) : getShortName(game.away_team)) : null

  return (
    <Link to={`/game/${game.id}`}
      className="grid grid-cols-[56px_minmax(0,1fr)_90px_70px_50px_70px] items-center px-3 py-2.5 border-b border-dark-700/40 last:border-0 hover:bg-dark-700/30 transition-colors group">
      <div>
        {isLive ? (
          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />LIVE
          </span>
        ) : isFinal ? (
          <span className="text-[10px] text-gray-600">종료</span>
        ) : (
          <span className="text-xs text-gray-400 tabular-nums">{game.game_time || '—'}</span>
        )}
        <div className="text-[9px] text-gray-700">{game.league}</div>
      </div>

      <div className="flex items-center gap-1.5 min-w-0">
        <SmallLogo game={game} side="home" />
        <span className={`text-sm truncate ${pickHome && !locked ? 'text-white font-semibold' : 'text-gray-400'}`}>
          {getShortName(game.home_team)}
        </span>
        {isFinal ? (
          <span className="text-xs text-gray-500 tabular-nums shrink-0 mx-0.5">{game.home_score} : {game.away_score}</span>
        ) : (
          <span className="text-[10px] text-gray-700 shrink-0 mx-0.5">vs</span>
        )}
        <span className={`text-sm truncate ${!pickHome && !locked ? 'text-white font-semibold' : 'text-gray-400'}`}>
          {getShortName(game.away_team)}
        </span>
        <SmallLogo game={game} side="away" />
      </div>

      <div className="text-center">
        {pickedTeam ? (
          <span className="text-xs font-semibold text-gray-200">{pickedTeam}</span>
        ) : locked ? (
          <span className="text-[10px] text-gray-700">PRO</span>
        ) : <span className="text-gray-800">—</span>}
      </div>

      <div className="text-center">
        {winProb ? (
          <span className="text-sm font-bold text-white tabular-nums">{winProb}%</span>
        ) : <span className="text-gray-800">—</span>}
      </div>

      <div className="text-center">
        {pred && !locked ? <ConfDot score={pred.confidence_score} /> : <span className="text-gray-800">—</span>}
      </div>

      <div className="text-right">
        <span className="text-[10px] text-gray-600 group-hover:text-gray-300 transition-colors">분석 →</span>
      </div>
    </Link>
  )
}

/* ═══ Mobile Card ═══ */
function MobileCard({ game }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const locked = pred?.recommended_pick === 'locked'
  const winProb = pred && !locked ? Math.max(pred.home_win_probability, pred.away_win_probability) : null
  const pickedTeam = pred && !locked ? (pickHome ? getShortName(game.home_team) : getShortName(game.away_team)) : null

  return (
    <Link to={`/game/${game.id}`}
      className="block bg-dark-800 border border-dark-600 rounded-xl p-3 active:bg-dark-700/50 transition-colors">

      {/* 1줄: 리그 + 시간 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-500 bg-dark-700 px-1.5 py-0.5 rounded">{game.league}</span>
          {isLive && (
            <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-600 tabular-nums">
          {isFinal ? '종료' : game.game_time || '—'}
        </span>
      </div>

      {/* 2줄: 팀 매치업 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SmallLogo game={game} side="home" size="md" />
          <div className="min-w-0">
            <div className={`text-sm font-semibold truncate ${pickHome && !locked ? 'text-white' : 'text-gray-400'}`}>
              {getShortName(game.home_team)}
            </div>
            <div className="text-[9px] text-gray-700">홈</div>
          </div>
        </div>

        <div className="px-3 shrink-0 text-center">
          {isFinal ? (
            <div className="text-base font-bold tabular-nums">
              <span className={game.home_score > game.away_score ? 'text-white' : 'text-gray-600'}>{game.home_score}</span>
              <span className="text-gray-700 mx-1">:</span>
              <span className={game.away_score > game.home_score ? 'text-white' : 'text-gray-600'}>{game.away_score}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-700 font-semibold">VS</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <div className={`text-sm font-semibold truncate ${!pickHome && !locked ? 'text-white' : 'text-gray-400'}`}>
              {getShortName(game.away_team)}
            </div>
            <div className="text-[9px] text-gray-700">원정</div>
          </div>
          <SmallLogo game={game} side="away" size="md" />
        </div>
      </div>

      {/* 3줄: 예측 정보 */}
      {pred && !locked ? (
        <div className="flex items-center justify-between pt-2 border-t border-dark-700">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[9px] text-gray-600">추천</div>
              <div className="text-xs font-semibold text-white">{pickedTeam}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600">승률</div>
              <div className="text-sm font-bold text-white tabular-nums">{winProb}%</div>
            </div>
            <ConfDot score={pred.confidence_score} />
          </div>
          <span className="text-[10px] text-gray-600">분석 →</span>
        </div>
      ) : locked ? (
        <div className="pt-2 border-t border-dark-700 text-center">
          <span className="text-[10px] text-gray-700">PRO 구독으로 예측 확인</span>
        </div>
      ) : null}
    </Link>
  )
}

/* ═══ Helpers ═══ */
function ConfDot({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-gray-600'
  return (
    <div className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-400 tabular-nums">{score}</span>
    </div>
  )
}

function SmallLogo({ game, side, size = 'sm' }) {
  const logo = side === 'home' ? game.home_logo : game.away_logo
  const team = side === 'home' ? game.home_team : game.away_team
  const s = size === 'md' ? 'w-6 h-6' : 'w-4 h-4'
  if (logo) return <img src={logo} alt="" className={`${s} object-contain shrink-0`} loading="lazy" />
  return <TeamLogo team={team} size={size === 'md' ? 'sm' : 'xs'} />
}
