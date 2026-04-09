import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardSummary,
  getDashboardToday,
  getDashboardTopPicks,
  getDashboardRecentResults,
  getLeagueStandings,
} from '../services/api'
import { displayTeamName } from '../utils/teamNames'
import LeagueBadge from '../components/LeagueBadge'
import ConfidenceBadge from '../components/ConfidenceBadge'
import TeamBadge from '../components/TeamBadge'
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">AI 스포츠 예측 분석 현황</p>
      </div>

      {/* Live Games - 실시간 경기 */}
      <LiveGames />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <SummaryCard
            label="오늘 경기"
            value={summary.today_games}
            sub={`M${summary.league_today?.MLB || 0} N${summary.league_today?.NPB || 0} K${summary.league_today?.KBO || 0}`}
            color="text-accent-blue"
          />
          <SummaryCard
            label="전체 적중률"
            value={`${summary.overall_accuracy}%`}
            sub={`${summary.correct_predictions}/${summary.total_finished} 경기`}
            color="text-accent-green"
          />
          <SummaryCard
            label="강력 추천 적중률"
            value={`${summary.high_confidence_accuracy}%`}
            sub={`신뢰도 70%+ (${summary.high_confidence_total}경기)`}
            color="text-accent-yellow"
          />
          <SummaryCard
            label="총 예측"
            value={summary.total_predictions}
            sub="누적 분석 경기 수"
            color="text-accent-purple"
          />
        </div>
      )}

      {/* League Accuracy */}
      {summary && (
        <div className="card p-3 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 sm:mb-4">리그별 적중률</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {['MLB', 'NPB', 'KBO'].map((league) => {
              const la = summary.league_accuracy?.[league]
              return (
                <div key={league} className="bg-dark-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <LeagueBadge league={league} />
                    <span className="text-xs text-gray-400">{la?.total || 0}경기</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {la?.accuracy || 0}%
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (la?.accuracy || 0) >= 65 ? 'bg-accent-green' :
                        (la?.accuracy || 0) >= 50 ? 'bg-accent-yellow' : 'bg-accent-red'
                      }`}
                      style={{ width: `${Math.min(100, la?.accuracy || 0)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {la?.correct || 0}승 / {(la?.total || 0) - (la?.correct || 0)}패
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Picks */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-600 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">TOP 추천 경기</h2>
            <span className="text-xs text-gray-400">신뢰도 60%+</span>
          </div>
          <div className="divide-y divide-dark-700">
            {topPicks.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500">추천 경기 없음</div>
            ) : (
              topPicks.slice(0, 5).map((g) => (
                <Link key={g.id} to={`/game/${g.id}`} className="block px-5 py-3 hover:bg-dark-700/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LeagueBadge league={g.league} />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-white font-medium flex-wrap">
                          <TeamBadge team={g.home_team} />
                          <span className="text-gray-500">vs</span>
                          <TeamBadge team={g.away_team} />
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {g.game_date} {g.game_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${
                          g.prediction?.recommended_pick === 'home' ? 'text-accent-blue' : 'text-accent-purple'
                        }`}>
                          <TeamBadge team={g.prediction?.recommended_pick === 'home' ? g.home_team : g.away_team} size="sm" /> 승
                        </div>
                        <div className="text-xs text-gray-400">
                          {g.prediction?.recommended_pick === 'home'
                            ? g.prediction?.home_win_probability
                            : g.prediction?.away_win_probability}%
                        </div>
                      </div>
                      <ConfidenceBadge score={g.prediction?.confidence_score} size="sm" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-600 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">최근 예측 결과</h2>
            <Link to="/" className="text-xs text-accent-blue hover:text-blue-400">전체보기</Link>
          </div>
          <div className="divide-y divide-dark-700">
            {recentResults.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500">결과 없음</div>
            ) : (
              recentResults.slice(0, 8).map((g) => (
                <Link key={g.id} to={`/game/${g.id}`} className="block px-5 py-3 hover:bg-dark-700/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        g.is_correct === true ? 'bg-accent-green' :
                        g.is_correct === false ? 'bg-accent-red' : 'bg-gray-500'
                      }`} />
                      <LeagueBadge league={g.league} />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm flex-wrap">
                          <span className={g.home_score > g.away_score ? 'ring-1 ring-accent-green/40 rounded' : ''}>
                            <TeamBadge team={g.home_team} />
                          </span>
                          <span className="text-gray-500 text-xs">
                            {g.home_score} - {g.away_score}
                          </span>
                          <span className={g.away_score > g.home_score ? 'ring-1 ring-accent-green/40 rounded' : ''}>
                            <TeamBadge team={g.away_team} />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        g.is_correct === true
                          ? 'bg-accent-green/15 text-accent-green'
                          : g.is_correct === false
                          ? 'bg-accent-red/15 text-accent-red'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {g.is_correct === true ? 'HIT' : g.is_correct === false ? 'MISS' : '-'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Today's Games Table */}
      <div className="card overflow-hidden">
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-dark-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-200">
            오늘의 경기 ({todayGames.length})
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* 리그 필터 */}
            {['', 'KBO', 'MLB', 'NPB'].map((l) => (
              <button
                key={l}
                onClick={() => setTodayLeague(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                  todayLeague === l
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {l || '전체'}
              </button>
            ))}
            <span className="text-dark-600 mx-1">|</span>
            {/* 정렬 */}
            {[
              { key: 'time', label: '시간순' },
              { key: 'confidence', label: '신뢰도순' },
              { key: 'pick', label: '추천순' },
              { key: 'league', label: '리그별' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setTodaySort(s.key)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                  todaySort === s.key
                    ? 'bg-accent-green text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700/50 border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">시간</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">리그</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">홈</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">VS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">원정</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">투수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">예측</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">신뢰도</th>
              </tr>
            </thead>
            <tbody>
              {todayGames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">오늘 예정된 경기가 없습니다</td>
                </tr>
              ) : (
                todayGames.map((g) => {
                  const pred = g.prediction
                  const pickHome = pred?.recommended_pick === 'home'
                  return (
                    <tr key={g.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">{g.game_time || '--:--'}</span>
                        {g.status === 'live' && (
                          <span className="ml-2 text-xs font-bold text-accent-red animate-pulse">LIVE</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><LeagueBadge league={g.league} /></td>
                      <td className="px-4 py-3">
                        <div className={pickHome ? 'ring-1 ring-accent-blue/40 rounded inline-block' : 'inline-block'}>
                          <TeamBadge team={g.home_team} showFull />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {g.status === 'final'
                          ? `${g.home_score} - ${g.away_score}`
                          : 'vs'}
                      </td>
                      <td className="px-4 py-3">
                        <div className={!pickHome ? 'ring-1 ring-accent-purple/40 rounded inline-block' : 'inline-block'}>
                          <TeamBadge team={g.away_team} showFull />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs text-gray-400">
                          {g.home_pitcher || '?'} vs {g.away_pitcher || '?'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred ? (
                          <span className={`text-sm font-bold ${pickHome ? 'text-accent-blue' : 'text-accent-purple'}`}>
                            {pred.home_win_probability}% - {pred.away_win_probability}%
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred ? <ConfidenceBadge score={pred.confidence_score} size="sm" /> : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* League Standings */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-600 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-200">리그 순위</h2>
          <div className="flex gap-2">
            {['KBO', 'MLB', 'NPB'].map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLeague(l)}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  selectedLeague === l
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700/50 border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">팀</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">경기</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">승</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">패</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">승률</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">ELO</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">득점</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">실점</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase hidden lg:table-cell">득실차</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">연승</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.team_name} className={`border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors ${
                  i < 3 ? 'bg-dark-700/20' : ''
                }`}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${
                      i === 0 ? 'text-accent-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>{t.rank}</span>
                  </td>
                  <td className="px-4 py-3">
                    <TeamBadge team={t.team_name} showFull />
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300">{t.games_played}</td>
                  <td className="px-4 py-3 text-center text-sm text-accent-green font-medium">{t.wins}</td>
                  <td className="px-4 py-3 text-center text-sm text-accent-red font-medium">{t.losses}</td>
                  <td className="px-4 py-3 text-center text-sm text-white font-bold">
                    {(t.win_rate * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300 hidden sm:table-cell">{t.elo_rating}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300 hidden md:table-cell">{t.avg_runs_scored}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300 hidden md:table-cell">{t.avg_runs_allowed}</td>
                  <td className="px-4 py-3 text-center text-sm hidden lg:table-cell">
                    <span className={t.run_differential > 0 ? 'text-accent-green' : t.run_differential < 0 ? 'text-accent-red' : 'text-gray-400'}>
                      {t.run_differential > 0 ? '+' : ''}{t.run_differential}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {t.streak > 0 ? (
                      <span className="text-accent-green font-medium">{t.streak}W</span>
                    ) : t.streak < 0 ? (
                      <span className="text-accent-red font-medium">{Math.abs(t.streak)}L</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="card p-3 sm:p-5">
      <div className={`text-xl sm:text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs sm:text-sm text-gray-200 mt-0.5 sm:mt-1 font-medium">{label}</div>
      <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{sub}</div>
    </div>
  )
}
