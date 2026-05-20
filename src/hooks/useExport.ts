import { useState } from 'react'
import { exportTripAsHTML } from '@/lib/exportGenerator'

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)

  async function exportTrip(tripId: string): Promise<void> {
    setIsExporting(true)
    try {
      await exportTripAsHTML(tripId)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportTrip, isExporting }
}
