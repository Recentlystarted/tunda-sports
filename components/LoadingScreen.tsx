'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  isLoading?: boolean
  message?: string
  onSkip?: () => void
}

export default function LoadingScreen({ isLoading = true, message = 'Loading...', onSkip }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(message)

  const loadingMessages = [
    'Loading cricket data...',
    'Fetching tournament info...',
    'Preparing gallery images...',
    'Almost ready...'
  ]

  // Fix hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading || !mounted) return

    let messageIndex = 0
    
    // Faster progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 100
        return prev + Math.random() * 20 + 5 // Faster progress
      })
    }, 150) // Faster interval

    // Shorter message intervals
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++
        setCurrentMessage(loadingMessages[messageIndex])
      }
    }, 500) // Faster message changes

    // Auto-complete after a short time
    const autoCompleteTimer = setTimeout(() => {
      setProgress(100)
    }, 1200)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      clearTimeout(autoCompleteTimer)
    }
  }, [isLoading, mounted])

  // Return simple loading state during hydration
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Cricket Logo Animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <div className="text-3xl animate-bounce">🏏</div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg className="w-24 h-24 rotate-[-90deg]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-300 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {currentMessage}
          </h3>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* Skip Button */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip loading
          </button>
        )}
      </div>
    </div>
  )
}
