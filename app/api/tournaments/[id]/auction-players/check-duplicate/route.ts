import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check for duplicate player in the same tournament
    const existingPlayer = await prisma.auctionPlayer.findFirst({
      where: {
        tournamentId: params.id,
        OR: [
          {
            AND: [
              { name: { contains: name.trim() } },
              { phone: phone.trim() }
            ]
          },
          {
            AND: [
              { name: { contains: name.trim() } },
              { email: email?.trim() || '' }
            ]
          },
          {
            phone: phone.trim()
          }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        position: true,
        auctionStatus: true,
        createdAt: true
      }
    })

    if (existingPlayer) {
      return NextResponse.json({
        exists: true,
        player: existingPlayer
      })
    }

    return NextResponse.json({
      exists: false,
      player: null
    })

  } catch (error) {
    console.error('Error checking duplicate player:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicate player' },
      { status: 500 }
    )
  }
}
