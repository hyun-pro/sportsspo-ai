import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, createPost, searchGames } from '../services/api'
import { useAuth } from '../context/AuthContext'
import UserBadge from '../components/UserBadge'

export default function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showWrite, setShowWrite] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPosts = () => {
    getPosts({ page }).then(res => {
      setPosts(res.data.posts)
      setTotal(res.data.total)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [page])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">커뮤니티</h1>
          <p className="text-xs text-gray-500 mt-0.5">예측 공유 · 베팅 기록 · 자유 토론</p>
        </div>
        {user && (
          <button onClick={() => setShowWrite(!showWrite)} className="btn-primary text-sm py-2 px-4">
            글쓰기
          </button>
        )}
      </div>

      {showWrite && <WritePost onDone={() => { setShowWrite(false); fetchPosts() }} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-600">아직 작성된 글이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <Link key={p.id} to={`/community/${p.id}`} className="card-interactive block p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                  {p.bet_odds && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {p.game_league && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue rounded">{p.game_league}</span>}
                      {p.game_teams && <span className="text-[10px] text-gray-400">{p.game_teams}</span>}
                      <span className="text-[10px] text-gray-500">배당 {p.bet_odds}</span>
                      {p.bet_amount && <span className="text-[10px] text-gray-500">{p.bet_amount.toLocaleString()}원</span>}
                      {p.bet_result === 'win' && <span className="text-[9px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded">적중</span>}
                      {p.bet_result === 'lose' && <span className="text-[9px] font-bold text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded">미적중</span>}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-gray-500">{new Date(p.created_at).toLocaleDateString('ko-KR')}</div>
                  <div className="text-[10px] text-gray-600">{new Date(p.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-700/50">
                <UserBadge nickname={p.nickname} plan={p.plan} />
                <span className="text-[10px] text-gray-600">댓글 {p.comment_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-xs py-1 px-3 disabled:opacity-30">이전</button>
          <span className="text-xs text-gray-500 self-center">{page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="btn-secondary text-xs py-1 px-3 disabled:opacity-30">다음</button>
        </div>
      )}
    </div>
  )
}

function WritePost({ onDone }) {
  const [form, setForm] = useState({ title: '', content: '', game_league: '', game_teams: '', bet_odds: '', bet_amount: '', bet_profit: '', bet_result: '' })
  const [loading, setLoading] = useState(false)
  const [showBet, setShowBet] = useState(false)
  const [gameSearch, setGameSearch] = useState('')
  const [gameResults, setGameResults] = useState([])
  const [showGameList, setShowGameList] = useState(false)

  // 경기 검색
  const doSearch = async (q) => {
    setGameSearch(q)
    if (q.length < 1) {
      // 검색어 없으면 오늘 경기 목록
      try { const res = await searchGames({}); setGameResults(res.data); setShowGameList(true) } catch {}
      return
    }
    try { const res = await searchGames({ q }); setGameResults(res.data); setShowGameList(true) } catch {}
  }

  const selectGame = (g) => {
    setForm(f => ({ ...f, game_league: g.league, game_teams: `${g.home_team} vs ${g.away_team}` }))
    setGameSearch(`${g.league} | ${g.home_team} vs ${g.away_team}`)
    setShowGameList(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createPost({ ...form, bet_odds: form.bet_odds ? parseFloat(form.bet_odds) : null, bet_amount: form.bet_amount ? parseInt(form.bet_amount) : null, bet_profit: form.bet_profit ? parseInt(form.bet_profit) : null, bet_result: form.bet_result || null })
      onDone()
    } catch (err) {
      alert(err.response?.data?.detail || '작성 실패')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 animate-slide-up">
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="input-field" placeholder="제목" required />
      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        className="input-field min-h-[80px]" placeholder="내용을 입력하세요" required />

      <button type="button" onClick={() => { setShowBet(!showBet); if (!showBet) doSearch('') }}
        className="text-xs text-accent-blue hover:text-blue-400">
        {showBet ? '베팅 정보 숨기기' : '+ 베팅 기록 추가'}
      </button>

      {showBet && (
        <div className="p-3 bg-dark-700/50 rounded-xl space-y-2">
          {/* 경기 검색/선택 */}
          <div className="relative">
            <label className="text-[10px] text-gray-500 mb-1 block">경기 선택 (검색하거나 목록에서 선택)</label>
            <input value={gameSearch} onChange={e => doSearch(e.target.value)}
              onFocus={() => doSearch(gameSearch)}
              className="input-field text-xs py-1.5" placeholder="팀명 또는 리그로 검색..." />
            {showGameList && gameResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-500 rounded-xl max-h-48 overflow-y-auto scrollbar-hide shadow-card-hover">
                {gameResults.map(g => (
                  <button key={g.id} type="button" onClick={() => selectGame(g)}
                    className="w-full text-left px-3 py-2 hover:bg-dark-600 transition-colors border-b border-dark-700/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-dark-600 text-gray-400">{g.league}</span>
                      <span className="text-xs text-gray-200 truncate">{g.home_team} vs {g.away_team}</span>
                      {g.status === 'final' && <span className="text-[9px] text-gray-500 ml-auto">{g.home_score}-{g.away_score}</span>}
                    </div>
                    <div className="text-[9px] text-gray-600 mt-0.5">{g.game_date} {g.game_time || ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 경기 표시 */}
          {form.game_teams && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue text-[9px]">{form.game_league}</span>
              <span className="text-gray-300">{form.game_teams}</span>
              <button type="button" onClick={() => { setForm(f => ({ ...f, game_league: '', game_teams: '' })); setGameSearch('') }}
                className="text-gray-600 hover:text-accent-red text-[10px] ml-auto">취소</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input value={form.bet_odds} onChange={e => setForm(f => ({ ...f, bet_odds: e.target.value }))}
              className="input-field text-xs py-1.5" placeholder="배당률 (배트맨 기준)" type="number" step="0.01" />
            <input value={form.bet_amount} onChange={e => setForm(f => ({ ...f, bet_amount: e.target.value }))}
              className="input-field text-xs py-1.5" placeholder="베팅 금액 (원)" type="number" />
            <input value={form.bet_profit} onChange={e => setForm(f => ({ ...f, bet_profit: e.target.value }))}
              className="input-field text-xs py-1.5" placeholder="수익 금액 (원)" type="number" />
            <select value={form.bet_result} onChange={e => setForm(f => ({ ...f, bet_result: e.target.value }))}
              className="input-field text-xs py-1.5">
              <option value="">결과 선택</option>
              <option value="win">적중</option><option value="lose">미적중</option><option value="pending">진행중</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm py-2 flex-1 disabled:opacity-50">
          {loading ? '작성중...' : '게시'}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary text-sm py-2 px-4">취소</button>
      </div>
    </form>
  )
}
