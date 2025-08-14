'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'TEAM_OWNER' | 'PLAYER' | 'SCORER'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  createdAt: string
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  TEAM_OWNER: 'bg-blue-100 text-blue-800',
  PLAYER: 'bg-green-100 text-green-800',
  SCORER: 'bg-yellow-100 text-yellow-800'
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800'
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'PLAYER',
    password: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully"
        })
        setIsCreateOpen(false)
        setNewUser({ name: '', email: '', role: 'PLAYER', password: '' })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    }
  }

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User status updated successfully"
        })
        fetchUsers()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role-based permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TEAM_OWNER">Team Owner</SelectItem>
                    <SelectItem value="PLAYER">Player</SelectItem>
                    <SelectItem value="SCORER">Scorer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <Button onClick={createUser} className="w-full">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge className={roleColors[user.role]}>
                          {user.role}
                        </Badge>
                        <Badge className={statusColors[user.status]}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={user.status}
                        onValueChange={(value) => updateUserStatus(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
