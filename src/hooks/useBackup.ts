import { useState } from 'react'
import { exportTrip, checkImport, restoreBackup, type ImportResult, type AtlasBackup } from '@/lib/backupRestore'
import { useTripStore } from '@/store/tripStore'

export function useBackup() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingConflict, setPendingConflict] = useState<AtlasBackup | null>(null)
  const setActiveTripId = useTripStore((s) => s.setActiveTripId)

  const exportBackup = async (tripId: string) => {
    if (isExporting) return
    setIsExporting(true)
    try {
      await exportTrip(tripId)
    } finally {
      setIsExporting(false)
    }
  }

  const importBackup = async (file: File): Promise<ImportResult> => {
    if (isImporting) return { status: 'error', message: 'Already importing' }
    setIsImporting(true)
    try {
      const result = await checkImport(file)
      if (result.status === 'success') {
        setActiveTripId(result.tripId)
      } else if (result.status === 'conflict') {
        setPendingConflict(result.backup)
      }
      return result
    } finally {
      setIsImporting(false)
    }
  }

  const resolveConflict = async (overwrite: boolean): Promise<ImportResult> => {
    if (!pendingConflict) return { status: 'error', message: 'No pending import' }
    if (!overwrite) {
      setPendingConflict(null)
      return { status: 'error', message: 'cancelled' }
    }
    setIsImporting(true)
    try {
      await restoreBackup(pendingConflict, true)
      setActiveTripId(pendingConflict.trip.id)
      const result: ImportResult = { status: 'success', tripId: pendingConflict.trip.id, tripName: pendingConflict.trip.name, isOverwrite: true }
      setPendingConflict(null)
      return result
    } finally {
      setIsImporting(false)
    }
  }

  return { exportBackup, importBackup, resolveConflict, pendingConflict, setPendingConflict, isExporting, isImporting }
}
