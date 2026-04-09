import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getGames } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { TeamLogo } from '../components/TeamBadge'
import LeagueBadge from '../components/LeagueBadge'
import ConfidenceBadge from '../components/ConfidenceBadge'
import { getShortName } from '../utils/teamNames'

const SPORT_LABELS = { baseball: '야구', soccer: '축구', basketball: '농구' }

export default function Home() {
  const [searchParams] = useSearchParams()
  const sportParam = searchParams.get('sport')
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [minConfidence, setMinConfidence] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params = { page, per_page: 20 }
    if (league) params.league = league
    if (dateFilter) params.game_date = dateFilter
    if (minConfidence) params.min_confidence = parseInt(minConfidence)
    if (sportParam) params.sport = sportParam

    getGames(params)
      .then((res) => { setGames(res.data.games); setTotal(res.data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [league, dateFilter, minConfidence, page, sportParam])

  const totalPages = Math.ceil(total / 20)

  // 날짜별 그룹핑
  const grouped = {}
  games.forEach(g => {
    const d = g.game_date || 'unknown'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(g)
  })

  const formatDate = (d) => {
    const date = new Date(d + 'T00:00:00')
    const today = new Date()
    today.setHours(0,0,0,0)
    const diff = Math.round((date - today) / 86400000)
    const dayStr = ['일','월','화','수','목','금','토'][date.getDay()]
    const label = diff === 0 ? '오늘' : diff === 1 ? '내일' : diff === 2 ? '모레' : diff === -1 ? '어제' : ''
    return `${date.getMonth()+1}/${date.getDate()} (${dayStr})${label ? ` · ${label}` : ''}`
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-white">
          {sportParam ? `${SPORT_LABELS[sportParam] || sportParam} 예측` : '경기 예측'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">AI 분석 기반 승부 예측 · 선발투수 매치업 · 신뢰도 분석</p>
      </div>

      {/* 요약 통계 (클릭 가능) */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setMinConfidence(''); setPage(1) }}
          className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
            !minConfidence ? 'border-white/20 text-white bg-dark-700' : 'border-dark-600 text-gray-500 hover:text-white'
          }`}>
          전체 {total}
        </button>
        <button onClick={() => { setMinConfidence('70'); setPage(1) }}
          className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
            minConfidence === '70' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-dark-600 text-gray-500 hover:text-emerald-400'
          }`}>
          강력추천 {games.filter(g => g.prediction?.confidence_score >= 70).length}
        </button>
        <button onClick={() => { setMinConfidence('50'); setPage(1) }}
          className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
            minConfidence === '50' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-dark-600 text-gray-500 hover:text-amber-400'
          }`}>
          추천 50%+
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <input type="date" value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
          className="input-field w-auto text-xs py-1.5 px-2" />
        {(dateFilter || minConfidence) && (
          <button onClick={() => { setDateFilter(''); setMinConfidence(''); setPage(1) }}
            className="text-[10px] text-gray-500 hover:text-white">초기화</button>
        )}
      </div>

      {/* 경기 리스트 */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card p-12 text-center text-gray-600 text-sm">예정된 경기가 없습니다</div>
      ) : (
        Object.entries(grouped).map(([date, dateGames]) => (
          <div key={date}>
            <div className="text-xs font-bold text-gray-400 mb-2 px-1">{formatDate(date)}</div>
            <div className="space-y-2">
              {dateGames.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          </div>
        ))
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{page}/{totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">이전</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">다음</button>
          </div>
        </div>
      )}
    </div>
  )
}

function GameCard({ game }) {
  const pred = game.prediction
  const isLocked = pred?.recommended_pick === 'locked'
  const pickHome = pred?.recommended_pick === 'home'
  const hp = game.home_pitcher_stats
  const ap = game.away_pitcher_stats
  const homeLogo = game.home_logo
  const awayLogo = game.away_logo

  return (
    <Link to={`/game/${game.id}`} className="block card-interactive p-0 overflow-hidden">
      <div className="flex items-stretch">
        {/* 왼쪽: 시간 + 리그 */}
        <div className="w-14 sm:w-16 bg-dark-700/30 flex flex-col items-center justify-center py-3 border-r border-dark-600/50 shrink-0">
          <LeagueBadge league={game.league} />
          <div className="text-[10px] text-gray-500 mt-1">{game.game_time || '--:--'}</div>
          {game.status === 'final' && <div className="text-[8px] text-gray-600 mt-0.5">종료</div>}
          {game.status === 'live' && <div className="text-[8px] text-accent-red font-bold animate-pulse mt-0.5">LIVE</div>}
        </div>

        {/* 메인 */}
        <div className="flex-1 p-3">
          {/* 팀 매치업 */}
          <div className="flex items-center justify-between mb-2">
            {/* 홈팀 */}
            <div className={`flex items-center gap-2 flex-1 min-w-0 ${pickHome && !isLocked ? 'opacity-100' : ''}`}>
              <TeamLogoImg logo={homeLogo} team={game.home_team} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{getShortName(game.home_team)}</div>
                <div className="text-[9px] text-gray-600">홈</div>
              </div>
            </div>

            {/* 스코어 or VS */}
            <div className="px-2 sm:px-4 text-center shrink-0">
              {game.status === 'final' ? (
                <div className="text-lg font-black">
                  <span className={game.home_score > game.away_score ? 'text-white' : 'text-gray-600'}>{game.home_score}</span>
                  <span className="text-gray-700 mx-1">:</span>
                  <span className={game.away_score > game.home_score ? 'text-white' : 'text-gray-600'}>{game.away_score}</span>
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-600">VS</div>
              )}
            </div>

            {/* 원정팀 */}
            <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${!pickHome && !isLocked ? 'opacity-100' : ''}`}>
              <div className="min-w-0 text-right">
                <div className="text-sm font-bold text-white truncate">{getShortName(game.away_team)}</div>
                <div className="text-[9px] text-gray-600">원정</div>
              </div>
              <TeamLogoImg logo={awayLogo} team={game.away_team} size="md" />
            </div>
          </div>

          {/* 선발투수 매치업 (야구만) */}
          {(game.home_pitcher || game.away_pitcher) && (
            <div className="flex items-center justify-between bg-dark-700/30 rounded-lg px-2 py-1.5 mb-2">
              <PitcherInfo name={game.home_pitcher} stats={hp} side="home" />
              <span className="text-[9px] text-gray-600 shrink-0 mx-1">VS</span>
              <PitcherInfo name={game.away_pitcher} stats={ap} side="away" />
            </div>
          )}

          {/* AI 예측 */}
          {pred && !isLocked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">AI 예측:</span>
                <span className={`text-xs font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
                  {pickHome ? getShortName(game.home_team) : getShortName(game.away_team)} {Math.max(pred.home_win_probability, pred.away_win_probability)}%
                </span>
              </div>
              <ConfidenceBadge score={pred.confidence_score} size="sm" />
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1.5 text-gray-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px]">PRO 구독으로 예측 확인</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function PitcherInfo({ name, stats, side }) {
  if (!name) return <div className="flex-1 text-[10px] text-gray-600 truncate">{side === 'home' ? '홈 선발 미정' : '원정 선발 미정'}</div>
  return (
    <div className={`flex-1 min-w-0 ${side === 'away' ? 'text-right' : ''}`}>
      <div className="text-xs font-bold text-gray-200 truncate">{name}</div>
      {stats && (
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap" style={{ justifyContent: side === 'away' ? 'flex-end' : 'flex-start' }}>
          <span className="text-[9px] text-accent-blue font-bold">ERA {stats.era.toFixed(2)}</span>
          <span className="text-[9px] text-gray-500">{stats.wins}W-{stats.losses}L</span>
          <span className="text-[9px] text-gray-600">WHIP {stats.whip.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

function TeamLogoImg({ logo, team, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' }
  if (logo) {
    return <img src={logo} alt={team} className={`${sizes[size]} object-contain`} loading="lazy" />
  }
  return <TeamLogo team={team} size={size} />
}
