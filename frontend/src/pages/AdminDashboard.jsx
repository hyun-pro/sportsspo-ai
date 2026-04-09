import { useState, useEffect } from 'react'
import { getAdminStats } from '../services/api'
import UserBadge from '../components/UserBadge'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then(res => setStats(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
  if (!stats) return <div className="text-center py-20 text-gray-500">관리자 권한이 필요합니다</div>

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-black text-white">관리자 대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="총 회원" value={stats.totalUsers} icon="👥" color="text-accent-blue" />
        <StatBox label="오늘 가입" value={stats.todayUsers} icon="📈" color="text-accent-green" />
        <StatBox label="PRO" value={stats.proUsers} icon="💎" color="text-accent-purple" />
        <StatBox label="MRR" value={`₩${stats.mrr.toLocaleString()}`} icon="💰" color="text-accent-yellow" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="총 경기" value={stats.totalGames} icon="⚾" />
        <StatBox label="총 예측" value={stats.totalPredictions} icon="🎯" />
        <StatBox label="적중률" value={`${stats.accuracy.rate}%`} icon="📊" color="text-accent-green" />
        <StatBox label="커뮤니티" value={`${stats.totalPosts}글 ${stats.totalComments}댓`} icon="💬" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="section-title mb-3">요금제 분포</h2>
          {stats.planBreakdown.map(p => {
            const pct = stats.totalUsers > 0 ? Math.round(p.count / stats.totalUsers * 100) : 0
            return (
              <div key={p.plan} className="flex items-center gap-2 mb-2">
                <span className="text-xs w-14 text-gray-400">{p.plan || 'free'}</span>
                <div className="flex-1 bg-dark-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-accent-blue" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-14 text-right">{p.count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
        <div className="card p-4">
          <h2 className="section-title mb-3">최근 가입</h2>
          {stats.recentUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-dark-700/30">
              <UserBadge nickname={u.nickname || u.email} plan={u.plan} />
              <span className="text-[10px] text-gray-600">{new Date(u.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="card p-3">
      <span>{icon}</span>
      <div className={`text-lg font-black mt-1 ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}
