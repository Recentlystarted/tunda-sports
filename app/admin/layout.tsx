'use client'

import { Inter } from 'next/font/google'
import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import Protected from '@/components/auth/Protected'

const inter = Inter({ subsets: ['latin'] })

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Protected roles={['ADMIN', 'SUPERADMIN']}>
      <div className="min-h-screen bg-background">        
        {/* Admin Layout */}
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <AdminSidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            className="md:block"
          />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Admin Header */}
            <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
            
            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
              {children}
            </main>
          </div>
        </div>
      </div>
    </Protected>
  )
}
