'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Mail, 
  DollarSign, 
  Database, 
  Shield, 
  Bell, 
  Users,
  ChevronRight,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SettingCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<any>
  status?: 'configured' | 'pending' | 'disabled'
  badge?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/auth/verify")
        if (res.ok) {
          const data = await res.json()
          const role = data.admin?.role
          setUserRole(role)
          
          // Redirect if not SUPERADMIN
          if (role !== "SUPERADMIN") {
            router.push('/admin')
            return
          }
        } else {
          router.push('/login')
          return
        }
      } catch (error) {
        console.error("Error checking access:", error)
        router.push('/login')
        return
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router])

  const settingsCards: SettingCard[] = [
    {
      title: 'Email Management',
      description: 'Configure email settings, SMTP servers, and notification templates for tournaments and registrations.',
      href: '/admin/settings/email',
      icon: Mail,
      status: 'configured',
      badge: 'Active'
    },
    {
      title: 'Payment Settings',
      description: 'Configure global UPI ID, mobile number, and bank details used as defaults for all tournament payment methods.',
      href: '/admin/settings/payment',
      icon: DollarSign,
      status: 'configured',
      badge: 'Active'
    },
    {
      title: 'User Management',
      description: 'Configure user roles, permissions, and access levels for administrators and team owners.',
      href: '/admin/users',
      icon: Users,
      status: 'configured',
      badge: 'SUPERADMIN Only'
    },
    {
      title: 'Security Settings',
      description: 'Manage authentication, session timeouts, and security policies for the admin panel.',
      href: '/admin/settings/security',
      icon: Shield,
      status: 'pending',
      badge: 'Coming Soon'
    },
    {
      title: 'Database Management',
      description: 'Database backup, restoration, and maintenance tools for tournament and user data.',
      href: '/admin/settings/database',
      icon: Database,
      status: 'pending',
      badge: 'Coming Soon'
    },
    {
      title: 'Notification Settings',
      description: 'Configure push notifications, email alerts, and system announcements.',
      href: '/admin/settings/notifications',
      icon: Bell,
      status: 'disabled',
      badge: 'Coming Soon'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (userRole !== "SUPERADMIN") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You need SUPERADMIN privileges to access this page.
          </p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'configured':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'disabled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and administrative settings.
        </p>
      </div>

      <Separator />

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((setting) => {
          const Icon = setting.icon
          const isDisabled = setting.status === 'disabled' || setting.status === 'pending'
          
          const CardWrapper = ({ children }: { children: React.ReactNode }) => {
            if (isDisabled) {
              return (
                <Card className="relative group cursor-not-allowed opacity-60">
                  {children}
                </Card>
              )
            }
            
            return (
              <Link href={setting.href}>
                <Card className="relative group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20">
                  {children}
                </Card>
              </Link>
            )
          }

          return (
            <CardWrapper key={setting.title}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{setting.title}</CardTitle>
                      {setting.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 text-xs ${getStatusColor(setting.status)}`}
                        >
                          {setting.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isDisabled && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {setting.description}
                </CardDescription>
              </CardContent>
            </CardWrapper>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/settings/email">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Mail className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Email Settings</div>
                <div className="text-xs text-muted-foreground">Configure SMTP</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/admin/settings/payment">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <DollarSign className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Global Payment Settings</div>
                <div className="text-xs text-muted-foreground">UPI & Bank details</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/admin/tournaments">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Settings className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Tournament Payments</div>
                <div className="text-xs text-muted-foreground">QR codes & methods</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/admin/users">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Users className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">User Management</div>
                <div className="text-xs text-muted-foreground">Manage users</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
