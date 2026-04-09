const leagues = [
  { key: null, label: '전체', color: 'bg-dark-500' },
  { key: 'MLB', label: 'MLB', color: 'bg-blue-600' },
  { key: 'NPB', label: 'NPB', color: 'bg-red-600' },
  { key: 'KBO', label: 'KBO', color: 'bg-emerald-600' },
]

export default function LeagueFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2">
      {leagues.map((l) => (
        <button
          key={l.label}
          onClick={() => onChange(l.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === l.key
              ? `${l.color} text-white shadow-lg`
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-gray-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
