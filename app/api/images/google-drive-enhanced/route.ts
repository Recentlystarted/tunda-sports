import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createGoogleDriveService } from '@/lib/googleDriveService'

const prisma = new PrismaClient()

// POST - Enhanced Google Drive operations
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    const driveService = createGoogleDriveService()
    if (!driveService) {
      return NextResponse.json(
        { error: 'Google Drive service not configured' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'create-tournament-folders':
        return await createTournamentFolders(driveService, data)
      
      case 'upload-to-folder':
        return await uploadToSpecificFolder(driveService, data)
      
      case 'upload-to-auction-players':
        return await uploadToAuctionPlayersFolder(driveService, data)
      
      case 'import-folder-images':
        return await importFolderImages(driveService, data)
      
      case 'setup-initial-structure':
        return await setupInitialStructure(driveService)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google Drive API error:', error)
    return NextResponse.json(
      { error: 'Google Drive operation failed' },
      { status: 500 }
    )
  }
}

async function createTournamentFolders(driveService: any, data: any) {
  const { tournamentName, tournamentId } = data

  if (!tournamentName || !tournamentId) {
    return NextResponse.json(
      { error: 'Tournament name and ID required' },
      { status: 400 }
    )
  }

  try {
    // Create folder structure in Google Drive
    const folderIds = await driveService.createTournamentFolders(tournamentName, tournamentId)

    // Update tournament record with folder IDs
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        googleDriveFolderId: folderIds.main,
        // Store subfolder IDs in playersPool field as JSON (temporary solution)
        playersPool: JSON.stringify({
          googleDriveData: {
            mainFolderId: folderIds.main,
            photosFolderId: folderIds.photos,
            backgroundFolderId: folderIds.background,
            rulesFolderId: folderIds.rules,
            resultsFolderId: folderIds.results,
            teamsFolderId: folderIds.teams,
            highlightsFolderId: folderIds.highlights,
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tournament folders created successfully',
      folderIds,
      mainFolderLink: `https://drive.google.com/drive/folders/${folderIds.main}`
    })
  } catch (error) {
    console.error('Error creating tournament folders:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament folders' },
      { status: 500 }
    )
  }
}

async function uploadToSpecificFolder(driveService: any, data: any) {
  const { fileBuffer, fileName, folderId, metadata, tournamentId } = data

  try {
    // Upload to Google Drive
    const uploadResult = await driveService.uploadImageToFolder(
      Buffer.from(fileBuffer),
      fileName,
      folderId,
      metadata
    )

    // Save to database
    const image = await prisma.galleryImage.create({
      data: {
        filename: fileName,
        originalName: fileName,
        mimeType: metadata.mimeType || 'image/jpeg',
        size: parseInt(metadata.size) || 0,
        googleDriveId: uploadResult.id,
        googleDriveUrl: uploadResult.directLink,
        publicUrl: uploadResult.directLink,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        tags: JSON.stringify(metadata.tags || []),
        uploadedBy: 'admin',
        isPublic: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image uploaded to Google Drive successfully',
      image,
      googleDriveLink: uploadResult.webViewLink
    })
  } catch (error) {
    console.error('Error uploading to specific folder:', error)
    return NextResponse.json(
      { error: 'Failed to upload to Google Drive folder' },
      { status: 500 }
    )
  }
}

async function importFolderImages(driveService: any, data: any) {
  const { folderId, category, tournamentId } = data

  try {
    // Get all images from the folder
    const folderImages = await driveService.getFolderImages(folderId)

    // Import each image to database
    const importPromises = folderImages.map(async (image: any) => {
      return prisma.galleryImage.create({
        data: {
          filename: image.name,
          originalName: image.name,
          mimeType: image.mimeType || 'image/jpeg',
          size: parseInt(image.size) || 0,
          googleDriveId: image.id,
          googleDriveUrl: image.directLink,
          publicUrl: image.directLink,
          title: image.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          category: category,
          tags: JSON.stringify([]),
          uploadedBy: 'admin',
          isPublic: true,
        }
      })
    })

    const importedImages = await Promise.all(importPromises)

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedImages.length} images`,
      importedCount: importedImages.length,
      images: importedImages
    })
  } catch (error) {
    console.error('Error importing folder images:', error)
    return NextResponse.json(
      { error: 'Failed to import folder images' },
      { status: 500 }
    )
  }
}

async function setupInitialStructure(driveService: any) {
  try {
    // Create the main organized folder structure
    const folderIds = await driveService.createOrganizedStructure()

    // Store the main folder IDs in a configuration table or environment
    // For now, we'll return them to be saved manually
    return NextResponse.json({
      success: true,
      message: 'Initial folder structure created',
      folderIds,
      instructions: 'Save these folder IDs in your environment variables for future use'
    })
  } catch (error) {
    console.error('Error setting up initial structure:', error)
    return NextResponse.json(
      { error: 'Failed to setup initial folder structure' },
      { status: 500 }
    )
  }
}

async function uploadToAuctionPlayersFolder(driveService: any, data: any) {
  const { fileBuffer, fileName, tournamentId, tournamentFolderId, metadata } = data

  try {
    // Create "Auction Players" subfolder if it doesn't exist
    const auctionPlayersFolderId = await driveService.createSubfolder(
      tournamentFolderId,
      'Auction Players',
      `Player photos for auction tournament`
    )

    // Upload to Google Drive
    const uploadResult = await driveService.uploadImageToFolder(
      Buffer.from(fileBuffer),
      fileName,
      auctionPlayersFolderId,
      metadata
    )

    // Save to database
    const image = await prisma.galleryImage.create({
      data: {
        filename: fileName,
        originalName: fileName,
        mimeType: metadata.mimeType || 'image/jpeg',
        size: parseInt(metadata.size) || 0,
        googleDriveId: uploadResult.id,
        googleDriveUrl: uploadResult.directLink,
        publicUrl: uploadResult.directLink,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        tags: JSON.stringify(metadata.tags || []),
        uploadedBy: 'player',
        isPublic: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Player photo uploaded to tournament auction folder successfully',
      image,
      googleDriveLink: uploadResult.webViewLink,
      auctionPlayersFolderId
    })
  } catch (error) {
    console.error('Error uploading to auction players folder:', error)
    return NextResponse.json(
      { error: 'Failed to upload to auction players folder' },
      { status: 500 }
    )
  }
}
