import { useState, useEffect, useCallback } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Global cache instance
const globalCache = new DataCache()

interface UseApiDataOptions {
  cacheKey?: string
  cacheTTL?: number
  retryAttempts?: number
  retryDelay?: number
}

interface UseApiDataReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
}

export function useApiData<T>(
  url: string,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const {
    cacheKey = url,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 2,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (attempt = 1): Promise<void> => {
    try {
      setError(null)
      
      // Check cache first
      const cachedData = globalCache.get<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Cache the result
      globalCache.set(cacheKey, result, cacheTTL)
      setData(result)
      setLoading(false)
      
    } catch (err) {
      console.error(`API error (attempt ${attempt}):`, err)
      
      if (attempt < retryAttempts) {
        setTimeout(() => {
          fetchData(attempt + 1)
        }, retryDelay * attempt)
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }
  }, [url, cacheKey, cacheTTL, retryAttempts, retryDelay])

  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache
  }
}

// Hook for optimized image loading with lazy loading and caching
export function useImageLoader(src: string, fallbackSrc?: string) {
  const [imageState, setImageState] = useState<{
    src: string
    loading: boolean
    error: boolean
  }>({
    src: src,
    loading: true,
    error: false
  })

  useEffect(() => {
    setImageState({ src, loading: true, error: false })
    
    const img = new Image()
    
    img.onload = () => {
      setImageState({ src, loading: false, error: false })
    }
    
    img.onerror = () => {
      if (fallbackSrc && src !== fallbackSrc) {
        setImageState({ src: fallbackSrc, loading: false, error: false })
      } else {
        setImageState({ src, loading: false, error: true })
      }
    }
    
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallbackSrc])

  return imageState
}

// Performance monitoring hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{
    loadTime: number
    renderTime: number
    memoryUsage?: number
  } | null>(null)

  useEffect(() => {
    const startTime = performance.now()
    
    // Measure initial render time
    const measureRender = () => {
      const renderTime = performance.now() - startTime
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize

      setMetrics({
        loadTime: startTime,
        renderTime,
        memoryUsage
      })
    }

    // Use requestIdleCallback if available, otherwise fallback to timeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(measureRender)
    } else {
      setTimeout(measureRender, 0)
    }
  }, [])

  return metrics
}

export { globalCache }
