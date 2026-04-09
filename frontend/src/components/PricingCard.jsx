import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    period: '영구',
    desc: '기본 경기 정보 확인',
    color: 'gray',
    features: [
      { text: '하루 3개 예측', included: true },
      { text: '기본 경기 정보', included: true },
      { text: '일부 리그', included: true },
      { text: '투수 매치업 분석', included: false },
      { text: '신뢰도 지표', included: false },
      { text: 'ELO 고급 지표', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 9900,
    period: '월',
    desc: '전체 분석 + 실시간 예측',
    badge: '인기',
    color: 'blue',
    features: [
      { text: '무제한 예측', included: true },
      { text: 'MLB+KBO+NPB 전체', included: true },
      { text: '투수 매치업 분석', included: true },
      { text: '신뢰도 지표', included: true },
      { text: 'ELO 고급 지표', included: true },
      { text: '실시간 인게임 예측', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 19900,
    period: '월',
    desc: '모든 기능 + 독점 분석',
    badge: '추천',
    color: 'purple',
    features: [
      { text: '무제한 예측', included: true },
      { text: 'MLB+KBO+NPB 전체', included: true },
      { text: '투수 매치업 분석', included: true },
      { text: '신뢰도 지표', included: true },
      { text: 'ELO 고급 지표', included: true },
      { text: '실시간 인게임 예측', included: true },
    ],
  },
]

// 풀 사이즈 카드 (구독 페이지용)
export function PricingCard({ plan, onSelect }) {
  const { user, isPremium } = useAuth()
  const isCurrent = (plan.id === 'free' && !isPremium) || (plan.id !== 'free' && isPremium)

  const colorMap = {
    gray: { ring: 'border-dark-500', badge: '', btn: 'btn-secondary', glow: '' },
    blue: { ring: 'border-accent-blue/50 ring-1 ring-accent-blue/20', badge: 'bg-accent-blue', btn: 'btn-primary', glow: 'shadow-glow-blue' },
    purple: { ring: 'border-accent-purple/50 ring-1 ring-accent-purple/20', badge: 'bg-accent-purple', btn: 'bg-accent-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-all active:scale-95', glow: 'shadow-glow-blue' },
  }
  const c = colorMap[plan.color]

  return (
    <div className={`card p-5 sm:p-6 relative overflow-hidden transition-all duration-200 hover:translate-y-[-3px] hover:shadow-card-hover ${c.ring} ${c.glow}`}>
      {plan.badge && (
        <div className={`absolute top-0 right-0 ${c.badge} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl`}>
          {plan.badge}
        </div>
      )}

      <div className="text-center mb-5">
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">{plan.desc}</p>
        <div className="mt-3">
          <span className="text-3xl sm:text-4xl font-black text-white">
            {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
          </span>
          {plan.price > 0 && <span className="text-sm text-gray-500">/{plan.period}</span>}
        </div>
      </div>

      <ul className="space-y-2.5 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-center gap-2 text-sm ${f.included ? 'text-gray-200' : 'text-gray-600'}`}>
            {f.included ? (
              <svg className="w-4 h-4 text-accent-green shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {f.text}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <button disabled className={`w-full py-2.5 rounded-lg text-sm font-semibold bg-dark-600 text-gray-500 cursor-default`}>
          현재 플랜
        </button>
      ) : !user ? (
        <Link to="/register" className={`block text-center w-full py-2.5 ${c.btn}`}>
          회원가입
        </Link>
      ) : (
        <button onClick={() => onSelect?.(plan)} className={`w-full py-2.5 ${c.btn} ripple-effect`}>
          {plan.price === 0 ? '무료로 시작' : '구독하기'}
        </button>
      )}
    </div>
  )
}

// 미니 배너 (사이드바용)
export function PricingBanner() {
  const { isPremium } = useAuth()
  if (isPremium) return null

  return (
    <Link to="/subscription" className="block mx-3 mb-3">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-accent-blue/30 p-3 hover:border-accent-blue/50 transition-all group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-accent-blue/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent-yellow">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-white">PRO 업그레이드</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            무제한 예측 · 전체 리그 · 고급 분석
          </p>
          <div className="mt-2 text-[10px] font-bold text-accent-blue group-hover:text-blue-400 transition-colors">
            ₩9,900/월 →
          </div>
        </div>
      </div>
    </Link>
  )
}

export { PLANS }
export default PricingCard
