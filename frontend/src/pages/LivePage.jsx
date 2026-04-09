import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardLive, getDashboardToday } from '../services/api'

const LEAGUE_LABELS = {
  '': '전체', KBO: 'KBO', MLB: 'MLB', NPB: 'NPB',
  EPL: 'EPL', LALIGA: '라리가', BUNDESLIGA: '분데스', SERIE_A: '세리에A',
  LIGUE1: '리그1', UCL: 'UCL', UEL: '유로파', ACL: 'AFC', J_LEAGUE: 'J리그', MLS: 'MLS',
  NBA: 'NBA', NHL: 'NHL',
}
import { TeamLogo } from '../components/TeamBadge'
import LeagueBadge from '../components/LeagueBadge'
import ConfidenceBadge from '../components/ConfidenceBadge'
import Scoreboard from '../components/Scoreboard'
import { getShortName, getTeamCode } from '../utils/teamNames'

// ESPN 로고 또는 기존 팀 로고
function GameTeamLogo({ game, side, size = 'md' }) {
  const logo = side === 'home' ? game.home_logo : game.away_logo
  const team = side === 'home' ? game.home_team : game.away_team
  const sizes = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-10 h-10' }

  if (logo) {
    return <img src={logo} alt={team} className={`${sizes[size]} object-contain`} loading="lazy" />
  }
  return <TeamLogo team={team} size={size} />
}

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
    intervalRef.current = setInterval(fetchAll, 10000) // 10초
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
  const cancelledGames = filtered.filter(g => g.status === 'cancelled')

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

      {/* 스포츠 + 리그 필터 */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(LEAGUE_LABELS).map(l => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
              filter === l
                ? 'bg-accent-blue text-white'
                : 'bg-dark-700 text-gray-500 hover:text-white'
            }`}
          >
            {LEAGUE_LABELS[l] || '전체'}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-gray-600 self-center shrink-0">15초 자동갱신</span>
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

      {/* ── 취소/연기 경기 ── */}
      {cancelledGames.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">취소/연기 ({cancelledGames.length})</h2>
          <div className="space-y-1">
            {cancelledGames.map(g => (
              <div key={g.id} className="card p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-dark-600 text-gray-400">
                    {LEAGUE_LABELS[g.league] || g.league}
                  </span>
                  <GameTeamLogo game={g} side="away" size="sm" />
                  <span className="text-xs text-gray-500 truncate">{g.away_team}</span>
                  <span className="text-[10px] text-gray-600">vs</span>
                  <span className="text-xs text-gray-500 truncate">{g.home_team}</span>
                  <GameTeamLogo game={g} side="home" size="sm" />
                  <span className="ml-auto text-[10px] text-accent-red font-bold">
                    {g.live_data?.statusDetail || '취소'}
                  </span>
                </div>
              </div>
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

  // 스포츠별 상태 텍스트
  const statusText = (() => {
    if (game.sport === 'soccer') {
      const ld = game.live_data
      return ld?.statusDetail || (game.period ? `${game.period === '1' ? '전반' : '후반'} ${game.clock || ''}` : 'LIVE')
    }
    if (game.sport === 'basketball') {
      return game.period ? `${game.period}Q ${game.clock || ''}` : 'LIVE'
    }
    if (game.sport === 'volleyball') {
      const sets = game.live_data
      return sets?.statusDetail || `세트 ${game.period || ''}`
    }
    // baseball
    if (currentInning) return `${inningHalf === 'Top' ? '▲' : '▼'}${currentInning}회`
    return 'LIVE'
  })()

  return (
    <div
      onClick={onToggle}
      className={`card p-3 cursor-pointer hover:bg-dark-700/40 transition-all ${
        isExpanded ? 'ring-1 ring-accent-red/40' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* 리그 + 상태 */}
        <div className="w-16 sm:w-20 shrink-0">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-dark-600 text-gray-300">
            {LEAGUE_LABELS[game.league] || game.league}
          </span>
          <div className="text-[10px] font-bold text-accent-red mt-0.5 animate-pulse truncate">
            {statusText}
          </div>
        </div>

        {/* 원정팀 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GameTeamLogo game={game} side="away" size="md" />
          <div className="min-w-0">
            <div className="text-sm font-bold truncate text-gray-300">
              {getShortName(game.away_team)}
            </div>
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
          <GameTeamLogo game={game} side="home" size="md" />
        </div>

        {/* 화살표 */}
        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 예측 정보 (항상 표시) */}
      {pred && pred.recommended_pick !== 'locked' && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-700/50 px-1">
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-gray-500">
              AI 추천: <span className={`font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
                {pickHome ? getShortName(game.home_team) : getShortName(game.away_team)}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">
              승률 <span className="font-bold text-white">{Math.max(pred.home_win_probability, pred.away_win_probability)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${pred.confidence_score >= 70 ? 'bg-emerald-500' : pred.confidence_score >= 40 ? 'bg-amber-500' : 'bg-gray-600'}`} />
              <span className="text-[10px] text-gray-500">신뢰도 <span className="text-gray-300">{pred.confidence_score}</span></span>
            </div>
          </div>
          <Link to={`/game/${game.id}`} onClick={e => e.stopPropagation()}
            className="text-[10px] text-gray-600 hover:text-white">상세분석 →</Link>
        </div>
      )}
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
          <GameTeamLogo game={game} side="away" size="sm" />
          <span className="text-xs font-bold text-gray-300 truncate">{getShortName(game.away_team)}</span>
        </div>

        <span className="text-xs text-gray-600 shrink-0">vs</span>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold text-gray-300 truncate">{getShortName(game.home_team)}</span>
          <GameTeamLogo game={game} side="home" size="sm" />
        </div>

      </div>

      {/* 예측 정보 (모바일에서도 표시) */}
      {pred && pred.recommended_pick !== 'locked' && (
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dark-700/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">AI:</span>
            <span className={`text-[10px] font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
              {pickHome ? getShortName(game.home_team) : getShortName(game.away_team)} {Math.max(pred.home_win_probability, pred.away_win_probability)}%
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${pred.confidence_score >= 70 ? 'bg-emerald-500' : pred.confidence_score >= 40 ? 'bg-amber-500' : 'bg-gray-600'}`} />
            <span className="text-[10px] text-gray-500">{pred.confidence_score}</span>
          </div>
        </div>
      )}
    </Link>
  )
}

// ── 종료 경기 카드 (고퀄리티) ──
function FinishedGameRow({ game }) {
  const homeWin = (game.home_score ?? 0) > (game.away_score ?? 0)
  const pred = game.prediction
  const isCorrect = pred
    ? (pred.recommended_pick === 'home' && homeWin) || (pred.recommended_pick === 'away' && !homeWin)
    : null
  const totalScore = (game.home_score ?? 0) + (game.away_score ?? 0)

  return (
    <Link
      to={`/game/${game.id}`}
      className="block group"
    >
      <div className="card p-0 overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-dark-900/50 hover:border-dark-500">
        <div className="flex items-stretch">
          {/* 왼쪽 리그 + 시간 바 */}
          <div className="w-14 sm:w-16 bg-dark-700/50 flex flex-col items-center justify-center py-3 border-r border-dark-600 shrink-0">
            <LeagueBadge league={game.league} />
            <div className="text-[9px] text-gray-500 mt-1">{game.game_time || '종료'}</div>
            {isCorrect !== null && (
              <div className={`mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isCorrect ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'
              }`}>
                {isCorrect ? 'HIT' : 'MISS'}
              </div>
            )}
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              {/* 원정팀 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative">
                  <GameTeamLogo game={game} side="away" size="lg" />
                  {!homeWin && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rounded-full flex items-center justify-center">
                      <span className="text-[7px] font-black text-white">W</span>
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm sm:text-base font-bold truncate ${!homeWin ? 'text-white' : 'text-gray-500'}`}>
                    {getShortName(game.away_team)}
                  </div>
                  <div className="text-[9px] text-gray-600">{getTeamCode(game.away_team)}</div>
                </div>
              </div>

              {/* 스코어 */}
              <div className="flex items-center gap-0.5 sm:gap-1 mx-3 shrink-0">
                <span className={`text-2xl sm:text-3xl font-black tabular-nums ${!homeWin ? 'text-white' : 'text-gray-600'}`}>
                  {game.away_score ?? 0}
                </span>
                <div className="flex flex-col items-center mx-1">
                  <span className="text-[8px] text-gray-600 font-bold">FINAL</span>
                  <span className="text-gray-700 text-lg">:</span>
                </div>
                <span className={`text-2xl sm:text-3xl font-black tabular-nums ${homeWin ? 'text-white' : 'text-gray-600'}`}>
                  {game.home_score ?? 0}
                </span>
              </div>

              {/* 홈팀 */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <div className="min-w-0 text-right">
                  <div className={`text-sm sm:text-base font-bold truncate ${homeWin ? 'text-white' : 'text-gray-500'}`}>
                    {getShortName(game.home_team)}
                  </div>
                  <div className="text-[9px] text-gray-600">{getTeamCode(game.home_team)}</div>
                </div>
                <div className="relative">
                  <GameTeamLogo game={game} side="home" size="lg" />
                  {homeWin && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rounded-full flex items-center justify-center">
                      <span className="text-[7px] font-black text-white">W</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 정보 바 */}
            {pred && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-700/50">
                <div className="text-[10px] text-gray-500">
                  AI 예측: <span className={`font-bold ${pred.recommended_pick === 'home' ? 'text-accent-blue' : 'text-accent-purple'}`}>
                    {pred.recommended_pick === 'home' ? getShortName(game.home_team) : getShortName(game.away_team)}
                    {' '}{Math.max(pred.home_win_probability, pred.away_win_probability)}%
                  </span>
                </div>
                <ConfidenceBadge score={pred.confidence_score} size="sm" />
              </div>
            )}
          </div>

          {/* 오른쪽 화살표 */}
          <div className="w-8 sm:w-10 flex items-center justify-center bg-dark-700/30 border-l border-dark-600 group-hover:bg-dark-600/50 transition-colors shrink-0">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
