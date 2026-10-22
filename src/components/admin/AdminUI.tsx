/* Shared building blocks for the admin console. Every admin page composes
   these so spacing, type, colour and states stay consistent. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiChevronDown, FiChevronLeft, FiChevronRight, FiFilter, FiInbox, FiMoreHorizontal, FiSearch, FiUpload, FiX } from 'react-icons/fi'
import { LuChevronDown, LuChevronUp, LuChevronsUpDown } from 'react-icons/lu'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import Portal from '../ui/Portal'

/* ── Page header ──────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1.5">{eyebrow}</p>
        )}
        <h2 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-text-label max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">{actions}</div>}
    </div>
  )
}

/* ── Panel (card with optional header) ───────────────────────────────── */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`admin-card overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-label mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/* ── KPI card ─────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet'

const toneStyles: Record<Tone, { chip: string; pill: string; text: string; dot: string }> = {
  neutral: { chip: 'bg-[#f2f4f7] text-[#344054] ring-[#e4e7ec]', pill: 'bg-[#f2f4f7] text-[#475467]', text: 'text-[#344054]', dot: 'bg-[#98a2b3]' },
  brand: { chip: 'bg-[#fdecee] text-[#a91b27] ring-[#f8c9ce]', pill: 'bg-[#fde3e5] text-[#cb202d]', text: 'text-[#cb202d]', dot: 'bg-[#cb202d]' },
  success: { chip: 'bg-[#ecfdf3] text-[#067647] ring-[#abefc6]', pill: 'bg-[#d3f5df] text-[#16a34a]', text: 'text-[#079455]', dot: 'bg-[#17b26a]' },
  warning: { chip: 'bg-[#fffaeb] text-[#b54708] ring-[#fedf89]', pill: 'bg-[#ffe8c7] text-[#ea8a17]', text: 'text-[#dc6803]', dot: 'bg-[#f79009]' },
  danger: { chip: 'bg-[#fef3f2] text-[#b42318] ring-[#fecdca]', pill: 'bg-[#fee0e0] text-[#e5484d]', text: 'text-[#d92d20]', dot: 'bg-[#f04438]' },
  info: { chip: 'bg-[#eff8ff] text-[#175cd3] ring-[#b2ddff]', pill: 'bg-[#dcebff] text-[#2f7cf6]', text: 'text-[#1570ef]', dot: 'bg-[#2e90fa]' },
  violet: { chip: 'bg-[#f4f3ff] text-[#5925dc] ring-[#d9d6fe]', pill: 'bg-[#efe3ff] text-[#9b51e0]', text: 'text-[#6938ef]', dot: 'bg-[#7a5af8]' },
}

export function KpiCard({
  label,
  value,
  icon,
  tone = 'neutral',
  hint,
  delta,
  onClick,
  loading,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: Tone
  hint?: ReactNode
  delta?: number | null
  onClick?: () => void
  loading?: boolean
}) {
  const t = toneStyles[tone]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`admin-card text-left p-5 flex flex-col gap-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover hover:border-border-dark' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-text-label">{label}</span>
        {icon && (
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset ${t.chip}`}>{icon}</span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ) : (
        <div>
          <div className="kpi-value text-[26px] leading-none font-bold tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
            {value}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs min-h-[18px]">
            {delta != null && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold rounded-md px-1.5 py-0.5 ${
                  delta >= 0 ? 'bg-[#ecfdf3] text-[#067647]' : 'bg-[#fef3f2] text-[#b42318]'
                }`}
              >
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-text-label truncate">{hint}</span>}
          </div>
        </div>
      )}
    </Tag>
  )
}

/* ── Status pill ──────────────────────────────────────────────────────── */

/** Soft filled pill, as used in every table's Status column. */
export function StatusPill({ tone = 'neutral', children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  const t = toneStyles[tone]
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 min-w-[76px] rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${t.pill}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  )
}

/** Maps the many backend status strings onto a small set of tones. */
export function toneForStatus(status: string): Tone {
  const s = (status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  if (['delivered', 'completed', 'paid', 'active', 'accepted', 'published', 'ready_for_pickup', 'in_stock'].includes(s)) return 'success'
  if (['cancelled', 'rejected', 'failed', 'inactive', 'deactivated', 'out_of_stock', 'urgent'].includes(s)) return 'danger'
  if (['pending', 'submitted', 'order_placed', 'awaiting_approval', 'waiting_parts', 'waiting_for_parts', 'low_stock', 'high', 'draft'].includes(s)) return 'warning'
  if (['shipped', 'processing', 'reviewed', 'inspection', 'diagnosing', 'received', 'repair_in_progress', 'quality_check', 'device_received'].includes(s)) return 'info'
  if (['out_for_delivery', 'ready_for_delivery', 'refunded', 'inspected', 'quoted'].includes(s)) return 'violet'
  return 'neutral'
}

/* ── Buttons ──────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'

const btnVariants: Record<BtnVariant, string> = {
  primary:
    'bg-primary text-white shadow-[0_1px_2px_rgba(16,24,40,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-primary-hover',
  secondary: 'bg-white text-[#344054] border border-[#d0d5dd] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[#f9fafb] hover:text-text-primary',
  ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-[0_1px_2px_rgba(16,24,40,0.08)]',
  dark: 'bg-[#101828] text-white hover:bg-[#1d2939]',
}

export function Btn({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}) {
  const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' }
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[10px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100 ${sizes[size]} ${btnVariants[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ── Form field ───────────────────────────────────────────────────────── */

export const inputBase =
  'w-full h-10 px-3.5 text-sm rounded-[10px] bg-white text-text-primary placeholder:text-text-muted outline-none'
export const textareaBase =
  'w-full px-3.5 py-2.5 text-sm rounded-[10px] bg-white text-text-primary placeholder:text-text-muted outline-none resize-y'

/**
 * Label + control + hint/error. Pass a render function to receive the ids and
 * aria props so the error is announced by screen readers.
 */
export function Field({
  label,
  required,
  hint,
  error,
  counter,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  counter?: { value: number; max: number }
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
  className?: string
}) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="text-[13px] font-medium text-[#344054]">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
        {counter && (
          <span className={`text-[11px] tabular ${counter.value > counter.max ? 'text-danger font-semibold' : 'text-text-muted'}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? msgId : undefined })}
      {error ? (
        <p id={msgId} role="alert" className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
          <FiAlertTriangle size={12} className="shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-xs text-text-label">{hint}</p>
      ) : null}
    </div>
  )
}

/* ── Empty + loading states ───────────────────────────────────────────── */

export function EmptyState({
  icon = <FiInbox size={22} />,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="w-12 h-12 rounded-2xl bg-surface-lighter ring-1 ring-inset ring-border flex items-center justify-center text-text-label mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1 text-sm text-text-label max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`admin-skeleton ${className}`} aria-hidden="true" />
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-[#fecdca] bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]">
      <FiAlertTriangle className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:no-underline">
          Try again
        </button>
      )}
    </div>
  )
}

/* ── Modal + confirm dialog ───────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useLockBodyScroll(open)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Focus the first field so keyboard users land inside the dialog.
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button[data-autofocus]')?.focus()
    }, 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#0c111d]/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            className={`relative w-full ${widths[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-pop)] max-h-[92vh] flex flex-col`}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border-light">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                {description && <p className="mt-1 text-sm text-text-label">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-text-label hover:bg-surface-hover hover:text-text-primary"
              >
                <FiX size={18} />
              </button>
            </div>
            {children && <div className="px-6 py-5 overflow-y-auto">{children}</div>}
            {footer && <div className="px-6 py-4 border-t border-border-light bg-[#fcfcfd] rounded-b-2xl flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Btn onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant={tone} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Btn>
        </>
      }
    />
  )
}

/* ── List pages: toolbar, sortable table, row menu, pagination ────────── */

export type SortDir = 'asc' | 'desc'
export type SortState = { key: string; dir: SortDir } | null
type SortValue = string | number | null | undefined

/**
 * Client-side sort + pagination for list pages. `sorters` maps a column key
 * to the value it sorts by. The page snaps back to 1 whenever `resetKey`
 * changes (pass the active search/filters) and is clamped if rows shrink.
 */
export function useTable<T>(
  rows: T[],
  {
    sorters,
    pageSize: initialPageSize = 10,
    initialSort = null,
    resetKey = '',
  }: { sorters: Record<string, (row: T) => SortValue>; pageSize?: number; initialSort?: SortState; resetKey?: string },
) {
  const [sort, setSort] = useState<SortState>(initialSort)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [page, setPage] = useState(1)
  const [lastResetKey, setLastResetKey] = useState(resetKey)
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey)
    setPage(1)
  }

  const sorted = useMemo(() => {
    const get = sort ? sorters[sort.key] : undefined
    if (!sort || !get) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      if (x == null || x === '') return 1
      if (y == null || y === '') return -1
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
      return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' }) * dir
    })
    // `sorters` is a fresh object each render; the sort only depends on its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, totalPages)

  return {
    rows: sorted.slice((current - 1) * pageSize, current * pageSize),
    sorted,
    total: rows.length,
    sort,
    toggleSort: (key: string) =>
      setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null)),
    page: current,
    setPage,
    totalPages,
    pageSize,
    setPageSize: (n: number) => {
      setPageSizeState(n)
      setPage(1)
    },
  }
}

/** Sortable column header. Click cycles ascending → descending → unsorted. */
export function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
  className = '',
}: {
  label: string
  sortKey?: string
  sort?: SortState
  onSort?: (key: string) => void
  align?: 'left' | 'right' | 'center'
  className?: string
}) {
  const active = !!sortKey && sort?.key === sortKey
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  const Icon = !active ? LuChevronsUpDown : sort?.dir === 'asc' ? LuChevronUp : LuChevronDown
  return (
    <th
      className={`${align === 'right' ? '!text-right' : align === 'center' ? '!text-center' : ''} ${className}`}
      aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      {sortKey && onSort ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={`inline-flex items-center gap-1 ${justify} -mx-1 px-1 rounded-md hover:text-text-primary transition-colors ${active ? 'text-text-primary' : ''}`}
        >
          {label}
          <Icon size={13} className={active ? 'text-primary' : 'text-text-muted'} />
        </button>
      ) : (
        label
      )}
    </th>
  )
}

/** White toolbar button used for Filter / Export / Refresh in a page's title row. */
export function ToolbarBtn({ icon, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={`h-10 inline-flex items-center justify-center gap-2 px-4 rounded-[10px] bg-white text-sm font-medium text-text-primary shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-inset ring-[#eceef2] hover:ring-border-dark hover:bg-[#fcfcfd] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

/** Pill search box that sits in a page's title row. */
export function SearchBox({
  value,
  onChange,
  placeholder = 'Search',
  label,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  className?: string
}) {
  return (
    <div className={`relative w-full sm:w-64 ${className}`}>
      <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="admin-search w-full h-10 pl-10 pr-9 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
        >
          <FiX size={13} />
        </button>
      )}
    </div>
  )
}

/** "Showing [10 ▾]" rows-per-page selector. */
export function ShowingSelect({ value, onChange, options = [10, 25, 50, 100] }: { value: number; onChange: (n: number) => void; options?: number[] }) {
  const id = useId()
  return (
    <div className="inline-flex items-center gap-2.5 text-sm text-text-secondary">
      <label htmlFor={id} className="whitespace-nowrap">Showing</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="admin-showing h-8 pl-3 pr-7 text-sm font-medium appearance-none cursor-pointer"
        >
          {options.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <FiChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      </div>
    </div>
  )
}

function useDismiss(open: boolean, close: () => void, refs: RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (refs.every((r) => !r.current?.contains(e.target as Node))) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close])
}

/**
 * "Filter" button with a popover holding the page's filter controls. The
 * badge shows how many filters are active; "Reset" appears when any are.
 */
export function FilterMenu({ activeCount = 0, onReset, children }: { activeCount?: number; onReset?: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [ref])
  return (
    <div ref={ref} className="relative">
      <ToolbarBtn icon={<FiFilter size={15} />} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog">
        Filter
        {activeCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-semibold flex items-center justify-center">{activeCount}</span>
        )}
      </ToolbarBtn>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Filters"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-[var(--shadow-pop)] ring-1 ring-black/5 z-40"
          >
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <p className="text-sm font-semibold text-text-primary">Filters</p>
              {onReset && activeCount > 0 && (
                <button type="button" onClick={onReset} className="text-xs font-semibold text-primary hover:underline">Reset</button>
              )}
            </div>
            <div className="px-4 pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Labelled select for use inside FilterMenu. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-label mb-1.5">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputBase} cursor-pointer`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/** Downloads rows as a CSV file (opens cleanly in Excel / Sheets). */
export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  // BOM so Excel reads ₹ and other non-ASCII characters correctly.
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <ToolbarBtn icon={<FiUpload size={15} />} onClick={onClick} disabled={disabled}>
      Export
    </ToolbarBtn>
  )
}

export interface RowMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

/**
 * The "⋯" action button at the end of a row. The menu is portalled and
 * positioned against the button so the table's horizontal scroll container
 * can't clip it.
 */
export function RowMenu({ items, label = 'Row actions' }: { items: RowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean }>({ top: 0, left: 0, up: false })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useDismiss(open, close, [btnRef, menuRef])

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const menuH = items.length * 38 + 12
    const up = r.bottom + menuH + 8 > window.innerHeight && r.top > menuH
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: Math.max(8, r.right - 184), up })
  }, [open, items.length])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={`w-9 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${open ? 'bg-primary-container text-primary' : 'text-text-label hover:bg-surface-hover hover:text-text-primary'}`}
      >
        <FiMoreHorizontal size={18} />
      </button>
      {open && (
        <Portal>
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: pos.top, left: pos.left, transform: pos.up ? 'translateY(-100%)' : undefined }}
            className="z-[85] w-46 bg-white rounded-xl shadow-[var(--shadow-pop)] ring-1 ring-black/5 p-1.5 animate-admin-in"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  close()
                  it.onClick()
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 h-[34px] rounded-lg text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  it.danger ? 'text-danger hover:bg-[#fef3f2]' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </>
  )
}

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, 2, total - 1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

/** "‹ Previous   01 02 [03] 04 … 10 11   Next ›" footer for a table card. */
export function Pagination({
  page,
  totalPages,
  onPage,
  summary,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
  summary?: ReactNode
}) {
  const navBtn = 'inline-flex items-center gap-1.5 h-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-border-light">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${navBtn} text-text-label hover:text-text-primary order-2 sm:order-1 hidden sm:inline-flex`}>
        <FiChevronLeft size={16} /> Previous
      </button>
      <div className="flex flex-col items-center gap-2 order-1 sm:order-2">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${navBtn} sm:hidden text-text-label`}>
            <FiChevronLeft size={16} />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="w-6 text-center text-xs text-text-muted">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`min-w-7 h-7 px-1.5 rounded-md text-xs font-medium tabular transition-colors ${
                  p === page ? 'bg-primary text-white shadow-[0_4px_10px_-3px_rgba(203,32,45,0.55)]' : 'text-text-label hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {String(p).padStart(2, '0')}
              </button>
            ),
          )}
          <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${navBtn} sm:hidden text-text-label`}>
            <FiChevronRight size={16} />
          </button>
        </div>
        {summary && <p className="text-xs text-text-muted">{summary}</p>}
      </div>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${navBtn} text-text-primary hover:text-primary order-3 hidden sm:inline-flex`}>
        Next <FiChevronRight size={16} />
      </button>
    </nav>
  )
}

/** Small square thumbnail (image, or the first letter as a fallback). */
export function Thumb({ src, name, rounded = 'rounded-full' }: { src?: string | null; name: string; rounded?: string }) {
  const [broken, setBroken] = useState(false)
  const showImg = !!src && !broken && /^(https?:|data:|blob:|\/)/.test(src)
  return (
    <span className={`w-9 h-9 ${rounded} shrink-0 overflow-hidden bg-[#fdecee] text-primary text-sm font-semibold flex items-center justify-center ring-1 ring-inset ring-black/5`}>
      {showImg ? (
        <img src={src!} alt="" loading="lazy" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : (
        (name.trim().charAt(0) || '?').toUpperCase()
      )}
    </span>
  )
}

/* ── Formatting helpers ───────────────────────────────────────────────── */

export const formatINR = (n: number, compact = false) =>
  compact && Math.abs(n) >= 100000
    ? `₹${(n / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`
    : `₹${Math.round(n).toLocaleString('en-IN')}`

export function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function timeAgo(iso?: string | null) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(iso)
}

/** Pulls a readable message out of an axios error, preferring field errors. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data.length < 200 ? data : fallback
  const d = data as Record<string, unknown>
  if (typeof d.message === 'string' && d.message) return d.message
  if (typeof d.detail === 'string') return d.detail
  for (const value of Object.values(d)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string') return value
  }
  return fallback
}

/** Maps DRF `{field: ["msg"]}` errors to `{field: "msg"}` for inline display. */
export function apiFieldErrors(err: unknown): Record<string, string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  const out: Record<string, string> = {}
  if (!data || typeof data !== 'object') return out
  const src = (data as Record<string, unknown>).errors && typeof (data as Record<string, unknown>).errors === 'object'
    ? ((data as Record<string, unknown>).errors as Record<string, unknown>)
    : (data as Record<string, unknown>)
  for (const [key, value] of Object.entries(src)) {
    if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0]
    else if (typeof value === 'string' && key !== 'message' && key !== 'detail') out[key] = value
  }
  return out
}
