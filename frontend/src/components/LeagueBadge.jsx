const leagueStyles = {
  MLB: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  NPB: 'bg-red-600/20 text-red-400 border-red-500/30',
  KBO: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
}

export default function LeagueBadge({ league }) {
  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${leagueStyles[league] || 'bg-dark-600 text-gray-400'}`}>
      {league}
    </span>
  )
}
