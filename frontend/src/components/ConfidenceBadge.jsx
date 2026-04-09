export default function ConfidenceBadge({ score, size = 'md' }) {
  let color, bg, label
  if (score >= 70) {
    color = 'text-accent-green'
    bg = 'bg-accent-green/15 border-accent-green/30'
    label = '강력'
  } else if (score >= 40) {
    color = 'text-accent-yellow'
    bg = 'bg-accent-yellow/15 border-accent-yellow/30'
    label = '보통'
  } else {
    color = 'text-accent-red'
    bg = 'bg-accent-red/15 border-accent-red/30'
    label = '위험'
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${bg} ${color} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}></span>
      {score}% {label}
    </span>
  )
}
