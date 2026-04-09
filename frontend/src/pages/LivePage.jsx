import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardLive, getDashboardToday, getDashboardRecentResults } from '../services/api'
import { TeamLogo } from '../components/TeamBadge'
import LeagueBadge from '../components/LeagueBadge'
import ConfidenceBadge from '../components/ConfidenceBadge'
import Scoreboard from '../components/Scoreboard'
import { getShortName, getTeamCode } from '../utils/teamNames'

export default function LivePage() {
  const [liveGames, setLiveGames] = useState([])
  const [todayGames, setTodayGames] = useState([])
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const fetchAll = () => {
    Promise.all([
      getDashboardLive().catch(() => ({ data: [] })),
      getDashboardToday().catch(() => ({ data: [] })),
    ]).then(([liveRes, todayRes]) => {
      setLiveGames(liveRes.data)
      setTodayGames(todayRes.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // 15초마다 갱신
    intervalRef.current = setInterval(fetchAll, 15000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    )
  }

  const filtered = filter
    ? todayGames.filter(g => g.league === filter)
    : todayGames

  const finishedGames = filtered.filter(g => g.status === 'final')
  const scheduledGames = filtered.filter(g => g.status === 'scheduled')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          실시간
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">오늘의 경기 · 실시간 스코어 · 경기 결과</p>
      </div>

      {/* 리그 필터 */}
      <div className="flex gap-1.5">
        {['', 'KBO', 'MLB', 'NPB'].map(l => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filter === l
                ? 'bg-accent-blue text-white'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            {l || '전체'}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-gray-600 self-center">15초 자동갱신</span>
      </div>

      {/* ── 실시간 진행 중 ── */}
      {liveGames.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-accent-red mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            경기 진행중 ({liveGames.filter(g => !filter || g.league === filter).length})
          </h2>
          <div className="space-y-2">
            {liveGames
              .filter(g => !filter || g.league === filter)
              .map(g => (
                <div key={g.id}>
                  <LiveGameRow
                    game={g}
                    isExpanded={expandedId === g.id}
                    onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                  />
                  {expandedId === g.id && (
                    <div className="animate-in mt-1 mb-3">
                      <Scoreboard game={g} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── 예정 경기 ── */}
      {scheduledGames.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-300 mb-2">
            예정 경기 ({scheduledGames.length})
          </h2>
          <div className="space-y-1">
            {scheduledGames.map(g => (
              <ScheduledGameRow key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {/* ── 오늘 종료된 경기 ── */}
      {finishedGames.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-300 mb-2">
            경기 종료 ({finishedGames.length})
          </h2>
          <div className="space-y-1">
            {finishedGames.map(g => (
              <FinishedGameRow key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && liveGames.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          오늘 예정된 경기가 없습니다
        </div>
      )}
    </div>
  )
}

// ── 실시간 경기 행 ──
function LiveGameRow({ game, isExpanded, onToggle }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const ld = game.live_data
  const currentInning = game.current_inning ?? ld?.currentInning
  const inningHalf = game.inning_half ?? ld?.inningHalf
  const outs = game.outs ?? ld?.outs ?? 0
  const runners = ld?.runners || {}

  const inningText = currentInning
    ? `${inningHalf === 'Top' ? '▲' : '▼'}${currentInning}회`
    : ''

  return (
    <div
      onClick={onToggle}
      className={`card p-3 cursor-pointer hover:bg-dark-700/40 transition-all ${
        isExpanded ? 'ring-1 ring-accent-red/40' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* 리그 + 이닝 */}
        <div className="w-16 sm:w-20 shrink-0">
          <LeagueBadge league={game.league} />
          <div className="text-[10px] font-bold text-accent-red mt-0.5 animate-pulse">
            {inningText || 'LIVE'}
          </div>
        </div>

        {/* 원정팀 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamLogo team={game.away_team} size="md" />
          <div className="min-w-0">
            <div className={`text-sm font-bold truncate ${inningHalf === 'Top' ? 'text-white' : 'text-gray-400'}`}>
              {getShortName(game.away_team)}
            </div>
            <div className="text-[9px] text-gray-600">{getTeamCode(game.away_team)}</div>
          </div>
        </div>

        {/* 스코어 */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-2xl font-black text-white tabular-nums w-7 text-center">
            {game.away_score ?? 0}
          </span>
          <span className="text-gray-600 text-sm">-</span>
          <span className="text-2xl font-black text-white tabular-nums w-7 text-center">
            {game.home_score ?? 0}
          </span>
        </div>

        {/* 홈팀 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <div className={`text-sm font-bold truncate ${inningHalf === 'Bottom' ? 'text-white' : 'text-gray-400'}`}>
              {getShortName(game.home_team)}
            </div>
            <div className="text-[9px] text-gray-600">{getTeamCode(game.home_team)}</div>
          </div>
          <TeamLogo team={game.home_team} size="md" />
        </div>

        {/* 아웃 + 다이아몬드 */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 ml-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < outs ? 'bg-red-500' : 'bg-dark-600'}`} />
              ))}
            </div>
            <span className="text-[8px] text-gray-600">OUT</span>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="#374151" strokeWidth="1" />
            <rect x="18" y="9" width="4" height="4" rx="0.5" fill={runners.first ? '#EAB308' : '#1F2937'} />
            <rect x="10" y="1" width="4" height="4" rx="0.5" fill={runners.second ? '#EAB308' : '#1F2937'} />
            <rect x="2" y="9" width="4" height="4" rx="0.5" fill={runners.third ? '#EAB308' : '#1F2937'} />
          </svg>
        </div>

        {/* 화살표 */}
        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

// ── 예정 경기 행 ──
function ScheduledGameRow({ game }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'

  return (
    <Link to={`/game/${game.id}`} className="card p-3 block hover:bg-dark-700/40 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-16 sm:w-20 shrink-0">
          <LeagueBadge league={game.league} />
          <div className="text-[10px] text-gray-500 mt-0.5">{game.game_time || '시간 미정'}</div>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamLogo team={game.away_team} size="sm" />
          <span className="text-xs font-bold text-gray-300 truncate">{getShortName(game.away_team)}</span>
        </div>

        <span className="text-xs text-gray-600 shrink-0">vs</span>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold text-gray-300 truncate">{getShortName(game.home_team)}</span>
          <TeamLogo team={game.home_team} size="sm" />
        </div>

        {pred && (
          <div className="shrink-0 text-right hidden sm:block">
            <div className={`text-[10px] font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
              {pickHome ? getShortName(game.home_team) : getShortName(game.away_team)} {Math.max(pred.home_win_probability, pred.away_win_probability)}%
            </div>
            <ConfidenceBadge score={pred.confidence_score} size="sm" />
          </div>
        )}
      </div>
    </Link>
  )
}

// ── 종료 경기 행 ──
function FinishedGameRow({ game }) {
  const homeWin = (game.home_score ?? 0) > (game.away_score ?? 0)
  const pred = game.prediction
  const isCorrect = pred
    ? (pred.recommended_pick === 'home' && homeWin) || (pred.recommended_pick === 'away' && !homeWin)
    : null

  return (
    <Link to={`/game/${game.id}`} className="card p-3 block hover:bg-dark-700/40 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-16 sm:w-20 shrink-0">
          <LeagueBadge league={game.league} />
          <div className="text-[10px] text-gray-500 mt-0.5">종료</div>
        </div>

        {/* 원정 */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${!homeWin ? '' : 'opacity-50'}`}>
          <TeamLogo team={game.away_team} size="md" />
          <span className={`text-sm font-bold truncate ${!homeWin ? 'text-white' : 'text-gray-500'}`}>
            {getShortName(game.away_team)}
          </span>
          {!homeWin && <span className="text-[9px] font-bold text-accent-green">W</span>}
        </div>

        {/* 스코어 */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xl font-black tabular-nums w-6 text-center ${!homeWin ? 'text-white' : 'text-gray-500'}`}>
            {game.away_score ?? 0}
          </span>
          <span className="text-gray-600 text-xs">-</span>
          <span className={`text-xl font-black tabular-nums w-6 text-center ${homeWin ? 'text-white' : 'text-gray-500'}`}>
            {game.home_score ?? 0}
          </span>
        </div>

        {/* 홈 */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 justify-end ${homeWin ? '' : 'opacity-50'}`}>
          {homeWin && <span className="text-[9px] font-bold text-accent-green">W</span>}
          <span className={`text-sm font-bold truncate ${homeWin ? 'text-white' : 'text-gray-500'}`}>
            {getShortName(game.home_team)}
          </span>
          <TeamLogo team={game.home_team} size="md" />
        </div>

        {/* 예측 결과 */}
        <div className="shrink-0 w-12 text-center">
          {isCorrect !== null && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isCorrect ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'
            }`}>
              {isCorrect ? 'HIT' : 'MISS'}
            </span>
          )}
        </div>

        {/* 화살표 */}
        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
