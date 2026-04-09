export default function ProbabilityBar({ homeProb, awayProb, homeTeam, awayTeam }) {
  const hp = homeProb || 50
  const ap = awayProb || 50

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-accent-blue font-semibold">{homeTeam} {hp.toFixed(1)}%</span>
        <span className="text-accent-purple font-semibold">{ap.toFixed(1)}% {awayTeam}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-dark-600">
        <div
          className="bg-gradient-to-r from-accent-blue to-blue-400 transition-all duration-500"
          style={{ width: `${hp}%` }}
        />
        <div
          className="bg-gradient-to-r from-purple-400 to-accent-purple transition-all duration-500"
          style={{ width: `${ap}%` }}
        />
      </div>
    </div>
  )
}
