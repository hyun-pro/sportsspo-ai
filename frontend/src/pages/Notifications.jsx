import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markAllRead } from '../services/api'

export default function Notifications() {
  const [data, setData] = useState({ notifications: [], unread: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleReadAll = async () => {
    await markAllRead()
    setData(d => ({ ...d, unread: 0, notifications: d.notifications.map(n => ({ ...n, is_read: 1 })) }))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>

  const ICONS = {
    game_result: '⚾', prediction_hit: '🎯', prediction_miss: '❌',
    community: '💬', system: '📢', subscription: '💎',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">알림</h1>
          {data.unread > 0 && <p className="text-xs text-accent-blue mt-0.5">읽지 않은 알림 {data.unread}개</p>}
        </div>
        {data.unread > 0 && (
          <button onClick={handleReadAll} className="text-xs text-gray-500 hover:text-white">모두 읽음</button>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">🔔</div>
          <div className="text-gray-500 text-sm">알림이 없습니다</div>
          <p className="text-xs text-gray-600 mt-1">경기 결과, 예측 적중, 커뮤니티 댓글 등의 알림이 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-1">
          {data.notifications.map(n => (
            <div key={n.id} className={`card p-3 transition-all ${!n.is_read ? 'border-accent-blue/30 bg-accent-blue/5' : ''}`}>
              {n.link ? (
                <Link to={n.link} className="block">
                  <NotifContent n={n} icons={ICONS} />
                </Link>
              ) : (
                <NotifContent n={n} icons={ICONS} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotifContent({ n, icons }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icons[n.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-200">{n.title}</div>
        {n.message && <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>}
      </div>
      <div className="text-[9px] text-gray-600 shrink-0">
        {new Date(n.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        <br />
        {new Date(n.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {!n.is_read && <span className="w-2 h-2 bg-accent-blue rounded-full shrink-0 mt-1"></span>}
    </div>
  )
}
