import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createCheckout, cancelSubscription } from '../services/api'
import { useSearchParams } from 'react-router-dom'
import { PricingCard, PLANS } from '../components/PricingCard'

export default function Subscription() {
  const { user, isPremium } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  const handleSelect = async (plan) => {
    if (plan.price === 0) return
    setLoading(true)
    try {
      const res = await createCheckout()
      window.location.href = res.data.checkout_url
    } catch (err) {
      alert(err.response?.data?.detail || '결제 세션 생성에 실패했습니다.')
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

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {success && (
        <div className="bg-accent-green/10 border border-accent-green/30 text-accent-green px-5 py-3 rounded-xl mb-6 text-sm">
          구독이 성공적으로 활성화되었습니다!
        </div>
      )}
      {cancelled && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow px-5 py-3 rounded-xl mb-6 text-sm">
          결제가 취소되었습니다. 언제든 다시 시도할 수 있습니다.
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">요금제 선택</h1>
        <p className="text-gray-400 text-sm">당신에게 맞는 플랜을 선택하세요</p>
      </div>

      {/* 3단 요금제 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} onSelect={handleSelect} />
        ))}
      </div>

      {/* 구독 취소 */}
      {isPremium && (
        <div className="text-center mt-8">
          <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-accent-red transition-colors">
            구독 취소하기
          </button>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="mt-10 card p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3">자주 묻는 질문</h3>
        <div className="space-y-3">
          <FaqItem q="예측 적중률은 어떻게 되나요?" a="MLB 기준 평균 65~70% 적중률을 보이고 있습니다. 강력 추천(신뢰도 70%+) 경기는 더 높은 적중률을 기록합니다." />
          <FaqItem q="어떤 데이터를 사용하나요?" a="MLB 공식 API, KBO/NPB 실시간 스크래핑 데이터를 기반으로 ELO, 투수 ERA/WHIP, 최근 폼, 홈어드밴티지 등을 종합 분석합니다." />
          <FaqItem q="환불이 가능한가요?" a="결제 후 7일 이내 환불 요청이 가능합니다." />
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <div className="border-b border-dark-700/50 pb-2.5">
      <div className="text-sm text-gray-200 font-medium">{q}</div>
      <div className="text-xs text-gray-500 mt-1">{a}</div>
    </div>
  )
}
