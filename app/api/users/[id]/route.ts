import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Middleware to verify authentication and authorization
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return { error: 'No authentication token', status: 401 }
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as any

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        admin: true
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return { error: 'Invalid or expired session', status: 401 }
    }

    if (!session.admin.isActive) {
      return { error: 'Account is deactivated', status: 401 }
    }

    return { admin: session.admin }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: userId } = await params

  try {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      isActive
    } = await request.json()

    // Find the user to update
    const userToUpdate = await prisma.admin.findUnique({
      where: { id: userId }
    })

    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canUpdateRole = auth.admin.role === 'SUPERADMIN'
    const canUpdateOthers = auth.admin.role === 'SUPERADMIN'
    const isUpdatingSelf = auth.admin.id === userId

    if (!canUpdateOthers && !isUpdatingSelf) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (username) updateData.username = username
    if (email) updateData.email = email
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone

    // Only superadmin can change role and isActive
    if (canUpdateRole) {
      if (role) updateData.role = role
      if (isActive !== undefined) updateData.isActive = isActive
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Check for username/email conflicts
    if (username || email) {
      const conflictUser = await prisma.admin.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      })

      if (conflictUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.admin.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (superadmin only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: userId } = await params

  if (auth.admin.role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'Only superadmins can delete users' },
      { status: 403 }
    )
  }

  if (auth.admin.id === userId) {
    return NextResponse.json(
      { error: 'Cannot delete your own account' },
      { status: 400 }
    )
  }

  try {
    const userToDelete = await prisma.admin.findUnique({
      where: { id: userId }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete all sessions for this user first
    await prisma.userSession.deleteMany({
      where: { adminId: userId }
    })

    // Delete the user
    await prisma.admin.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
