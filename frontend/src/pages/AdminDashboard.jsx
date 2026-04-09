import { useState, useEffect } from 'react'
import { getAdminDashboard, getAdminUsers } from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminDashboard(), getAdminUsers()])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data)
        setUsers(usersRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">관리자 대시보드</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="전체 회원" value={stats.total_users} color="text-accent-blue" />
          <StatCard label="유료 구독자" value={stats.active_subscriptions} color="text-accent-green" />
          <StatCard label="전체 경기" value={stats.total_games} color="text-accent-purple" />
          <StatCard label="예측 수" value={stats.total_predictions} color="text-accent-yellow" />
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-gray-200">최근 가입 회원</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">이름</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">구독</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">관리자</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-dark-700 hover:bg-dark-700/30">
                  <td className="px-4 py-3 text-sm text-gray-300">{u.id}</td>
                  <td className="px-4 py-3 text-sm text-white">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{u.name || '--'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      u.subscription_status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {u.subscription_status === 'active' ? '유료' : '무료'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{u.is_admin ? '예' : '아니오'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ko-KR') : '--'}
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

function StatCard({ label, value, color }) {
  return (
    <div className="card p-5">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}
