// 요금제별 닉네임 뱃지
const PLAN_BADGES = {
  premium: { label: 'VIP', bg: 'bg-gradient-to-r from-yellow-500 to-amber-500', text: 'text-white', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' },
  pro: { label: 'PRO', bg: 'bg-gradient-to-r from-accent-blue to-blue-600', text: 'text-white', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]' },
  free: { label: '', bg: '', text: '', glow: '' },
}

export default function UserBadge({ nickname, plan = 'free', size = 'sm' }) {
  const badge = PLAN_BADGES[plan] || PLAN_BADGES.free
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className="inline-flex items-center gap-1">
      {badge.label && (
        <span className={`${badge.bg} ${badge.text} ${badge.glow} text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none`}>
          {badge.label}
        </span>
      )}
      <span className={`${textSize} font-bold text-gray-200`}>{nickname || '익명'}</span>
    </span>
  )
}

export function getPlanBadgeInfo(plan) {
  return PLAN_BADGES[plan] || PLAN_BADGES.free
}
