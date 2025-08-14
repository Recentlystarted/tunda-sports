'use client'

import { useState, useEffect } from 'react'
import { User, UserPlus, Edit, Trash2, Shield, Mail, Phone, Eye, EyeOff, Save, X, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdminUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: 'SUPERADMIN' | 'ADMIN'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  createdBy?: string
  creator?: {
    username: string
  }
}

export default function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ADMIN' as 'ADMIN' | 'SUPERADMIN'
  })

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      clearMessages()
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch (error) {
      setError('Network error while loading users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setActionLoading('create')
      clearMessages()
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('User created successfully')
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'ADMIN'
        })
        setIsCreateDialogOpen(false)
        loadUsers() // Refresh the list
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (error) {
      setError('Network error while creating user')
    } finally {
      setActionLoading('')
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setActionLoading('update')
      clearMessages()
        const updateData: any = { ...formData }
      if (!updateData.password) {
        delete updateData.password // Don't send empty password
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('User updated successfully')
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        loadUsers() 
      } else {
        setError(data.error || 'Failed to update user')
      }
    } catch (error) {
      setError('Network error while updating user')
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      setActionLoading(`toggle-${user.id}`)
      clearMessages()
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
        loadUsers() // Refresh the list
      } else {
        setError(data.error || 'Failed to update user status')
      }
    } catch (error) {
      setError('Network error while updating user status')
    } finally {
      setActionLoading('')
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(`delete-${user.id}`)
      clearMessages()
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('User deleted successfully')
        loadUsers() // Refresh the list
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('Network error while deleting user')
    } finally {
      setActionLoading('')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-destructive text-destructive-foreground'
      case 'ADMIN': return 'bg-primary text-primary-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage admin users and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new admin user to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="johndoe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'SUPERADMIN') => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={actionLoading === 'create'}
                  className="flex-1"
                >
                  {actionLoading === 'create' ? 'Creating...' : 'Create User'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {user.username}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(user.createdAt)}
                        {user.creator && ` by ${user.creator.username}`}
                        {user.lastLogin && (
                          <> • Last login: {formatDate(user.lastLogin)}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user)}
                    disabled={actionLoading === `toggle-${user.id}`}
                    className={user.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                  >
                    {actionLoading === `toggle-${user.id}` ? '...' : (user.isActive ? 'Deactivate' : 'Activate')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    disabled={actionLoading === `delete-${user.id}`}
                    className="text-red-600 hover:text-red-700"
                  >
                    {actionLoading === `delete-${user.id}` ? '...' : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Get started by creating your first admin user.</p>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editUsername">Username</Label>
              <Input
                id="editUsername"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="johndoe"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  id="editPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>              <Label htmlFor="editRole">Role</Label>
              <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'SUPERADMIN') => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUpdateUser} 
                disabled={actionLoading === 'update'}
                className="flex-1"
              >
                {actionLoading === 'update' ? 'Updating...' : 'Update User'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
