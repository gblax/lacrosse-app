import { format, addDays, subDays, isToday } from 'date-fns'

interface DatePickerProps {
  date: Date
  onChange: (date: Date) => void
}

export default function DatePicker({ date, onChange }: DatePickerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={format(date, 'yyyy-MM-dd')}
          onChange={(e) => {
            const d = new Date(e.target.value + 'T12:00:00')
            if (!isNaN(d.getTime())) onChange(d)
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 [color-scheme:dark]"
        />
        {!isToday(date) && (
          <button
            onClick={() => onChange(new Date())}
            className="text-xs px-2 py-1 rounded bg-slate-800 text-brand-400 hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Next day"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
