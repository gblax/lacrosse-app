interface ConferenceFilterProps {
  conferences: string[]
  selected: string | null
  onChange: (conf: string | null) => void
}

export default function ConferenceFilter({ conferences, selected, onChange }: ConferenceFilterProps) {
  if (conferences.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-brand-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        All
      </button>
      {conferences.map((conf) => (
        <button
          key={conf}
          onClick={() => onChange(selected === conf ? null : conf)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === conf
              ? 'bg-brand-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {conf}
        </button>
      ))}
    </div>
  )
}
