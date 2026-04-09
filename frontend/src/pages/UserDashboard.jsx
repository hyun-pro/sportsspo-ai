import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function UserDashboard() {
  const { user, isPremium } = useAuth()

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-white mb-6">내 정보</h1>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">계정 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-dark-600">
            <span className="text-gray-400">이메일</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-600">
            <span className="text-gray-400">이름</span>
            <span className="text-white">{user?.name || '미설정'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-600">
            <span className="text-gray-400">구독 상태</span>
            <span className={isPremium ? 'text-accent-green font-semibold' : 'text-gray-400'}>
              {isPremium ? '프리미엄 (이용 중)' : '무료'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-600">
            <span className="text-gray-400">가입일</span>
            <span className="text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '--'}
            </span>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="card p-6 border-accent-blue/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">프리미엄으로 업그레이드</h3>
              <p className="text-sm text-gray-400 mt-1">무제한 예측과 전체 분석 기능을 이용하세요</p>
            </div>
            <Link to="/subscription" className="btn-primary">
              월 &#8361;12,900
            </Link>
          </div>
        </div>
      )}

      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">바로가기</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/games" className="p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-center">
            <div className="text-2xl mb-2">&#9918;</div>
            <div className="text-sm font-medium text-gray-300">경기 예측</div>
          </Link>
          <Link to="/subscription" className="p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-center">
            <div className="text-2xl mb-2">&#11088;</div>
            <div className="text-sm font-medium text-gray-300">구독 관리</div>
          </Link>
          <Link to="/" className="p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-center">
            <div className="text-2xl mb-2">&#128200;</div>
            <div className="text-sm font-medium text-gray-300">대시보드</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
