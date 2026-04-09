import { useState, useEffect, useRef } from 'react'
import { getChat, sendChat, getPlayByPlay } from '../services/api'
import { useAuth } from '../context/AuthContext'
import UserBadge from './UserBadge'

export default function LiveChatPlay({ gameId, isLive }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('chat') // 'chat' | 'play'
  const [messages, setMessages] = useState([])
  const [plays, setPlays] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const lastMsgId = useRef(0)
  const chatEndRef = useRef(null)
  const intervalRef = useRef(null)

  // 채팅 폴링
  const fetchChat = () => {
    getChat(gameId, lastMsgId.current)
      .then(res => {
        const newMsgs = res.data || []
        if (newMsgs.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id))
            const merged = [...prev, ...newMsgs.filter(m => !ids.has(m.id))]
            return merged.slice(-100) // 최근 100개만
          })
          lastMsgId.current = Math.max(...newMsgs.map(m => m.id))
        }
      })
      .catch(() => {})
  }

  // 문자중계 폴링
  const fetchPlays = () => {
    getPlayByPlay(gameId)
      .then(res => setPlays(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchChat()
    fetchPlays()
    const speed = isLive ? 5000 : 15000 // 라이브면 5초, 아니면 15초
    intervalRef.current = setInterval(() => {
      fetchChat()
      if (tab === 'play' || isLive) fetchPlays()
    }, speed)
    return () => clearInterval(intervalRef.current)
  }, [gameId, isLive, tab])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await sendChat(gameId, input.trim())
      setInput('')
      fetchChat()
    } catch (err) {
      if (err.response?.status === 401) alert('로그인이 필요합니다')
    } finally { setSending(false) }
  }

  return (
    <div className="border border-dark-600 rounded-xl overflow-hidden bg-dark-800">
      {/* 탭 헤더 */}
      <div className="flex border-b border-dark-600">
        <button onClick={() => setTab('chat')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
            tab === 'chat' ? 'text-white bg-dark-700 border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
          }`}>
          실시간 채팅
          {messages.length > 0 && <span className="ml-1 text-[9px] text-gray-600">{messages.length}</span>}
        </button>
        <button onClick={() => setTab('play')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
            tab === 'play' ? 'text-white bg-dark-700 border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
          }`}>
          문자중계
          {isLive && <span className="ml-1 w-1.5 h-1.5 bg-red-400 rounded-full inline-block animate-pulse" />}
        </button>
      </div>

      {/* 컨텐츠 */}
      {tab === 'chat' ? (
        <div className="flex flex-col" style={{ height: '360px' }}>
          {/* 채팅 메시지 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-700 text-xs">
                아직 채팅이 없습니다. 첫 메시지를 남겨보세요!
              </div>
            )}
            {messages.map(msg => (
              <ChatMessage key={msg.id} msg={msg} isMine={user?.id === msg.user_id} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* 입력 */}
          {user ? (
            <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-dark-700">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="메시지 입력..."
                maxLength={200}
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
              />
              <button type="submit" disabled={sending || !input.trim()}
                className="bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-30 transition-opacity shrink-0">
                전송
              </button>
            </form>
          ) : (
            <div className="p-3 border-t border-dark-700 text-center">
              <span className="text-[10px] text-gray-600">로그인 후 채팅에 참여할 수 있습니다</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: '360px' }} className="overflow-y-auto scrollbar-hide">
          {!plays?.supported ? (
            <div className="text-center py-12 text-gray-600 text-xs">{plays?.message || 'MLB 경기만 문자중계를 지원합니다'}</div>
          ) : !plays?.plays?.length ? (
            <div className="text-center py-12 text-gray-600 text-xs">경기 데이터 대기 중</div>
          ) : (
            <div className="p-2 space-y-1">
              {/* 현재 타석 */}
              {plays.current && isLive && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-red-400">현재 타석</span>
                    <span className="text-[9px] text-gray-500">{plays.current.inning}회 {plays.current.halfInning}</span>
                  </div>
                  <div className="text-xs text-white font-semibold">{plays.current.batter}</div>
                  <div className="text-[10px] text-gray-500">투수: {plays.current.pitcher}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <BSO label="B" count={plays.current.count?.balls || 0} max={3} color="bg-green-500" />
                    <BSO label="S" count={plays.current.count?.strikes || 0} max={2} color="bg-yellow-500" />
                    <BSO label="O" count={plays.current.count?.outs || 0} max={2} color="bg-red-500" />
                  </div>
                  {plays.current.events?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {plays.current.events.filter(e => e.type === 'pitch').map((e, i) => {
                        const c = e.isStrike ? 'bg-yellow-600' : e.isBall ? 'bg-green-600' : e.isInPlay ? 'bg-blue-500' : 'bg-gray-600'
                        return <span key={i} className={`w-5 h-5 rounded-full ${c} text-[8px] font-bold text-white flex items-center justify-center`}>{e.code || '?'}</span>
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 플레이 기록 */}
              {plays.plays.map((p, i) => (
                <PlayRow key={i} play={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatMessage({ msg, isMine }) {
  const time = new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <div className="mb-0.5">
            <UserBadge nickname={msg.nickname} plan={msg.plan} size="sm" />
          </div>
        )}
        <div className={`rounded-xl px-3 py-1.5 text-sm ${
          isMine ? 'bg-white text-gray-900 rounded-tr-sm' : 'bg-dark-700 text-gray-200 rounded-tl-sm'
        }`}>
          {msg.message}
        </div>
        <div className={`text-[9px] text-gray-700 mt-0.5 ${isMine ? 'text-right' : ''}`}>{time}</div>
      </div>
    </div>
  )
}

function PlayRow({ play }) {
  const icon = (() => {
    const d = play.result?.toLowerCase() || ''
    if (d.includes('home run')) return '💣'
    if (d.includes('double') || d.includes('triple')) return '🔥'
    if (d.includes('single')) return '🏏'
    if (d.includes('walk')) return '🚶'
    if (d.includes('strikes out')) return 'K'
    if (d.includes('out')) return '✕'
    return '·'
  })()

  const isHit = play.result?.toLowerCase().includes('single') || play.result?.toLowerCase().includes('double') || play.result?.toLowerCase().includes('triple') || play.result?.toLowerCase().includes('home run')
  const isK = play.result?.toLowerCase().includes('strikes out')

  return (
    <div className={`flex gap-2 px-2 py-1.5 rounded-lg text-xs ${
      isHit ? 'bg-emerald-500/5 border border-emerald-500/10' :
      isK ? 'bg-dark-700/30' : ''
    }`}>
      <span className="w-5 text-center shrink-0 text-[10px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] text-gray-600 bg-dark-700 px-1 py-0.5 rounded">{play.inning}회{play.halfInning}</span>
          <span className="text-gray-300 font-semibold truncate">{play.batter}</span>
          {play.rbi > 0 && <span className="text-[8px] text-emerald-400 font-bold">RBI</span>}
        </div>
        <div className="text-[11px] text-gray-500 leading-snug">{play.result}</div>
      </div>
      <div className="text-[9px] text-gray-700 shrink-0 tabular-nums">
        {play.awayScore}-{play.homeScore}
      </div>
    </div>
  )
}

function BSO({ label, count, max, color }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] text-gray-600 w-2">{label}</span>
      {Array.from({ length: max + 1 }, (_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < count ? color : 'bg-dark-600'}`} />
      ))}
    </div>
  )
}
