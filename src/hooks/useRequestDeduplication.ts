import { useRef, useCallback } from 'react'

interface UseRequestDeduplicationOptions {
  delay?: number // Debounce delay in milliseconds
}

/**
 * Custom hook to prevent duplicate API requests
 * Provides debouncing and request deduplication functionality
 */
export function useRequestDeduplication<T extends any[]>(
  requestFn: (...args: T) => Promise<any> | void,
  options: UseRequestDeduplicationOptions = {}
) {
  const { delay = 300 } = options
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastArgsRef = useRef<string>()

  const debouncedRequest = useCallback(
    (...args: T) => {
      // Create a unique key for the request arguments
      const argsKey = JSON.stringify(args)
      
      // If the same request is already pending, don't make a new one
      if (lastArgsRef.current === argsKey) {
        return
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        lastArgsRef.current = argsKey
        requestFn(...args)
        
        // Clear the reference after a reasonable time to allow fresh requests
        setTimeout(() => {
          lastArgsRef.current = undefined
        }, 5000)
      }, delay)
    },
    [requestFn, delay]
  )

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    lastArgsRef.current = undefined
  }, [])

  return { debouncedRequest, clearPending }
}

/**
 * Hook for managing loading states of multiple requests
 */
export function useLoadingStates() {
  const loadingStatesRef = useRef<Set<string>>(new Set())

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    if (isLoading) {
      loadingStatesRef.current.add(key)
    } else {
      loadingStatesRef.current.delete(key)
    }
  }, [])

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStatesRef.current.has(key)
    }
    return loadingStatesRef.current.size > 0
  }, [])

  return { setLoading, isLoading }
}