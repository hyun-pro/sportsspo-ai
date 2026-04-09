import { useState, useEffect, useRef } from 'react'
import { getPlayByPlay } from '../services/api'

export default function PlayByPlay({ gameId, isLive }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const fetch = () => {
    getPlayByPlay(gameId)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch()
    if (isLive) {
      intervalRef.current = setInterval(fetch, 15000) // 15초마다 갱신
      return () => clearInterval(intervalRef.current)
    }
  }, [gameId, isLive])

  if (loading) return <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-accent-blue"></div></div>
  if (!data?.supported) return <div className="text-center py-4 text-xs text-gray-600">{data?.message || '문자중계를 지원하지 않는 경기입니다'}</div>
  if (!data?.plays?.length) return <div className="text-center py-4 text-xs text-gray-600">아직 경기 데이터가 없습니다</div>

  return (
    <div className="space-y-3">
      {/* 현재 타석 (라이브) */}
      {data.current && isLive && (
        <CurrentAtBat current={data.current} />
      )}

      {/* 플레이 기록 */}
      <div className="space-y-1">
        {data.plays.map((play, i) => (
          <PlayItem key={i} play={play} isLatest={i === 0} />
        ))}
      </div>

      <div className="text-center text-[9px] text-gray-700 pt-2">
        총 {data.totalPlays}개 플레이 중 최근 20개 표시
      </div>
    </div>
  )
}

// 현재 진행중인 타석
function CurrentAtBat({ current }) {
  return (
    <div className="card p-3 border-accent-red/30 bg-accent-red/5 animate-pulse-slow">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-xs font-bold text-accent-red">현재 타석</span>
        <span className="text-[10px] text-gray-400">{current.inning}회 {current.halfInning}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-white">타자: {current.batter}</div>
          <div className="text-[10px] text-gray-500">투수: {current.pitcher}</div>
        </div>
        {/* 카운트 */}
        <div className="flex items-center gap-3">
          <CountDots label="B" count={current.count?.balls || 0} max={3} color="bg-green-500" />
          <CountDots label="S" count={current.count?.strikes || 0} max={2} color="bg-yellow-500" />
          <CountDots label="O" count={current.count?.outs || 0} max={2} color="bg-red-500" />
        </div>
      </div>

      {/* 투구 기록 */}
      {current.events?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {current.events.map((e, i) => (
            <PitchBadge key={i} event={e} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// 완료된 플레이 아이템
function PlayItem({ play, isLatest }) {
  const [expanded, setExpanded] = useState(false)

  // 결과 아이콘
  const getIcon = () => {
    const desc = play.result?.toLowerCase() || ''
    if (desc.includes('home run') || desc.includes('homer')) return '💣'
    if (desc.includes('double') || desc.includes('triple')) return '🔥'
    if (desc.includes('single') || desc.includes('singles')) return '🏏'
    if (desc.includes('walks') || desc.includes('walk')) return '🚶'
    if (desc.includes('strikes out') || desc.includes('strikeout')) return '🫥'
    if (desc.includes('grounds out') || desc.includes('flies out') || desc.includes('lines out') || desc.includes('pops out')) return '❌'
    if (desc.includes('error')) return '⚠️'
    if (desc.includes('sacrifice')) return '🎯'
    if (desc.includes('hit by pitch')) return '😤'
    if (desc.includes('stolen')) return '💨'
    return '⚾'
  }

  // 결과 색상
  const getColor = () => {
    const desc = play.result?.toLowerCase() || ''
    if (desc.includes('home run') || desc.includes('homer')) return 'border-accent-yellow/40 bg-accent-yellow/5'
    if (desc.includes('double') || desc.includes('triple') || desc.includes('single')) return 'border-accent-green/30 bg-accent-green/5'
    if (desc.includes('strikes out')) return 'border-dark-600'
    if (play.rbi > 0) return 'border-accent-blue/30 bg-accent-blue/5'
    return 'border-dark-600'
  }

  return (
    <div
      className={`card p-2.5 cursor-pointer transition-all hover:bg-dark-700/30 ${getColor()} ${isLatest ? 'ring-1 ring-accent-blue/20' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold text-gray-500 bg-dark-700 px-1.5 py-0.5 rounded">{play.inning}회 {play.halfInning}</span>
            <span className="text-xs font-bold text-gray-200 truncate">{play.batter}</span>
            {play.rbi > 0 && <span className="text-[8px] font-bold text-accent-blue bg-accent-blue/10 px-1 py-0.5 rounded">RBI {play.rbi}</span>}
          </div>
          <div className="text-[11px] text-gray-400 leading-relaxed">{play.result}</div>
          {play.homeScore !== undefined && (
            <div className="text-[9px] text-gray-600 mt-0.5">스코어: 원정 {play.awayScore} - 홈 {play.homeScore}</div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] text-gray-600">
            {play.count?.balls}B-{play.count?.strikes}S {play.count?.outs}O
          </div>
          {play.events?.length > 0 && (
            <svg className={`w-3 h-3 text-gray-600 mx-auto mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* 투구 상세 */}
      {expanded && play.events?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dark-700/50 space-y-1 animate-fade-in">
          {play.events.map((e, i) => (
            <PitchRow key={i} event={e} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// 투구 한 개 행
function PitchRow({ event, index }) {
  if (event.type !== 'pitch') return null

  const getBg = () => {
    if (event.isInPlay) return 'bg-accent-blue/10 text-accent-blue'
    if (event.isStrike) return 'bg-accent-yellow/10 text-accent-yellow'
    if (event.isBall) return 'bg-green-900/20 text-green-400'
    return 'text-gray-500'
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${getBg()}`}>
      <span className="text-[9px] font-bold w-4 text-center text-gray-600">{index}</span>
      <span className="text-[10px] font-bold w-16 shrink-0">
        {event.isStrike ? '스트라이크' : event.isBall ? '볼' : event.isInPlay ? '인플레이' : event.description}
      </span>
      {event.pitchType && <span className="text-[9px] text-gray-500">{event.pitchType}</span>}
      {event.speed && <span className="text-[9px] text-gray-600">{Math.round(event.speed)}mph</span>}
      <span className="text-[9px] text-gray-700 ml-auto">
        {event.count?.balls}B-{event.count?.strikes}S
      </span>
    </div>
  )
}

// 투구 뱃지 (현재 타석용)
function PitchBadge({ event, index }) {
  if (event.type !== 'pitch') return null
  const color = event.isStrike ? 'bg-yellow-600' : event.isBall ? 'bg-green-600' : event.isInPlay ? 'bg-accent-blue' : 'bg-gray-600'
  const label = event.code === 'S' ? 'S' : event.code === 'B' ? 'B' : event.code === 'F' ? 'F' : event.code === 'X' ? 'X' : event.code || '?'

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black text-white ${color}`}
      title={`${index}구: ${event.description || ''} ${event.pitchType || ''} ${event.speed ? Math.round(event.speed) + 'mph' : ''}`}>
      {label}
    </span>
  )
}

function CountDots({ label, count, max, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-bold text-gray-600 w-2">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max + 1 }, (_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < count ? color : 'bg-dark-600'}`} />
        ))}
      </div>
    </div>
  )
}
