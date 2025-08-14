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

// GET - List all users (admins only)
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const users = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user (superadmin only)
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Check if user has permission to create users
  if (auth.admin.role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'Only superadmins can create users' },
      { status: 403 }
    )
  }

  try {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone
    } = await request.json()

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const existingUser = await prisma.admin.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
