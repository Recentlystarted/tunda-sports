import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For demo purposes, check if password is plain text (from seed)
    // In production, always use hashed passwords
    let isValidPassword = false
    if (admin.password.startsWith('$2')) {
      // Password is hashed
      isValidPassword = await bcrypt.compare(password, admin.password)
    } else {
      // Password is plain text (demo/seed data)
      isValidPassword = password === admin.password
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id,
        username: admin.username,
        role: admin.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    )
    
    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    })

    // Return user data (without password) and token
    const { password: _, ...adminData } = admin

    const response = NextResponse.json({
      success: true,
      admin: adminData,
      token
    })

    // Set HTTP-only cookie for token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours in seconds
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
