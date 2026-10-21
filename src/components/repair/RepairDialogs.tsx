import { useState } from 'react'
import { Dialog } from './RepairTrackingUI'

export function ConfirmDialog({ title, description, confirmLabel, withReason, busy, onClose, onConfirm }: {
  title: string
  description: string
  confirmLabel: string
  withReason?: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Dialog title={title} description={description} onClose={onClose}>
      {withReason && (
        <label className="rt-field">
          <span>Reason (optional)</span>
          <textarea className="rt-input" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let us know why, so we can improve" />
        </label>
      )}
      <div className="rt-dialog-actions">
        <button type="button" className="rt-btn" onClick={onClose} disabled={busy}>Keep it</button>
        <button type="button" className="rt-btn rt-btn-primary" onClick={() => onConfirm(reason.trim())} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

export function CourierDialog({ busy, onClose, onSubmit }: {
  busy: boolean
  onClose: () => void
  onSubmit: (c: { courier_name: string; tracking_number: string; courier_date: string; courier_notes: string }) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [name, setName] = useState('')
  const [tracking, setTracking] = useState('')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const valid = name.trim() && tracking.trim()

  return (
    <Dialog
      title="Add shipping details"
      description="Pack your device securely and share the courier details so we can watch for it."
      onClose={onClose}
    >
      <form onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ courier_name: name.trim(), tracking_number: tracking.trim(), courier_date: date, courier_notes: notes.trim() }) }}>
        <div className="rt-field-row">
          <label className="rt-field">
            <span>Courier *</span>
            <input className="rt-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DTDC, Blue Dart" maxLength={100} required />
          </label>
          <label className="rt-field">
            <span>Tracking number *</span>
            <input className="rt-input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. D123456789" maxLength={100} required />
          </label>
        </div>
        <label className="rt-field">
          <span>Shipped on</span>
          <input className="rt-input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="rt-field">
          <span>Notes (optional)</span>
          <textarea className="rt-input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know about the package" />
        </label>
        <div className="rt-dialog-actions">
          <button type="button" className="rt-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="rt-btn rt-btn-primary" disabled={busy || !valid}>
            {busy ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

