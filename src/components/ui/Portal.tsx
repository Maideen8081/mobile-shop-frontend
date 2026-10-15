import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Renders overlays on document.body. Admin pages sit inside animated
 * (transformed) containers, which would otherwise turn `position: fixed`
 * into "fixed to that container" and clip modals and drawers.
 *
 * The wrapper re-applies the admin colour tokens (scoped to .admin-theme)
 * without generating a box of its own.
 */
export default function Portal({ children, theme = 'admin-theme' }: { children: ReactNode; theme?: string }) {
  return createPortal(<div className={theme} style={{ display: 'contents' }}>{children}</div>, document.body)
}
