import { useState, useEffect } from 'react'
import { getGames } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LeagueFilter from '../components/LeagueFilter'
import GameRow from '../components/GameRow'

export default function Home() {
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState(null)
  const [dateFilter, setDateFilter] = useState('')
  const [minConfidence, setMinConfidence] = useState('')
  const [page, setPage] = useState(1)
  const { isPremium } = useAuth()

  useEffect(() => {
    setLoading(true)
    const params = { page, per_page: 25 }
    if (league) params.league = league
    if (dateFilter) params.game_date = dateFilter
    if (minConfidence) params.min_confidence = parseInt(minConfidence)

    getGames(params)
      .then((res) => {
        setGames(res.data.games)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [league, dateFilter, minConfidence, page])

  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">경기 예측</h1>
        <p className="text-gray-400 text-sm">
          MLB, NPB, KBO 경기 승부 예측 - 고급 분석 기반
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <LeagueFilter selected={league} onChange={(l) => { setLeague(l); setPage(1) }} />

          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
              className="input-field w-auto text-sm py-2"
            />
            <select
              value={minConfidence}
              onChange={(e) => { setMinConfidence(e.target.value); setPage(1) }}
              className="input-field w-auto text-sm py-2"
            >
              <option value="">신뢰도 전체</option>
              <option value="70">70% 이상</option>
              <option value="50">50% 이상</option>
              <option value="30">30% 이상</option>
            </select>
            {(dateFilter || minConfidence) && (
              <button
                onClick={() => { setDateFilter(''); setMinConfidence(''); setPage(1) }}
                className="text-xs text-gray-400 hover:text-white"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-gray-400 mt-1">전체 경기</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-green">
            {games.filter(g => g.prediction?.confidence_score >= 70).length}
          </div>
          <div className="text-xs text-gray-400 mt-1">강력 추천</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-blue">3</div>
          <div className="text-xs text-gray-400 mt-1">리그</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-purple">
            {isPremium ? '전체' : '제한'}
          </div>
          <div className="text-xs text-gray-400 mt-1">접근 권한</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700/50 border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">날짜</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">리그</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">경기</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">배당</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">승률 예측</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">신뢰도</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">추천</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-blue mr-3"></div>
                      예측 데이터 불러오는 중...
                    </div>
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    선택한 필터에 해당하는 경기가 없습니다
                  </td>
                </tr>
              ) : (
                games.map((game) => <GameRow key={game.id} game={game} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-600">
            <span className="text-sm text-gray-400">
              {page} / {totalPages} 페이지 (총 {total}경기)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                이전
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
