import { useNavigate } from 'react-router-dom'
import LeagueBadge from './LeagueBadge'
import ConfidenceBadge from './ConfidenceBadge'
import ProbabilityBar from './ProbabilityBar'
import TeamBadge from './TeamBadge'
import { getShortName } from '../utils/teamNames'

export default function GameRow({ game }) {
  const navigate = useNavigate()
  const p = game.prediction
  const isLocked = p?.recommended_pick === 'locked'
  const homeShort = getShortName(game.home_team)
  const awayShort = getShortName(game.away_team)

  return (
    <tr
      onClick={() => navigate(`/game/${game.id}`)}
      className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors"
    >
      {/* 날짜 */}
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
        <div className="text-xs sm:text-sm font-medium text-gray-200">{game.game_date}</div>
        <div className="text-[10px] sm:text-xs text-gray-500">{game.game_time || ''}</div>
      </td>

      {/* 리그 */}
      <td className="px-2 sm:px-4 py-3">
        <LeagueBadge league={game.league} />
      </td>

      {/* 경기 - 모바일에서 짧게 */}
      <td className="px-2 sm:px-4 py-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="hidden sm:inline"><TeamBadge team={game.home_team} showFull /></span>
          <span className="sm:hidden"><TeamBadge team={game.home_team} size="sm" /></span>
          <span className="text-[10px] sm:text-xs text-gray-500">vs</span>
          <span className="hidden sm:inline"><TeamBadge team={game.away_team} showFull /></span>
          <span className="sm:hidden"><TeamBadge team={game.away_team} size="sm" /></span>
        </div>
        {game.status === 'final' && game.home_score !== null && (
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
            {game.home_score} - {game.away_score}
          </div>
        )}
      </td>

      {/* 배당 */}
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap hidden sm:table-cell">
        {game.home_odds ? (
          <div className="text-xs sm:text-sm">
            <span className="text-gray-300">{game.home_odds.toFixed(2)}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-gray-300">{game.away_odds?.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-gray-600 text-xs">--</span>
        )}
      </td>

      {/* 승률 예측 */}
      <td className="px-2 sm:px-4 py-3 min-w-[160px] hidden md:table-cell">
        {p && !isLocked ? (
          <ProbabilityBar
            homeProb={p.home_win_probability}
            awayProb={p.away_win_probability}
            homeTeam={homeShort}
            awayTeam={awayShort}
          />
        ) : isLocked ? (
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px]">잠금</span>
          </div>
        ) : (
          <span className="text-gray-600 text-xs">-</span>
        )}
      </td>

      {/* 신뢰도 */}
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
        {p && !isLocked ? (
          <ConfidenceBadge score={p.confidence_score} size="sm" />
        ) : (
          <span className="text-gray-600 text-xs">--</span>
        )}
      </td>

      {/* 추천 */}
      <td className="px-2 sm:px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        {p && !isLocked ? (
          <span className={`text-xs sm:text-sm font-bold ${
            p.recommended_pick === 'home' ? 'text-accent-blue' : 'text-accent-purple'
          }`}>
            {p.recommended_pick === 'home' ? homeShort : awayShort}
          </span>
        ) : (
          <span className="text-gray-600">--</span>
        )}
      </td>
    </tr>
  )
}
