export default function Divider({ text = 'or continue with' }: { text?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-muted font-medium whitespace-nowrap">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
