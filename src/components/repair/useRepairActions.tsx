import { useState, type ReactNode } from 'react'
import { repairService, type RepairTicket } from '../../services/repairService'
import { useToast } from '../../context/ToastContext'
import { ConfirmDialog, CourierDialog } from './RepairDialogs'

function errorMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: { message?: string } } })?.response?.data
  return data?.message || fallback
}

export type PendingAction =
  | { kind: 'decline'; ticket: RepairTicket }
  | { kind: 'cancel'; ticket: RepairTicket }
  | { kind: 'courier'; ticket: RepairTicket }

/**
 * Customer actions on a ticket. Every action resolves to the refreshed ticket via onUpdated.
 * Destructive or form-based actions open a dialog; render `dialog` somewhere inside `.rt`.
 */
export type RepairActions = ReturnType<typeof useRepairActions>

export function useRepairActions(onUpdated: (t: RepairTicket) => void) {
  const toast = useToast()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const run = async (ticket: RepairTicket, fn: () => Promise<RepairTicket>, ok: string, fail: string) => {
    setBusyId(ticket.id)
    try {
      const updated = await fn()
      onUpdated(updated)
      toast.show(ok, 'success')
      setPending(null)
      return true
    } catch (e) {
      toast.show(errorMessage(e, fail), 'error')
      return false
    } finally {
      setBusyId(null)
    }
  }

  const approve = (t: RepairTicket) =>
    run(t, () => repairService.customerApprove(t.id), 'Estimate approved — repair will begin shortly.', 'Could not approve the estimate.')

  const close = () => setPending(null)
  const busy = pending ? busyId === pending.ticket.id : false

  let dialog: ReactNode = null
  if (pending?.kind === 'decline') {
    dialog = (
      <ConfirmDialog
        title="Decline this estimate?"
        description="We won't repair the device and the request will be closed. We'll get in touch to arrange its return."
        confirmLabel="Decline estimate"
        busy={busy}
        onClose={close}
        onConfirm={() => run(pending.ticket, () => repairService.customerDecline(pending.ticket.id), 'Estimate declined.', 'Could not decline the estimate.')}
      />
    )
  } else if (pending?.kind === 'cancel') {
    dialog = (
      <ConfirmDialog
        title="Cancel this repair request?"
        description={`${pending.ticket.deviceBrand} ${pending.ticket.deviceModel} · ${pending.ticket.repairId}. This can't be undone.`}
        confirmLabel="Cancel request"
        withReason
        busy={busy}
        onClose={close}
        onConfirm={(reason) => run(pending.ticket, () => repairService.cancelMyTicket(pending.ticket.id, reason), 'Repair request cancelled.', 'Could not cancel this request.')}
      />
    )
  } else if (pending?.kind === 'courier') {
    dialog = (
      <CourierDialog
        busy={busy}
        onClose={close}
        onSubmit={(c) => run(pending.ticket, () => repairService.submitMyCourier(pending.ticket.id, c), 'Shipping details saved. We will confirm when it arrives.', 'Could not save shipping details.')}
      />
    )
  }

  return {
    busyId,
    approve,
    decline: (ticket: RepairTicket) => setPending({ kind: 'decline', ticket }),
    cancel: (ticket: RepairTicket) => setPending({ kind: 'cancel', ticket }),
    ship: (ticket: RepairTicket) => setPending({ kind: 'courier', ticket }),
    dialog,
  }
}
