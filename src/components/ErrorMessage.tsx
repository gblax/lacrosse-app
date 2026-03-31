interface ErrorMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message = 'Unable to load data. Please try again.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.694 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-lg bg-slate-800 text-sm text-brand-400 hover:bg-slate-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
