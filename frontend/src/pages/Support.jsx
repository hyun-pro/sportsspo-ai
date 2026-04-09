import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createTicket, getMyTickets, getTicket, getAdminTickets, replyTicket } from '../services/api'

const CATEGORIES = [
  { value: 'account', label: '계정 문의', icon: '👤' },
  { value: 'payment', label: '결제/환불', icon: '💳' },
  { value: 'prediction', label: '예측/분석', icon: '📊' },
  { value: 'bug', label: '오류 신고', icon: '🐛' },
  { value: 'suggestion', label: '건의사항', icon: '💡' },
  { value: 'other', label: '기타', icon: '📋' },
]

const STATUS_MAP = {
  pending: { label: '대기중', color: 'bg-accent-yellow/15 text-accent-yellow' },
  replied: { label: '답변완료', color: 'bg-accent-green/15 text-accent-green' },
  closed: { label: '종료', color: 'bg-gray-600/20 text-gray-400' },
}

const FAQ = [
  { q: '예측 적중률은 어느 정도인가요?', a: 'MLB 기준 평균 65~70%이며, 신뢰도 70%+ 강력추천 경기는 더 높은 적중률을 보입니다.' },
  { q: '무료 회원은 어떤 기능을 이용할 수 있나요?', a: '하루 1개 경기 예측을 무료로 확인할 수 있습니다. 전체 기능은 PRO 구독 후 이용 가능합니다.' },
  { q: '구독 환불이 가능한가요?', a: '결제 후 7일 이내 고객센터를 통해 환불 요청이 가능합니다.' },
  { q: '데이터는 얼마나 자주 업데이트되나요?', a: '경기 데이터 30분, 실시간 스코어 2분 주기로 갱신됩니다.' },
  { q: '어떤 스포츠를 지원하나요?', a: '야구(MLB, KBO, NPB), 축구(EPL, 라리가, 분데스리가, 세리에A, 리그1, UCL, J리그), 농구(NBA)를 지원합니다.' },
]

export default function Support() {
  const { user } = useAuth()
  const [tab, setTab] = useState('faq')
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showWrite, setShowWrite] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchTickets = () => {
    if (!user) return
    setLoading(true)
    const fn = user.is_admin ? getAdminTickets : getMyTickets
    fn().then(res => setTickets(Array.isArray(res.data) ? res.data : []))
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { if (tab === 'my' || tab === 'admin') fetchTickets() }, [tab])

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-white">고객센터</h1>
        <p className="text-xs text-gray-500 mt-0.5">궁금한 점이 있으시면 언제든 문의해주세요 · 평균 응답시간 24시간 이내</p>
      </div>

      {/* 상단 안내 카드 */}
      <div className="card p-4 bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-accent-blue/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <div>
            <div className="text-sm font-bold text-white">도움이 필요하신가요?</div>
            <div className="text-xs text-gray-400 mt-0.5">FAQ에서 빠르게 답변을 찾거나, 1:1 문의를 남겨주세요.</div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <div className="text-[10px] text-gray-500">응답 시간</div>
            <div className="text-sm font-bold text-accent-blue">24시간 이내</div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5">
        {[
          { key: 'faq', label: 'FAQ' },
          { key: 'write', label: '문의하기' },
          ...(user ? [{ key: 'my', label: '내 문의내역' }] : []),
          ...(user?.is_admin ? [{ key: 'admin', label: '전체 문의 (관리자)' }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedTicket(null); setShowWrite(false) }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === t.key ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* FAQ */}
      {tab === 'faq' && (
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500 mb-2">원하는 답변을 찾지 못하셨나요?</p>
            {user ? (
              <button onClick={() => setTab('write')} className="btn-primary text-sm py-2 px-6">1:1 문의하기</button>
            ) : (
              <p className="text-xs text-gray-600">로그인 후 1:1 문의를 남기실 수 있습니다</p>
            )}
          </div>
        </div>
      )}

      {/* 문의 작성 */}
      {tab === 'write' && user && (
        <WriteTicket onDone={() => { setTab('my'); fetchTickets() }} />
      )}

      {/* 내 문의내역 */}
      {tab === 'my' && (
        selectedTicket ? (
          <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />
        ) : (
          <TicketList tickets={tickets} loading={loading} onSelect={setSelectedTicket} />
        )
      )}

      {/* 관리자: 전체 문의 */}
      {tab === 'admin' && user?.is_admin && (
        selectedTicket ? (
          <AdminTicketDetail ticket={selectedTicket} onBack={() => { setSelectedTicket(null); fetchTickets() }} />
        ) : (
          <TicketList tickets={tickets} loading={loading} onSelect={setSelectedTicket} showUser />
        )
      )}
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-dark-700/30 transition-colors">
        <span className="text-sm font-medium text-gray-200">{q}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-gray-400 animate-fade-in border-t border-dark-700/50 pt-2">{a}</div>
      )}
    </div>
  )
}

function WriteTicket({ onDone }) {
  const [form, setForm] = useState({ category: '', title: '', content: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) return alert('카테고리를 선택해주세요')
    setLoading(true)
    try {
      await createTicket(form)
      alert('문의가 접수되었습니다. 24시간 이내에 답변드리겠습니다.')
      onDone()
    } catch (err) { alert(err.response?.data?.detail || '문의 접수 실패') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 animate-slide-up">
      <h3 className="text-sm font-bold text-white">1:1 문의하기</h3>

      {/* 카테고리 */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1.5 block">문의 유형</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, category: c.value }))}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-all ${
                form.category === c.value
                  ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                  : 'bg-dark-700 text-gray-500 hover:text-white border border-transparent'
              }`}>
              <span className="text-base">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">제목</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="input-field text-sm" placeholder="문의 제목을 입력하세요" required />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">내용</label>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="input-field text-sm min-h-[120px]" placeholder="문의 내용을 상세히 작성해주세요" required />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm py-2 flex-1 disabled:opacity-50">
          {loading ? '접수중...' : '문의 접수'}
        </button>
      </div>
    </form>
  )
}

function TicketList({ tickets, loading, onSelect, showUser }) {
  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
  if (tickets.length === 0) return <div className="card p-12 text-center text-gray-600 text-sm">문의 내역이 없습니다</div>

  return (
    <div className="space-y-1.5">
      {tickets.map(t => {
        const st = STATUS_MAP[t.status] || STATUS_MAP.pending
        const cat = CATEGORIES.find(c => c.value === t.category)
        return (
          <button key={t.id} onClick={() => onSelect(t)}
            className="card w-full text-left p-3 hover:bg-dark-700/30 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{cat?.icon || '📋'}</span>
              <span className="text-sm font-bold text-white truncate flex-1">{t.title}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              {showUser && <span>{t.nickname || t.email}</span>}
              <span>{new Date(t.created_at).toLocaleDateString('ko-KR')} {new Date(t.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>#{t.id}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TicketDetail({ ticket, onBack }) {
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.pending
  const cat = CATEGORIES.find(c => c.value === ticket.category)
  return (
    <div className="space-y-3 animate-fade-in">
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        목록으로
      </button>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span>{cat?.icon}</span>
          <span className="text-xs text-gray-500">{cat?.label}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
          <span className="text-[10px] text-gray-600 ml-auto">#{ticket.id}</span>
        </div>
        <h2 className="text-base font-bold text-white mb-2">{ticket.title}</h2>
        <p className="text-sm text-gray-400 whitespace-pre-wrap">{ticket.content}</p>
        <div className="text-[10px] text-gray-600 mt-3">{new Date(ticket.created_at).toLocaleString('ko-KR')}</div>
      </div>

      {ticket.admin_reply ? (
        <div className="card p-4 border-accent-green/30 bg-accent-green/5">
          <div className="text-xs font-bold text-accent-green mb-1 flex items-center gap-1">
            <span>✅</span> 운영팀 답변
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
          <div className="text-[10px] text-gray-600 mt-2">{new Date(ticket.admin_reply_at).toLocaleString('ko-KR')}</div>
        </div>
      ) : (
        <div className="card p-4 border-accent-yellow/20 bg-accent-yellow/5 text-center">
          <span className="text-sm">⏳</span>
          <p className="text-xs text-gray-400 mt-1">답변 대기중입니다. 24시간 이내에 답변드리겠습니다.</p>
        </div>
      )}
    </div>
  )
}

function AdminTicketDetail({ ticket, onBack }) {
  const [reply, setReply] = useState(ticket.admin_reply || '')
  const [loading, setLoading] = useState(false)

  const handleReply = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      await replyTicket(ticket.id, { reply })
      alert('답변이 등록되었습니다')
      onBack()
    } catch { alert('답변 등록 실패') }
    finally { setLoading(false) }
  }

  const cat = CATEGORIES.find(c => c.value === ticket.category)
  return (
    <div className="space-y-3 animate-fade-in">
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        목록으로
      </button>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
          <span>{cat?.icon} {cat?.label}</span>
          <span>·</span>
          <span>{ticket.nickname || ticket.email}</span>
          <span>·</span>
          <span>{new Date(ticket.created_at).toLocaleString('ko-KR')}</span>
        </div>
        <h2 className="text-base font-bold text-white mb-2">{ticket.title}</h2>
        <p className="text-sm text-gray-400 whitespace-pre-wrap">{ticket.content}</p>
      </div>

      <div className="card p-4">
        <label className="text-xs font-bold text-gray-300 mb-2 block">관리자 답변</label>
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          className="input-field text-sm min-h-[100px] mb-3" placeholder="답변을 작성하세요..." />
        <button onClick={handleReply} disabled={loading} className="btn-primary text-sm py-2 px-6 disabled:opacity-50">
          {loading ? '등록중...' : ticket.admin_reply ? '답변 수정' : '답변 등록'}
        </button>
      </div>
    </div>
  )
}
