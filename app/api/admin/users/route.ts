import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET /api/admin/users - Get all users from different models
export async function GET() {
  try {
    // Get all admins
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Get all players
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Get all team owners
    const teamOwners = await prisma.teamOwner.findMany({
      select: {
        id: true,
        ownerName: true,
        ownerEmail: true,
        verified: true,
        createdAt: true,
      }
    })

    // Get all scorers
    const scorers = await prisma.scorer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Format all users into a unified structure
    const allUsers = [
      ...admins.map(admin => ({
        id: admin.id,
        name: admin.name || admin.username, // Use name field, fallback to username
        email: admin.email,
        role: admin.role, // Use actual role from database (ADMIN or SUPERADMIN)
        status: admin.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
        createdAt: admin.createdAt.toISOString(),
        type: 'admin'
      })),
      ...players.map(player => ({
        id: player.id,
        name: player.name,
        email: player.email || '',
        role: 'PLAYER' as const,
        status: player.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
        createdAt: player.createdAt.toISOString(),
        type: 'player'
      })),
      ...teamOwners.map(owner => ({
        id: owner.id,
        name: owner.ownerName,
        email: owner.ownerEmail,
        role: 'TEAM_OWNER' as const,
        status: owner.verified ? 'ACTIVE' as const : 'PENDING' as const,
        createdAt: owner.createdAt.toISOString(),
        type: 'teamOwner'
      })),
      ...scorers.map(scorer => ({
        id: scorer.id,
        name: scorer.name,
        email: scorer.email || '',
        role: 'SCORER' as const,
        status: scorer.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
        createdAt: scorer.createdAt.toISOString(),
        type: 'scorer'
      }))
    ]

    // Sort by creation date
    allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const { name, email, role, password, tournamentId } = await request.json()

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    let newUser;

    switch (role) {
      case 'ADMIN':
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
          where: { email }
        })
        if (existingAdmin) {
          return NextResponse.json(
            { error: 'Admin with this email already exists' },
            { status: 400 }
          )
        }
        
        newUser = await prisma.admin.create({
          data: {
            name: name,
            username: name.toLowerCase().replace(/\s+/g, ''), // Generate username from name
            email,
            password: hashedPassword,
            role: 'ADMIN'
          }
        })
        
        return NextResponse.json({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role,
          status: 'ACTIVE',
          createdAt: newUser.createdAt.toISOString()
        })

      case 'PLAYER':
        newUser = await prisma.player.create({
          data: {
            name,
            email,
            position: 'ALL_ROUNDER',
            experience: 'BEGINNER',
            battingStyle: 'RIGHT_HANDED',
            bowlingStyle: 'RIGHT_ARM_MEDIUM'
          }
        })
        
        return NextResponse.json({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role,
          status: 'ACTIVE',
          createdAt: newUser.createdAt.toISOString()
        })

      case 'TEAM_OWNER':
        // For team owners, we need a tournament ID
        if (!tournamentId) {
          return NextResponse.json(
            { error: 'Tournament ID is required for team owners' },
            { status: 400 }
          )
        }
        
        // Get the next team index
        const teamCount = await prisma.teamOwner.count({
          where: { tournamentId }
        })
        
        newUser = await prisma.teamOwner.create({
          data: {
            tournamentId,
            teamName: `Team ${teamCount + 1}`,
            teamIndex: teamCount + 1,
            ownerName: name,
            ownerEmail: email,
            ownerPhone: '0000000000', // Default phone
          }
        })
        
        return NextResponse.json({
          id: newUser.id,
          name: newUser.ownerName,
          email: newUser.ownerEmail,
          role,
          status: 'PENDING',
          createdAt: newUser.createdAt.toISOString()
        })

      case 'SCORER':
        newUser = await prisma.scorer.create({
          data: {
            name,
            email
          }
        })
        
        return NextResponse.json({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role,
          status: 'ACTIVE',
          createdAt: newUser.createdAt.toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
