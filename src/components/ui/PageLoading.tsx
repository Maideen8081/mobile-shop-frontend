import '../LoadingScreen/RouteLoader.css'

export default function PageLoading({ label = 'Loading…', className = '' }: {
  label?: string
  className?: string
}) {
  return (
    <div role="status" className={`page-loading ${className}`}>
      <span className="boot-loading-bar" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
