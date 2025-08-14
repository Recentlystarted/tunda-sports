import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock function to simulate Google Drive API integration
// In production, you would use the Google Drive API
async function getGoogleDriveImages(folderId: string) {
  // This is a simulation - in real implementation you would:
  // 1. Use Google Drive API with proper authentication
  // 2. List all images in the folder
  // 3. Get public URLs for each image
  
  // For now, we'll return mock data
  const mockImages = [
    {
      id: `gdrive-${folderId}-1`,
      name: 'Team Photo 1.jpg',
      webViewLink: `https://drive.google.com/file/d/mock-file-id-1/view`,
      thumbnailLink: `https://drive.google.com/thumbnail?id=mock-file-id-1&sz=w400`,
      size: '2456789',
      modifiedTime: new Date().toISOString()
    },
    {
      id: `gdrive-${folderId}-2`,
      name: 'Team Photo 2.jpg',
      webViewLink: `https://drive.google.com/file/d/mock-file-id-2/view`,
      thumbnailLink: `https://drive.google.com/thumbnail?id=mock-file-id-2&sz=w400`,
      size: '1845632',
      modifiedTime: new Date().toISOString()
    }
  ]

  return {
    images: mockImages,
    folderName: 'Cricket Team Photos'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle file upload via FormData
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const category = formData.get('category')?.toString() || '';
      const description = formData.get('description')?.toString() || '';
      
      // Simulate Google Drive upload and return URL
      const timestamp = Date.now();
      const webViewLink = `https://drive.google.com/file/d/${timestamp}/view`;
      return NextResponse.json({ success: true, webViewLink, url: webViewLink });
    }

    // Handle JSON import request
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    const { folderId, folderLink, title, description, category, tags } = body

    if (!folderId || !title) {
      return NextResponse.json(
        { error: 'Folder ID and title are required' },
        { status: 400 }
      )
    }

    // Get images from Google Drive folder
    const driveData = await getGoogleDriveImages(folderId)
    
    if (!driveData.images || driveData.images.length === 0) {
      return NextResponse.json(
        { error: 'No images found in the Google Drive folder' },
        { status: 400 }
      )
    }

    // Create a gallery collection entry
    const galleryCollection = await prisma.galleryImage.create({
      data: {
        filename: `${driveData.folderName}_collection`,
        originalName: driveData.folderName,
        mimeType: 'application/folder',
        size: driveData.images.reduce((total, img) => total + parseInt(img.size || '0'), 0),
        googleDriveUrl: folderLink,
        title,
        description: `Google Drive folder: ${driveData.folderName}. Contains ${driveData.images.length} images.\n\n${description || ''}`,
        category: category || 'GALLERY',
        tags: JSON.stringify(tags || [])
      }
    })

    // Create individual entries for each image in the folder
    const imageRecords = []
    for (let i = 0; i < driveData.images.length; i++) {
      const image = driveData.images[i]
      
      const imageRecord = await prisma.galleryImage.create({
        data: {
          filename: image.name,
          originalName: image.name,
          mimeType: 'image/jpeg', // Default to jpeg, could be improved
          size: parseInt(image.size || '0'),
          googleDriveId: image.id,
          googleDriveUrl: image.webViewLink,
          publicUrl: image.thumbnailLink,
          title: `${title} - ${image.name}`,
          description: `Part of Google Drive collection: ${driveData.folderName}`,
          category: category || 'GALLERY',
          tags: JSON.stringify([...(tags || []), 'google-drive', driveData.folderName.toLowerCase().replace(/\s+/g, '-')])
        }
      })
      
      imageRecords.push(imageRecord)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${driveData.images.length} images from Google Drive`,
      imageCount: driveData.images.length,
      folderName: driveData.folderName,
      collection: galleryCollection,
      images: imageRecords
    })

  } catch (error) {
    console.error('Google Drive import error:', error)
    return NextResponse.json(
      { error: 'Failed to import from Google Drive. Please check the folder link and permissions.' },
      { status: 500 }
    )
  }
}

// GET route to test Google Drive folder access
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folderId')

  if (!folderId) {
    return NextResponse.json(
      { error: 'Folder ID is required' },
      { status: 400 }
    )
  }

  try {
    const driveData = await getGoogleDriveImages(folderId)
    
    return NextResponse.json({
      success: true,
      folderName: driveData.folderName,
      imageCount: driveData.images.length,
      images: driveData.images.slice(0, 5) // Return first 5 images as preview
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to access Google Drive folder' },
      { status: 400 }
    )
  }
}
