'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugHome() {
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    addDebugInfo('Page loaded, starting initialization...')
    
    // Simple timeout without any complexity
    const timer = setTimeout(() => {
      addDebugInfo('Timer completed, setting loading to false')
      setLoading(false)
    }, 1000)

    addDebugInfo('Timer set for 1 second')

    return () => {
      clearTimeout(timer)
      addDebugInfo('Cleanup called')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">🏏 Tunda Sports Club</h1>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p>Simple Loading Test...</p>
          <Button onClick={() => setLoading(false)}>Skip Loading</Button>
          
          <div className="text-left bg-muted p-4 rounded max-w-md">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            {debugInfo.map((info, i) => (
              <div key={i} className="text-xs text-muted-foreground">{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">✅ Loading Complete!</h1>
        <p className="text-muted-foreground">The page loaded successfully.</p>
        <Button onClick={() => setLoading(true)}>Test Loading Again</Button>
        
        <div className="text-left bg-muted p-4 rounded max-w-md">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          {debugInfo.map((info, i) => (
            <div key={i} className="text-xs text-muted-foreground">{info}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
