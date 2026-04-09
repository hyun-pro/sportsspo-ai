import { useState, useEffect } from 'react'
import { getLeagueStandings, getPitchers } from '../services/api'
import { TeamLogo } from '../components/TeamBadge'
import { getShortName } from '../utils/teamNames'

export default function Rankings() {
  const [league, setLeague] = useState('KBO')
  const [tab, setTab] = useState('team')
  const [standings, setStandings] = useState([])
  const [pitchers, setPitchers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (tab === 'team') {
      getLeagueStandings(league).then(res => setStandings(res.data)).catch(() => {}).finally(() => setLoading(false))
    } else {
      getPitchers({ league }).then(res => setPitchers(res.data?.pitchers || res.data || [])).catch(() => setPitchers([])).finally(() => setLoading(false))
    }
  }, [league, tab])

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white">랭킹</h1>

      {/* 탭 */}
      <div className="flex gap-2">
        {['team', 'pitcher'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === t ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}>
            {t === 'team' ? '팀 순위' : '투수 랭킹'}
          </button>
        ))}
      </div>

      {/* 리그 필터 */}
      <div className="flex gap-1.5">
        {['KBO', 'MLB', 'NPB'].map(l => (
          <button key={l} onClick={() => setLeague(l)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
              league === l ? 'bg-accent-green/20 text-accent-green' : 'bg-dark-700 text-gray-500 hover:text-white'
            }`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
      ) : tab === 'team' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700/50 border-b border-dark-600">
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500">팀</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">경기</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">승</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">패</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">승률</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 hidden sm:table-cell">ELO</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 hidden sm:table-cell">연승</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.team_name} className={`border-b border-dark-700/30 hover:bg-dark-700/20 ${i < 3 ? 'bg-dark-700/10' : ''}`}>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-black ${i === 0 ? 'text-accent-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>{t.rank}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <TeamLogo team={t.team_name} size="sm" />
                        <span className="text-sm font-bold text-white">{getShortName(t.team_name)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400">{t.games_played}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-accent-green font-bold">{t.wins}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-accent-red font-bold">{t.losses}</td>
                    <td className="px-3 py-2.5 text-center text-sm font-black text-white">{(t.win_rate * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400 hidden sm:table-cell">{t.elo_rating}</td>
                    <td className="px-3 py-2.5 text-center text-xs hidden sm:table-cell">
                      {t.streak > 0 ? <span className="text-accent-green font-bold">{t.streak}W</span> :
                       t.streak < 0 ? <span className="text-accent-red font-bold">{Math.abs(t.streak)}L</span> :
                       <span className="text-gray-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700/50 border-b border-dark-600">
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500">투수</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 hidden sm:table-cell">팀</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">ERA</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">WHIP</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500">성적</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 hidden sm:table-cell">이닝</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-500 hidden sm:table-cell">K</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.sort((a, b) => a.era - b.era).slice(0, 20).map((p, i) => (
                  <tr key={p.name + p.team} className="border-b border-dark-700/30 hover:bg-dark-700/20">
                    <td className="px-3 py-2.5 text-xs text-gray-600">{i + 1}</td>
                    <td className="px-3 py-2.5 text-sm font-bold text-white">{p.name}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{getShortName(p.team)}</td>
                    <td className="px-3 py-2.5 text-center text-sm font-black text-accent-blue">{p.era.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-300">{p.whip.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400">{p.wins}W {p.losses}L</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400 hidden sm:table-cell">{p.innings_pitched.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-400 hidden sm:table-cell">{p.strikeouts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
