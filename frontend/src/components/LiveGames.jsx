import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardLive } from '../services/api'
import { TeamLogo } from './TeamBadge'
import LeagueBadge from './LeagueBadge'
import ConfidenceBadge from './ConfidenceBadge'
import Scoreboard, { Diamond } from './Scoreboard'
import { getShortName } from '../utils/teamNames'

export default function LiveGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const intervalRef = useRef(null)

  const fetchLive = () => {
    getDashboardLive()
      .then((res) => setGames(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLive()
    intervalRef.current = setInterval(fetchLive, 10000) // 10초
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading && games.length === 0) return null
  if (games.length === 0) return null

  const expandedGame = games.find(g => g.id === expanded)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <h2 className="text-base font-bold text-white">LIVE</h2>
          <span className="text-xs text-gray-500">{games.length}경기 진행중</span>
        </div>
        <span className="text-[10px] text-gray-600">30초 자동갱신</span>
      </div>

      {/* 확대 전광판 */}
      {expandedGame && (
        <div className="animate-in space-y-2">
          <Scoreboard game={expandedGame} />

          {/* AI 예측 + 상세 링크 */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              {expandedGame.prediction && (
                <div className="text-xs text-gray-400">
                  AI 예측:{' '}
                  <span className={`font-bold ${expandedGame.prediction.recommended_pick === 'home' ? 'text-accent-blue' : 'text-accent-purple'}`}>
                    {expandedGame.prediction.recommended_pick === 'home'
                      ? getShortName(expandedGame.home_team)
                      : getShortName(expandedGame.away_team)}
                    {' '}{Math.max(expandedGame.prediction.home_win_probability, expandedGame.prediction.away_win_probability)}%
                  </span>
                </div>
              )}
              <Link
                to={`/game/${expandedGame.id}`}
                className="text-[10px] text-accent-blue hover:text-blue-400"
                onClick={e => e.stopPropagation()}
              >
                상세 분석 &rarr;
              </Link>
            </div>
            <button onClick={() => setExpanded(null)} className="text-xs text-gray-500 hover:text-white">
              접기 &times;
            </button>
          </div>
        </div>
      )}

      {/* 라이브 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {games.map((g) => (
          <LiveCard
            key={g.id}
            game={g}
            isExpanded={expanded === g.id}
            onExpand={() => setExpanded(expanded === g.id ? null : g.id)}
          />
        ))}
      </div>
    </div>
  )
}

function LiveCard({ game, isExpanded, onExpand }) {
  const pred = game.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const ld = game.live_data
  const currentInning = game.current_inning ?? ld?.currentInning
  const inningHalf = game.inning_half ?? ld?.inningHalf
  const outs = game.outs ?? ld?.outs ?? 0
  const runners = ld?.runners || {}
  const hasRunners = runners.first || runners.second || runners.third

  // 이닝 텍스트
  const inningDisplay = currentInning
    ? `${inningHalf === 'Top' ? '▲' : '▼'} ${currentInning}회${inningHalf === 'Top' ? ' 초' : ' 말'}`
    : 'LIVE'

  return (
    <div
      className={`card p-3 cursor-pointer hover:bg-dark-700/40 transition-all ${
        isExpanded ? 'ring-1 ring-accent-blue/50 bg-dark-700/30' : ''
      }`}
      onClick={onExpand}
    >
      {/* Top: 리그 + 이닝 정보 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LeagueBadge league={game.league} />
          <span className="text-[10px] font-bold text-accent-red animate-pulse">{inningDisplay}</span>
        </div>
        {/* 아웃카운트 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-600">OUT</span>
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < outs ? 'bg-red-500' : 'bg-dark-600'}`} />
          ))}
        </div>
      </div>

      {/* 팀 스코어 */}
      <div className="space-y-1">
        {/* Away */}
        <div className={`flex items-center justify-between px-2 py-1.5 rounded ${
          inningHalf === 'Top' ? 'bg-dark-600/50 border-l-2 border-accent-blue' :
          !pickHome ? 'bg-accent-purple/5' : 'bg-dark-700/30'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamLogo team={game.away_team} size="sm" />
            <span className="text-xs font-bold text-gray-200 truncate">{getShortName(game.away_team)}</span>
            {inningHalf === 'Top' && <span className="text-[8px] text-accent-blue ml-0.5">공격</span>}
          </div>
          <span className="text-xl font-black text-white tabular-nums ml-2">
            {game.away_score ?? 0}
          </span>
        </div>

        {/* Home */}
        <div className={`flex items-center justify-between px-2 py-1.5 rounded ${
          inningHalf === 'Bottom' ? 'bg-dark-600/50 border-l-2 border-accent-purple' :
          pickHome ? 'bg-accent-blue/5' : 'bg-dark-700/30'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamLogo team={game.home_team} size="sm" />
            <span className="text-xs font-bold text-gray-200 truncate">{getShortName(game.home_team)}</span>
            {inningHalf === 'Bottom' && <span className="text-[8px] text-accent-purple ml-0.5">공격</span>}
          </div>
          <span className="text-xl font-black text-white tabular-nums ml-2">
            {game.home_score ?? 0}
          </span>
        </div>
      </div>

      {/* 하단: 다이아몬드 + 주자 텍스트 + AI 예측 */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dark-700">
        <div className="flex items-center gap-1.5">
          {/* 미니 다이아몬드 */}
          <svg viewBox="0 0 30 30" className="w-5 h-5 shrink-0">
            <path d="M15 3 L27 15 L15 27 L3 15 Z" fill="none" stroke="#374151" strokeWidth="1.5" />
            <rect x="23" y="11" width="5" height="5" rx="0.5"
              fill={runners.first ? '#EAB308' : '#1F2937'} stroke={runners.first ? '#CA8A04' : '#374151'} strokeWidth="0.5" />
            <rect x="12.5" y="0.5" width="5" height="5" rx="0.5"
              fill={runners.second ? '#EAB308' : '#1F2937'} stroke={runners.second ? '#CA8A04' : '#374151'} strokeWidth="0.5" />
            <rect x="2" y="11" width="5" height="5" rx="0.5"
              fill={runners.third ? '#EAB308' : '#1F2937'} stroke={runners.third ? '#CA8A04' : '#374151'} strokeWidth="0.5" />
          </svg>
          <span className="text-[9px] text-gray-500">
            {hasRunners
              ? [runners.first && '1루', runners.second && '2루', runners.third && '3루'].filter(Boolean).join('·')
              : '주자없음'}
          </span>
        </div>

        {pred && (
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
              {pickHome ? getShortName(game.home_team) : getShortName(game.away_team)} {Math.max(pred.home_win_probability, pred.away_win_probability)}%
            </span>
            <ConfidenceBadge score={pred.confidence_score} size="sm" />
          </div>
        )}
      </div>
    </div>
  )
}
