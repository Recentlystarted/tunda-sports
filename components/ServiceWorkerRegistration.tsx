'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Temporarily disable service worker registration during development
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker registration disabled in development')
      return
    }
    
    // Register service worker only in production and if supported
    if (
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  if (window.confirm('New content is available! Reload to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

// Utility function to clear all caches (useful for admin)
export const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('All caches cleared')
  }
}

// Utility function to check cache size
export const getCacheInfo = async () => {
  if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const cacheNames = await caches.keys()
    
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    
    return {
      totalUsage: usage,
      totalQuota: quota,
      cacheNames: cacheNames,
      usagePercentage: quota ? (usage / quota) * 100 : 0
    }
  }
  return null
}
