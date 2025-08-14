import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createGoogleDriveService } from '@/lib/googleDriveService'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sections = await prisma.tournamentPhotoSection.findMany({
      where: {
        tournamentId: params.id,
        isActive: true
      },
      include: {
        images: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            images: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      sections
    })

  } catch (error) {
    console.error('Error fetching tournament sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, emoji } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      )
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Get the next order number
    const maxOrder = await prisma.tournamentPhotoSection.aggregate({
      where: { tournamentId: params.id },
      _max: { order: true }
    })

    const nextOrder = (maxOrder._max.order || 0) + 1

    // Create Google Drive folder for this section
    let googleDriveFolderId = null
    try {
      const driveService = createGoogleDriveService()
      if (driveService) {
        // Create or get tournament main folder
        let mainFolderId = tournament.googleDriveFolderId
        
        if (!mainFolderId) {
          const mainFolder = await driveService.createFolder(
            tournament.name,
            process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID || ''
          )
          mainFolderId = mainFolder.id
          
          // Update tournament with main folder ID
          await prisma.tournament.update({
            where: { id: params.id },
            data: { googleDriveFolderId: mainFolderId }
          })
        }

        // Create section folder
        const sectionFolder = await driveService.createFolder(
          `${emoji ? emoji + ' ' : ''}${name}`,
          mainFolderId || ''
        )
        googleDriveFolderId = sectionFolder.id
      }
    } catch (driveError) {
      console.error('Failed to create Google Drive folder:', driveError)
      // Continue without folder - can be created later
    }

    // Create photo section
    const section = await prisma.tournamentPhotoSection.create({
      data: {
        tournamentId: params.id,
        name,
        description,
        emoji,
        order: nextOrder,
        googleDriveFolderId
      },
      include: {
        images: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      section
    })

  } catch (error) {
    console.error('Error creating tournament section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}
