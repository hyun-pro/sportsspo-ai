import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardSummary,
  getDashboardToday,
  getDashboardTopPicks,
  getDashboardRecentResults,
  getLeagueStandings,
} from '../services/api'
import { displayTeamName, getShortName } from '../utils/teamNames'
import LeagueBadge from '../components/LeagueBadge'
import ConfidenceBadge from '../components/ConfidenceBadge'
import TeamBadge, { TeamLogo } from '../components/TeamBadge'
import LiveGames from '../components/LiveGames'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [todayGames, setTodayGames] = useState([])
  const [topPicks, setTopPicks] = useState([])
  const [recentResults, setRecentResults] = useState([])
  const [standings, setStandings] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('KBO')
  const [todaySort, setTodaySort] = useState('time')
  const [todayLeague, setTodayLeague] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardToday(),
      getDashboardTopPicks(),
      getDashboardRecentResults({ limit: 15 }),
    ])
      .then(([sumRes, todayRes, picksRes, recentRes]) => {
        setSummary(sumRes.data)
        setTodayGames(todayRes.data)
        setTopPicks(picksRes.data)
        setRecentResults(recentRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = { sort: todaySort }
    if (todayLeague) params.league = todayLeague
    getDashboardToday(params)
      .then((res) => setTodayGames(res.data))
      .catch(console.error)
  }, [todaySort, todayLeague])

  useEffect(() => {
    getLeagueStandings(selectedLeague)
      .then((res) => setStandings(res.data))
      .catch(console.error)
  }, [selectedLeague])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 via-dark-800 to-accent-blue/10 border border-dark-600 p-5 sm:p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <h1 className="text-xl sm:text-2xl font-black text-white">AI 스포츠 분석</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">MLB · KBO · NPB 실시간 예측 분석 플랫폼</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative">
            <StatCard
              label="오늘 경기"
              value={summary.today_games}
              icon="📊"
              color="text-accent-blue"
            />
            <StatCard
              label="전체 적중률"
              value={`${summary.overall_accuracy}%`}
              sub={`${summary.correct_predictions}/${summary.total_finished}`}
              icon="🎯"
              color="text-accent-green"
            />
            <StatCard
              label="강력추천 적중"
              value={`${summary.high_confidence_accuracy}%`}
              sub={`70%+ (${summary.high_confidence_total}경기)`}
              icon="🔥"
              color="text-accent-yellow"
            />
            <StatCard
              label="총 분석"
              value={summary.total_predictions}
              icon="⚡"
              color="text-accent-purple"
            />
          </div>
        )}
      </div>

      {/* Live Games */}
      <LiveGames />

      {/* League Accuracy + Top Picks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* League Accuracy */}
        {summary && (
          <div className="card p-4 sm:p-5">
            <h2 className="section-title mb-4">리그별 적중률</h2>
            <div className="space-y-3">
              {['MLB', 'NPB', 'KBO'].map((league) => {
                const la = summary.league_accuracy?.[league]
                const pct = la?.accuracy || 0
                return (
                  <div key={league} className="flex items-center gap-3">
                    <LeagueBadge league={league} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{pct}%</span>
                        <span className="text-[10px] text-gray-500">{la?.correct || 0}/{la?.total || 0}</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            pct >= 65 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-yellow' : 'bg-accent-red'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Picks */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-dark-600 flex items-center justify-between">
            <h2 className="section-title">TOP 추천</h2>
            <span className="text-[10px] text-gray-500">신뢰도 60%+</span>
          </div>
          <div className="divide-y divide-dark-700">
            {topPicks.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">추천 경기 없음</div>
            ) : (
              topPicks.slice(0, 5).map((g) => (
                <Link key={g.id} to={`/game/${g.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-dark-700/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <LeagueBadge league={g.league} />
                    <div className="flex items-center gap-1 text-xs">
                      <TeamBadge team={g.home_team} size="sm" />
                      <span className="text-gray-600">vs</span>
                      <TeamBadge team={g.away_team} size="sm" />
                    </div>
                  </div>
                  <ConfidenceBadge score={g.prediction?.confidence_score} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-dark-600 flex items-center justify-between">
          <h2 className="section-title">최근 결과</h2>
          <Link to="/live" className="text-[10px] text-accent-blue hover:text-blue-400">전체보기</Link>
        </div>
        <div className="divide-y divide-dark-700/50">
          {recentResults.slice(0, 8).map((g) => {
            const homeWin = g.home_score > g.away_score
            return (
              <Link key={g.id} to={`/game/${g.id}`}
                className="block px-3 sm:px-4 py-2.5 hover:bg-dark-700/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    g.is_correct === true ? 'bg-accent-green' : g.is_correct === false ? 'bg-accent-red' : 'bg-gray-600'
                  }`} />
                  <LeagueBadge league={g.league} />
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <TeamLogo team={g.home_team} size="xs" />
                    <span className={`text-xs font-bold truncate ${homeWin ? 'text-white' : 'text-gray-500'}`}>
                      {getShortName(g.home_team)}
                    </span>
                    <span className="text-[10px] text-gray-600 shrink-0">{g.home_score}-{g.away_score}</span>
                    <span className={`text-xs font-bold truncate ${!homeWin ? 'text-white' : 'text-gray-500'}`}>
                      {getShortName(g.away_team)}
                    </span>
                    <TeamLogo team={g.away_team} size="xs" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    g.is_correct === true ? 'bg-accent-green/10 text-accent-green' :
                    g.is_correct === false ? 'bg-accent-red/10 text-accent-red' : 'text-gray-600'
                  }`}>
                    {g.is_correct === true ? 'HIT' : g.is_correct === false ? 'MISS' : '-'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Today's Games + Standings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Today's Games - 2/3 width */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="section-title">오늘의 경기 ({todayGames.length})</h2>
            <div className="flex items-center gap-1 flex-wrap">
              {['', 'KBO', 'MLB', 'NPB'].map((l) => (
                <button key={l} onClick={() => setTodayLeague(l)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ripple-effect ${
                    todayLeague === l ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-500 hover:text-white'
                  }`}>{l || '전체'}</button>
              ))}
              <span className="text-dark-600 mx-0.5">|</span>
              {[
                { key: 'time', label: '시간' },
                { key: 'confidence', label: '신뢰도' },
                { key: 'pick', label: '추천' },
              ].map((s) => (
                <button key={s.key} onClick={() => setTodaySort(s.key)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                    todaySort === s.key ? 'bg-accent-green/20 text-accent-green' : 'bg-dark-700 text-gray-500 hover:text-white'
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-dark-700/50 max-h-[400px] overflow-y-auto scrollbar-hide">
            {todayGames.length === 0 ? (
              <div className="py-12 text-center text-gray-600 text-sm">경기 없음</div>
            ) : (
              todayGames.map((g) => {
                const pred = g.prediction
                const pickHome = pred?.recommended_pick === 'home'
                return (
                  <Link key={g.id} to={`/game/${g.id}`}
                    className="block px-3 sm:px-4 py-2.5 hover:bg-dark-700/30 transition-colors">
                    {/* 1줄: 시간 + 리그 + 팀 vs 팀 + 스코어 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-8 shrink-0">{g.game_time || '--:--'}</span>
                      <LeagueBadge league={g.league} />
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <TeamLogo team={g.home_team} size="xs" />
                        <span className="text-xs font-bold text-gray-200 truncate">{getShortName(g.home_team)}</span>
                        <span className="text-[10px] text-gray-600 shrink-0">
                          {g.status === 'final' ? `${g.home_score}-${g.away_score}` : 'vs'}
                        </span>
                        <span className="text-xs font-bold text-gray-200 truncate">{getShortName(g.away_team)}</span>
                        <TeamLogo team={g.away_team} size="xs" />
                      </div>
                    </div>
                    {/* 2줄: AI 예측 */}
                    {pred && (
                      <div className="flex items-center gap-2 mt-1 ml-8 sm:ml-10">
                        <span className={`text-[10px] font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
                          AI {pickHome ? getShortName(g.home_team) : getShortName(g.away_team)} {Math.max(pred.home_win_probability, pred.away_win_probability)}%
                        </span>
                        <ConfidenceBadge score={pred.confidence_score} size="sm" />
                      </div>
                    )}
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Standings - 1/3 width */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-600 flex items-center justify-between">
            <h2 className="section-title">순위</h2>
            <div className="flex gap-1">
              {['KBO', 'MLB', 'NPB'].map((l) => (
                <button key={l} onClick={() => setSelectedLeague(l)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                    selectedLeague === l ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-500 hover:text-white'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {standings.map((t, i) => (
              <div key={t.team_name} className={`flex items-center gap-2 px-4 py-2 border-b border-dark-700/30 ${
                i < 3 ? 'bg-dark-700/20' : ''
              }`}>
                <span className={`w-5 text-xs font-black text-center ${
                  i === 0 ? 'text-accent-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                }`}>{t.rank}</span>
                <TeamLogo team={t.team_name} size="xs" />
                <span className="text-xs font-bold text-gray-200 flex-1 truncate">{getShortName(t.team_name)}</span>
                <span className="text-[10px] text-gray-500">{t.wins}W {t.losses}L</span>
                <span className="text-xs font-bold text-white w-12 text-right">{(t.win_rate * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-dark-700/50 rounded-xl p-3 sm:p-4 border border-dark-600/50 hover:border-dark-500 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`stat-value text-xl sm:text-2xl ${color}`}>{value}</div>
      <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[9px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}
