import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/googleDriveService'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'PLAYER' // Use a valid enum value
    const title = formData.get('title') as string || 'Profile Image'
    const altText = formData.get('altText') as string || 'Profile Photo'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Initialize Google Drive service
    const googleDriveService = new GoogleDriveService({
      clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY!,
      masterFolderId: process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID!,
    })

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create profiles folder if it doesn't exist, or use master folder
    const masterFolderId = process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID!
    let profilesFolderId = masterFolderId
    
    try {
      // Try to create a profiles folder (will fail if it exists, which is fine)
      const profilesFolder = await googleDriveService.createFolder('profiles', masterFolderId)
      profilesFolderId = profilesFolder.id
    } catch (error) {
      // Folder might already exist, use master folder
      console.log('Using master folder for profile upload')
    }
    
    // Upload to Google Drive
    const uploadResult = await googleDriveService.uploadImageToFolder(
      buffer,
      `profile-${Date.now()}-${file.name}`,
      profilesFolderId,
      {
        title,
        description: `Profile image uploaded on ${new Date().toLocaleDateString()}`,
        category,
        tags: ['profile', 'team', 'member']
      }
    )

    // Return the public URL
    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.directLink,
      fileId: uploadResult.id,
      message: 'Profile image uploaded successfully'
    })

  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload profile image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
