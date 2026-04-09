import { useState, useEffect } from 'react'
import { getDashboardSummary, getDashboardRecentResults } from '../services/api'
import { TeamLogo } from '../components/TeamBadge'
import { getShortName } from '../utils/teamNames'
import LeagueBadge from '../components/LeagueBadge'

export default function Stats() {
  const [summary, setSummary] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardRecentResults({ limit: 50 }),
    ]).then(([sumRes, resRes]) => {
      setSummary(sumRes.data)
      setResults(resRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>

  const hits = results.filter(r => r.is_correct === true).length
  const misses = results.filter(r => r.is_correct === false).length
  const total = hits + misses
  const hitRate = total > 0 ? Math.round(hits / total * 1000) / 10 : 0

  // 연속 적중/미적중 계산
  let streak = 0, streakType = ''
  for (const r of results) {
    if (r.is_correct === null) continue
    if (streak === 0) { streakType = r.is_correct ? 'hit' : 'miss'; streak = 1 }
    else if ((r.is_correct && streakType === 'hit') || (!r.is_correct && streakType === 'miss')) streak++
    else break
  }

  // 리그별 통계
  const byLeague = {}
  results.forEach(r => {
    if (r.is_correct === null) return
    if (!byLeague[r.league]) byLeague[r.league] = { hits: 0, total: 0 }
    byLeague[r.league].total++
    if (r.is_correct) byLeague[r.league].hits++
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white">적중 통계</h1>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="🎯" label="전체 적중률" value={`${summary?.overall_accuracy || hitRate}%`} color="text-accent-green" />
        <StatCard icon="🔥" label="강력추천 적중" value={`${summary?.high_confidence_accuracy || 0}%`} sub={`70%+ (${summary?.high_confidence_total || 0}경기)`} color="text-accent-yellow" />
        <StatCard icon="📊" label="분석 경기" value={`${total}`} sub={`${hits}적중 / ${misses}미적중`} color="text-accent-blue" />
        <StatCard icon={streakType === 'hit' ? '🏆' : '📉'} label="현재 연속" value={`${streak}${streakType === 'hit' ? '연적중' : '연미적중'}`} color={streakType === 'hit' ? 'text-accent-green' : 'text-accent-red'} />
      </div>

      {/* 리그별 적중률 */}
      <div className="card p-4">
        <h2 className="section-title mb-3">리그별 적중률</h2>
        <div className="space-y-3">
          {Object.entries(byLeague).map(([league, data]) => {
            const pct = data.total > 0 ? Math.round(data.hits / data.total * 1000) / 10 : 0
            return (
              <div key={league} className="flex items-center gap-3">
                <LeagueBadge league={league} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-white">{pct}%</span>
                    <span className="text-[10px] text-gray-500">{data.hits}/{data.total}</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-700 ${pct >= 65 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                      style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 최근 결과 리스트 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-600">
          <h2 className="section-title">최근 {total}경기 결과</h2>
        </div>
        <div className="divide-y divide-dark-700/30 max-h-[400px] overflow-y-auto scrollbar-hide">
          {results.map(r => {
            if (r.is_correct === null) return null
            const homeWin = r.home_score > r.away_score
            return (
              <div key={r.id} className="flex items-center gap-2 px-3 py-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.is_correct ? 'bg-accent-green' : 'bg-accent-red'}`} />
                <LeagueBadge league={r.league} />
                <TeamLogo team={r.home_team} size="xs" />
                <span className={`text-xs truncate ${homeWin ? 'font-bold text-white' : 'text-gray-500'}`}>{getShortName(r.home_team)}</span>
                <span className="text-[10px] text-gray-600 shrink-0">{r.home_score}-{r.away_score}</span>
                <span className={`text-xs truncate ${!homeWin ? 'font-bold text-white' : 'text-gray-500'}`}>{getShortName(r.away_team)}</span>
                <TeamLogo team={r.away_team} size="xs" />
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ml-auto shrink-0 ${r.is_correct ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                  {r.is_correct ? 'HIT' : 'MISS'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="card p-3 sm:p-4">
      <span className="text-lg">{icon}</span>
      <div className={`text-xl sm:text-2xl font-black mt-1 ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[9px] text-gray-600">{sub}</div>}
    </div>
  )
}
