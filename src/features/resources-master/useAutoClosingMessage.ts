import { useCallback, useEffect, useRef, useState } from 'react'

export function useAutoClosingMessage(timeoutMs = 4000) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (nextMessage: string) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      setMessage(nextMessage)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setMessage(null)
      }, timeoutMs)
    },
    [timeoutMs],
  )

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    },
    [],
  )

  return [message, show] as const
}
