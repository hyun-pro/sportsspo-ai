import { TeamLogo } from './TeamBadge'
import { getShortName } from '../utils/teamNames'

// 야구 전광판 스코어보드
export default function Scoreboard({ game }) {
  const ld = game.live_data
  const hasLiveData = ld && (ld.innings?.length > 0 || ld.runners)
  const innings = ld?.innings || []
  const totals = ld?.totals
  const runners = ld?.runners || {}
  const balls = ld?.balls ?? 0
  const strikes = ld?.strikes ?? 0
  const outs = game.outs ?? ld?.outs ?? 0
  const currentInning = game.current_inning ?? ld?.currentInning
  const inningHalf = game.inning_half ?? ld?.inningHalf

  const awayName = getShortName(game.away_team)
  const homeName = getShortName(game.home_team)

  // live_data 없으면 간소화 전광판
  if (!hasLiveData) {
    return <SimpleScoreboard game={game} />
  }

  // 최대 표시할 이닝 수 (최소 9이닝)
  const maxInning = Math.max(9, innings.length)
  const inningHeaders = Array.from({ length: maxInning }, (_, i) => i + 1)

  return (
    <div className="bg-dark-900 rounded-xl overflow-hidden border border-dark-600">
      {/* 이닝 헤더 */}
      <div className="flex items-stretch">
        <div className="w-20 sm:w-28 shrink-0" />
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {inningHeaders.map((n) => (
              <div
                key={n}
                className={`w-7 sm:w-8 text-center text-[10px] sm:text-xs font-bold py-1.5 border-l border-dark-700 ${
                  n === currentInning ? 'bg-accent-blue/20 text-accent-blue' : 'text-gray-500'
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 border-l-2 border-dark-500">
          {['R', 'H', 'E'].map((h) => (
            <div key={h} className="w-8 sm:w-10 text-center text-[10px] sm:text-xs font-bold text-gray-400 py-1.5 border-l border-dark-700">
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* 원정팀 */}
      <TeamScoreRow
        team={game.away_team} name={awayName}
        innings={inningHeaders} scores={innings} side="away"
        totals={totals?.away} score={game.away_score}
        isActive={inningHalf === 'Top'} currentInning={currentInning}
      />
      {/* 홈팀 */}
      <TeamScoreRow
        team={game.home_team} name={homeName}
        innings={inningHeaders} scores={innings} side="home"
        totals={totals?.home} score={game.home_score}
        isActive={inningHalf === 'Bottom'} currentInning={currentInning}
      />

      {/* 하단: 다이아몬드 + BSO + 이닝 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-dark-800 border-t border-dark-600">
        <div className="flex items-center gap-2 sm:gap-3">
          <Diamond runners={runners} />
          <div className="text-[10px] sm:text-xs text-gray-400">
            {runners.first || runners.second || runners.third
              ? [runners.first && '1루', runners.second && '2루', runners.third && '3루'].filter(Boolean).join(' · ')
              : '주자 없음'}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <BSOCounter label="B" count={balls} max={3} color="bg-green-500" />
          <BSOCounter label="S" count={strikes} max={2} color="bg-yellow-500" />
          <BSOCounter label="O" count={outs} max={2} color="bg-red-500" />
        </div>
        <div className="text-center">
          <div className="text-base sm:text-lg font-black text-white leading-none">
            {inningHalf === 'Top' ? '▲' : '▼'} {currentInning || '-'}
          </div>
          <div className="text-[9px] sm:text-[10px] text-gray-500">
            {inningHalf === 'Top' ? '초' : '말'}
          </div>
        </div>
      </div>
    </div>
  )
}

// live_data 없을 때의 간소화 전광판
function SimpleScoreboard({ game }) {
  const currentInning = game.current_inning
  const inningHalf = game.inning_half
  const outs = game.outs ?? 0

  return (
    <div className="bg-dark-900 rounded-xl overflow-hidden border border-dark-600">
      {/* 스코어 보드 */}
      <div className="p-4">
        {/* 원정팀 */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-dark-800 rounded-lg mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TeamLogo team={game.away_team} size="md" />
            <span className="text-sm sm:text-base font-bold text-white truncate">
              {getShortName(game.away_team)}
            </span>
            {inningHalf === 'Top' && (
              <span className="text-[9px] text-accent-blue font-bold px-1 py-0.5 bg-accent-blue/10 rounded">공격</span>
            )}
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white tabular-nums ml-3">
            {game.away_score ?? 0}
          </span>
        </div>

        {/* 홈팀 */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-dark-800 rounded-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TeamLogo team={game.home_team} size="md" />
            <span className="text-sm sm:text-base font-bold text-white truncate">
              {getShortName(game.home_team)}
            </span>
            {inningHalf === 'Bottom' && (
              <span className="text-[9px] text-accent-purple font-bold px-1 py-0.5 bg-accent-purple/10 rounded">공격</span>
            )}
          </div>
          <span className="text-3xl sm:text-4xl font-black text-white tabular-nums ml-3">
            {game.home_score ?? 0}
          </span>
        </div>
      </div>

      {/* 하단: 이닝 + 아웃카운트 + 다이아몬드 */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-t border-dark-600">
        {/* 다이아몬드 (데이터 없으면 빈 다이아몬드) */}
        <div className="flex items-center gap-2">
          <Diamond runners={{}} />
          <span className="text-[10px] text-gray-500">주자 정보 대기</span>
        </div>

        {/* 아웃카운트 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-bold">OUT</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < outs ? 'bg-red-500' : 'bg-dark-600'}`} />
            ))}
          </div>
        </div>

        {/* 이닝 */}
        <div className="text-center">
          {currentInning ? (
            <>
              <div className="text-xl font-black text-white leading-none">
                {inningHalf === 'Top' ? '▲' : '▼'} {currentInning}
              </div>
              <div className="text-[9px] text-gray-500">{inningHalf === 'Top' ? '초' : '말'}</div>
            </>
          ) : (
            <div className="text-sm font-bold text-accent-red animate-pulse">LIVE</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamScoreRow({ team, name, innings, scores, side, totals, score, isActive, currentInning }) {
  return (
    <div className={`flex items-stretch border-t border-dark-700 ${isActive ? 'bg-dark-700/40' : ''}`}>
      <div className={`w-20 sm:w-28 shrink-0 flex items-center gap-1.5 px-2 py-1.5 ${isActive ? 'border-l-2 border-accent-blue' : 'border-l-2 border-transparent'}`}>
        <TeamLogo team={team} size="xs" />
        <span className="text-xs sm:text-sm font-bold text-white truncate">{name}</span>
      </div>
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {innings.map((n) => {
            const innData = scores.find(s => s.num === n)
            const val = innData ? innData[side] : null
            const isCurrent = n === currentInning
            return (
              <div
                key={n}
                className={`w-7 sm:w-8 text-center text-xs sm:text-sm py-1.5 border-l border-dark-700 font-medium ${
                  isCurrent ? 'bg-accent-blue/10 text-white font-bold' :
                  val !== null ? 'text-gray-300' : 'text-dark-600'
                }`}
              >
                {val ?? ''}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex shrink-0 border-l-2 border-dark-500">
        <div className="w-8 sm:w-10 text-center text-sm sm:text-base font-black text-white py-1.5 border-l border-dark-700">
          {totals?.runs ?? score ?? 0}
        </div>
        <div className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium text-gray-400 py-1.5 border-l border-dark-700">
          {totals?.hits ?? '-'}
        </div>
        <div className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium text-gray-400 py-1.5 border-l border-dark-700">
          {totals?.errors ?? '-'}
        </div>
      </div>
    </div>
  )
}

// 다이아몬드
function Diamond({ runners = {} }) {
  return (
    <svg viewBox="0 0 44 44" className="w-10 h-10 sm:w-12 sm:h-12">
      <path d="M22 4 L40 22 L22 40 L4 22 Z" fill="none" stroke="#374151" strokeWidth="1.5" />
      <rect x="19" y="37" width="6" height="6" fill="#4B5563" transform="rotate(45 22 40)" />
      <rect x="35" y="17" width="7" height="7" rx="1"
        fill={runners.first ? '#EAB308' : '#1F2937'}
        stroke={runners.first ? '#CA8A04' : '#374151'} strokeWidth="1" />
      <rect x="18.5" y="0" width="7" height="7" rx="1"
        fill={runners.second ? '#EAB308' : '#1F2937'}
        stroke={runners.second ? '#CA8A04' : '#374151'} strokeWidth="1" />
      <rect x="2" y="17" width="7" height="7" rx="1"
        fill={runners.third ? '#EAB308' : '#1F2937'}
        stroke={runners.third ? '#CA8A04' : '#374151'} strokeWidth="1" />
    </svg>
  )
}

function BSOCounter({ label, count, max, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold text-gray-500 w-2.5">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max + 1 }, (_, i) => (
          <div key={i} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${i < count ? color : 'bg-dark-600'}`} />
        ))}
      </div>
    </div>
  )
}

export { Diamond }
