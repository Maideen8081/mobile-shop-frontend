interface CheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
  error?: string
}

export default function Checkbox({ id, checked, onChange, children, error }: CheckboxProps) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-border-light accent-primary cursor-pointer flex-shrink-0"
        />
        <label htmlFor={id} className="text-sm text-text-secondary leading-relaxed cursor-pointer select-none">
          {children}
        </label>
      </div>
      {error && (
        <span className="flex items-center gap-1 mt-1.5 text-xs text-error ml-7">{error}</span>
      )}
    </div>
  )
}
