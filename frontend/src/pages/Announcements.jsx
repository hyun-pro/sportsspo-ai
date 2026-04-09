import { useState, useEffect } from 'react'
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/api'
import { useAuth } from '../context/AuthContext'

const CATEGORY_MAP = {
  notice: { label: '공지', color: 'bg-accent-blue/15 text-accent-blue' },
  update: { label: '업데이트', color: 'bg-accent-green/15 text-accent-green' },
  event: { label: '이벤트', color: 'bg-accent-purple/15 text-accent-purple' },
  maintenance: { label: '점검', color: 'bg-accent-yellow/15 text-accent-yellow' },
}

export default function Announcements() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [showWrite, setShowWrite] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    getAnnouncements().then(res => setPosts(res.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteAnnouncement(id)
    fetch()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">공지사항</h1>
          <p className="text-xs text-gray-500 mt-0.5">서비스 소식 · 업데이트 · 이벤트</p>
        </div>
        {user?.is_admin && (
          <button onClick={() => setShowWrite(!showWrite)} className="btn-primary text-sm py-2 px-4">
            공지 작성
          </button>
        )}
      </div>

      {showWrite && user?.is_admin && (
        <WriteAnnouncement onDone={() => { setShowWrite(false); fetch() }} />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center text-gray-600 text-sm">등록된 공지사항이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => {
            const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP.notice
            const isOpen = expanded === p.id
            return (
              <div key={p.id} className="card overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-dark-700/30 transition-colors">
                  {p.is_pinned ? <span className="text-accent-yellow text-xs">📌</span> : null}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                  <span className="text-sm font-bold text-white truncate flex-1">{p.title}</span>
                  <span className="text-[10px] text-gray-600 shrink-0">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 animate-fade-in border-t border-dark-700/50 pt-3">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                    <div className="text-[10px] text-gray-600 mt-3">
                      {new Date(p.created_at).toLocaleString('ko-KR')}
                    </div>
                    {user?.is_admin && (
                      <button onClick={() => handleDelete(p.id)} className="text-[10px] text-gray-600 hover:text-accent-red mt-2">삭제</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WriteAnnouncement({ onDone }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'notice', is_pinned: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createAnnouncement(form)
      onDone()
    } catch (err) { alert(err.response?.data?.detail || '작성 실패') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 animate-slide-up">
      <div className="flex gap-2">
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="input-field text-xs py-1.5 w-auto">
          <option value="notice">공지</option>
          <option value="update">업데이트</option>
          <option value="event">이벤트</option>
          <option value="maintenance">점검</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
          고정
        </label>
      </div>
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="input-field" placeholder="제목" required />
      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        className="input-field min-h-[100px]" placeholder="내용" required />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm py-2 flex-1 disabled:opacity-50">게시</button>
        <button type="button" onClick={onDone} className="btn-secondary text-sm py-2 px-4">취소</button>
      </div>
    </form>
  )
}
