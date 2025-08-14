import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createGoogleDriveService } from '@/lib/googleDriveService'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    
    // Try both 'image' and 'file' for backward compatibility
    const file = (formData.get('image') || formData.get('file')) as File
    const sectionId = formData.get('sectionId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file || !sectionId || !title) {
      return NextResponse.json(
        { error: 'File, section, and title are required' },
        { status: 400 }
      )
    }

    // Get tournament and section details
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id }
    })

    const section = await prisma.tournamentPhotoSection.findUnique({
      where: { 
        id: sectionId,
        tournamentId: params.id
      }
    })

    if (!tournament || !section) {
      return NextResponse.json(
        { error: 'Tournament or section not found' },
        { status: 404 }
      )
    }

    // Initialize Google Drive service
    const driveService = createGoogleDriveService()
    if (!driveService) {
      return NextResponse.json(
        { error: 'Google Drive service not available' },
        { status: 503 }
      )
    }

    // Ensure section has a Google Drive folder
    let targetFolderId = section.googleDriveFolderId
    
    if (!targetFolderId) {
      // Create main tournament folder if needed
      let mainFolderId = tournament.googleDriveFolderId
      
      if (!mainFolderId) {
        const mainFolder = await driveService.createFolder(
          tournament.name,
          process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID || ''
        )
        mainFolderId = mainFolder.id
        
        await prisma.tournament.update({
          where: { id: params.id },
          data: { googleDriveFolderId: mainFolderId }
        })
      }

      // Create section folder
      const sectionFolder = await driveService.createFolder(
        `${section.emoji ? section.emoji + ' ' : ''}${section.name}`,
        mainFolderId || ''
      )
      targetFolderId = sectionFolder.id
      
      // Update section with folder ID
      await prisma.tournamentPhotoSection.update({
        where: { id: sectionId },
        data: { googleDriveFolderId: targetFolderId || undefined }
      })
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name}`

    // Upload to Google Drive
    const uploadResult = await driveService.uploadImageToFolder(
      fileBuffer,
      fileName,
      targetFolderId || '',
      {
        title,
        description: description || '',
        category: 'tournament_photo',
        tags: [section.name]
      }
    )

    // Save image metadata to database
    const tournamentImage = await prisma.tournamentImage.create({
      data: {
        tournamentId: tournament.id,
        sectionId: section.id,
        filename: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        category: 'TOURNAMENT',
        description,
        googleDriveId: uploadResult.id,
        googleDriveUrl: uploadResult.webViewLink,
        publicUrl: uploadResult.directLink
      }
    })

    return NextResponse.json({
      success: true,
      image: tournamentImage,
      googleDriveData: uploadResult
    })

  } catch (error) {
    console.error('Error uploading tournament image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause: any = {
      tournamentId: params.id
    }

    if (category) {
      whereClause.category = category
    }

    const images = await prisma.tournamentImage.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      images
    })

  } catch (error) {
    console.error('Error fetching tournament images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
