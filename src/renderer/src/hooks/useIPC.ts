import { useEffect, useRef } from 'react'

export function useIPCListener<T>(
  subscribe: (callback: (data: T) => void) => () => void,
  callback: (data: T) => void
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsub = subscribe((data) => callbackRef.current(data))
    return unsub
  }, [subscribe])
}
