import { useState } from 'react'
import { exportSiteAsHTML } from '@/lib/exportGenerator'

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)

  async function exportSite(): Promise<void> {
    setIsExporting(true)
    try {
      await exportSiteAsHTML()
    } finally {
      setIsExporting(false)
    }
  }

  return { exportSite, isExporting }
}
