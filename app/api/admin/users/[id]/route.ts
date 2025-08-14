import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, type, name, email, role } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let updatedUser;

    // Handle status-only updates (for existing functionality)
    if (status && !name && !email && !role) {
      // Find the user type if not provided
      if (!type) {
        const admin = await prisma.admin.findUnique({ where: { id } })
        if (admin) {
          updatedUser = await prisma.admin.update({
            where: { id },
            data: { isActive: status === 'ACTIVE' }
          })
          
          return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name || updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
            createdAt: updatedUser.createdAt.toISOString()
          })
        }

        const player = await prisma.player.findUnique({ where: { id } })
        if (player) {
          updatedUser = await prisma.player.update({
            where: { id },
            data: { isActive: status === 'ACTIVE' }
          })
          
          return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: 'PLAYER',
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
            createdAt: updatedUser.createdAt.toISOString()
          })
        }

        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Handle full user updates (name, email, role)
    if (name || email || role) {
      // Only allow admin user updates for now
      const admin = await prisma.admin.findUnique({ where: { id } })
      if (admin) {
        const updateData: any = {}
        if (name) {
          updateData.name = name
          updateData.username = name.toLowerCase().replace(/\s+/g, '') // Update username too
        }
        if (email) updateData.email = email
        if (role) updateData.role = role

        updatedUser = await prisma.admin.update({
          where: { id },
          data: updateData
        })
        
        return NextResponse.json({
          id: updatedUser.id,
          name: updatedUser.name || updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
          createdAt: updatedUser.createdAt.toISOString()
        })
      }

      return NextResponse.json(
        { error: 'User not found or not an admin user' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Try to delete from each model
    try {
      await prisma.admin.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Admin deleted' })
    } catch (e) {}

    try {
      await prisma.player.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Player deleted' })
    } catch (e) {}

    try {
      await prisma.teamOwner.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Team Owner deleted' })
    } catch (e) {}

    try {
      await prisma.scorer.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Scorer deleted' })
    } catch (e) {}

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
