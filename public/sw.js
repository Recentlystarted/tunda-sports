// Service Worker for Tunda Sports Club
// Provides offline support and caching for better performance

const CACHE_NAME = 'tunda-sports-club-v2'
const STATIC_CACHE_NAME = 'tunda-static-v2'
const DYNAMIC_CACHE_NAME = 'tunda-dynamic-v2'

// Cache static assets - only cache files that definitely exist
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/logo.PNG'
]

// Cache API endpoints for offline access
const API_CACHE_PATTERNS = [
  '/api/landing/sections',
  '/api/tournaments',
  '/api/proxy/gdrive'
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip QR code requests - let them pass through directly
  if (url.pathname.includes('/uploads/qr-codes/') || url.pathname.includes('data:image')) {
    return
  }
  
  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isRealTimeAPIRequest(url)) {
    // Real-time APIs: Always fetch from network, never cache
    event.respondWith(fetch(request))
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request))
  } else {
    event.respondWith(handleNavigationRequest(request))
  }
})

// Check if request is for static assets
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('.css') ||
         url.pathname.includes('.woff') ||
         url.pathname.includes('.woff2')
}

// Check if request is for API endpoints that should be cached
function isAPIRequest(url) {
  // Only cache read-only API endpoints, not dynamic/user-specific ones
  const shouldCache = API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern))
  return url.pathname.startsWith('/api/') && shouldCache
}

// Check if request is for real-time API endpoints that should never be cached
function isRealTimeAPIRequest(url) {
  const realTimePatterns = [
    '/api/tournaments/',
    '/api/registrations/',
    '/auction-players/',
    '/auction-live/',
    '/team-owners/',
    '/approve-',
    '/reject-'
  ]
  return url.pathname.startsWith('/api/') && realTimePatterns.some(pattern => url.pathname.includes(pattern))
}

// Check if request is for images
function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
         url.hostname === 'lh3.googleusercontent.com' ||
         url.hostname === 'drive.google.com' ||
         url.pathname.startsWith('/api/proxy/gdrive')
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Static asset fetch failed:', error)
    return new Response('Asset not available', { status: 404 })
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('API request failed, trying cache:', error)
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return fallback response for API failures
    return new Response(JSON.stringify({
      success: false,
      error: 'Network unavailable',
      offline: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle image requests with cache-first strategy and longer TTL
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    // Check if cached image is still fresh (24 hours)
    if (cachedResponse) {
      const cacheDate = cachedResponse.headers.get('sw-cache-date')
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate)
        if (age < 24 * 60 * 60 * 1000) { // 24 hours
          return cachedResponse
        }
      } else {
        return cachedResponse // Return cached image if no date header
      }
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const responseWithDate = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cache-date': Date.now().toString()
        }
      })
      
      cache.put(request, responseWithDate)
    }
    
    return networkResponse
  } catch (error) {
    console.error('Image request failed:', error)
    
    // Try to return cached version
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return placeholder image for failed requests
    return new Response('', { status: 404 })
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    return await fetch(request)
  } catch (error) {
    console.error('Navigation request failed:', error)
    
    // Try to return cached index page for SPA navigation
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedIndex = await cache.match('/')
    
    if (cachedIndex) {
      return cachedIndex
    }
    
    return new Response('Offline - Please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
