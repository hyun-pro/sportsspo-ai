import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createCheckout, cancelSubscription } from '../services/api'
import { Link, useSearchParams } from 'react-router-dom'

export default function Subscription() {
  const { user, isPremium } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await createCheckout()
      window.location.href = res.data.checkout_url
    } catch (err) {
      alert(err.response?.data?.detail || '결제 세션 생성에 실패했습니다. Stripe 설정을 확인하세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('정말로 구독을 취소하시겠습니까?')) return
    try {
      await cancelSubscription()
      window.location.reload()
    } catch (err) {
      alert('구독 취소에 실패했습니다')
    }
  }

  const features = [
    { free: '하루 3개 예측', pro: '무제한 예측' },
    { free: '기본 경기 정보', pro: '전체 분석 및 통계' },
    { free: '일부 리그만', pro: 'MLB + NPB + KBO 전체' },
    { free: '투수 데이터 없음', pro: '선발투수 매치업 분석' },
    { free: '신뢰도 미표시', pro: '신뢰도 지표 제공' },
    { free: '--', pro: 'ELO 및 고급 지표' },
  ]

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-lg mb-6">
          구독이 성공적으로 활성화되었습니다! 전체 기능을 이용하세요.
        </div>
      )}
      {cancelled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-6 py-4 rounded-lg mb-6">
          결제가 취소되었습니다. 언제든 다시 시도할 수 있습니다.
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">프리미엄 구독</h1>
        <p className="text-gray-400">모든 야구 경기 예측과 분석에 전체 접근하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="card p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-300">무료</h2>
            <div className="mt-2">
              <span className="text-4xl font-bold text-white">&#8361;0</span>
              <span className="text-gray-500">/월</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-gray-600">-</span>
                {f.free}
              </li>
            ))}
          </ul>
          <button disabled className="btn-secondary w-full opacity-60">
            현재 플랜
          </button>
        </div>

        {/* Pro Plan */}
        <div className="card p-6 border-accent-blue/50 ring-1 ring-accent-blue/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent-blue text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            추천
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">프리미엄</h2>
            <div className="mt-2">
              <span className="text-4xl font-bold text-white">&#8361;12,900</span>
              <span className="text-gray-500">/월</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-200">
                <svg className="w-4 h-4 text-accent-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f.pro}
              </li>
            ))}
          </ul>
          {!user ? (
            <Link to="/register" className="btn-primary w-full text-center block">
              회원가입 후 구독하기
            </Link>
          ) : isPremium ? (
            <div>
              <button disabled className="btn-primary w-full opacity-60 mb-2">구독 중</button>
              <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-red-400 w-full text-center">
                구독 취소
              </button>
            </div>
          ) : (
            <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? '이동 중...' : '지금 구독하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
