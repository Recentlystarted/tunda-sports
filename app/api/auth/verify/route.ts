import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as any
    
    // Check if session exists in database
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    if (!session.admin.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      admin: session.admin
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
