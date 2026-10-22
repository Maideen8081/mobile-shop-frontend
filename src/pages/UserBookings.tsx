import { useState, useCallback } from 'react'
import PageLayout from '../components/layout/PageLayout'
import RepairTicketManagement from '../components/repair/RepairTicketManagement'

export default function UserBookings() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const handleRefresh = useCallback(() => setRefreshTrigger((p) => p + 1), [])

  return (
    <PageLayout title="Online booking">
      <RepairTicketManagement refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
    </PageLayout>
  )
}
