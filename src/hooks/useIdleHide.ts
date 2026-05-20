import { useState, useEffect } from 'react'

const IDLE_MS = 3000

export function useIdleHide() {
  const [isIdle, setIsIdle] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      setIsIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIsIdle(true), IDLE_MS)
    }

    document.addEventListener('mousemove', reset)
    document.addEventListener('mousedown', reset)
    document.addEventListener('keydown', reset)
    reset()

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousemove', reset)
      document.removeEventListener('mousedown', reset)
      document.removeEventListener('keydown', reset)
    }
  }, [])

  return isIdle
}
