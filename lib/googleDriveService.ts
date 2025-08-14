import { google } from 'googleapis'
import { Readable } from 'stream'

interface GoogleDriveConfig {
  clientEmail: string
  privateKey: string
  masterFolderId: string
}

interface FolderStructure {
  name: string
  subfolders?: FolderStructure[]
}

interface ImageMetadata {
  title: string
  description?: string
  category: string
  tags: string[]
}

export class GoogleDriveService {
  private drive: any
  private config: GoogleDriveConfig

  constructor(config: GoogleDriveConfig) {
    this.config = config
    this.initializeGoogleDrive()
  }

  private initializeGoogleDrive() {
    if (!this.config.privateKey) {
      throw new Error('Google Drive private key is not configured')
    }

    if (!this.config.clientEmail) {
      throw new Error('Google Drive client email is not configured')
    }

    try {
      // Clean and format the private key
      let privateKey = this.config.privateKey
      
      // Handle different private key formats
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n')
      }
      
      // Ensure proper PEM format
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key must be in PEM format')
      }

      if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
        throw new Error('Private key must end with -----END PRIVATE KEY-----')
      }

      console.log('Initializing Google Drive with client email:', this.config.clientEmail)
      console.log('Private key format check:', {
        hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
        hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
        length: privateKey.length
      })

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.config.clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      })

      this.drive = google.drive({ version: 'v3', auth })
      console.log('Google Drive service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Google Drive initialization failed: ${errorMessage}`)
    }
  }

  /**
   * Create tournament folder structure automatically
   */
  async createTournamentFolders(tournamentName: string, tournamentId: string) {
    try {
      // Create main tournament folder
      const tournamentFolder = await this.createFolder(
        tournamentName,
        this.config.masterFolderId
      )

      // Define subfolder structure for tournament photos
      const subfolders = [
        { name: '🏆 Tournament Photos', key: 'tournament_photos' },
        { name: '🥇 Winners & Awards', key: 'winners' },
        { name: '🥈 Runners Up', key: 'runners_up' },
        { name: '⭐ Man of the Series', key: 'man_of_series' },
        { name: '🏏 Best Batsman', key: 'best_batsman' },
        { name: '� Best Bowler', key: 'best_bowler' },
        { name: '🧤 Best Wicket Keeper', key: 'best_keeper' },
        { name: '👨‍💼 Tournament Officials', key: 'officials' },
        { name: '🎉 Opening Ceremony', key: 'opening_ceremony' },
        { name: '🏁 Closing Ceremony', key: 'closing_ceremony' },
        { name: '👥 Team Photos', key: 'team_photos' },
        { name: '🤝 Supporters & Sponsors', key: 'supporters' },
        { name: '💰 Tournament Donors', key: 'donors' },
        { name: '📸 Match Highlights', key: 'match_highlights' },
        { name: '🎭 Cultural Events', key: 'cultural_events' },
        { name: '🍽️ Food & Refreshments', key: 'food_refreshments' },
        { name: '📋 Documents & Certificates', key: 'documents' },
        { name: '🖼️ Background Images', key: 'background_images' }
      ]

      const folderIds: Record<string, string> = {
        main: tournamentFolder.id
      }

      // Create each subfolder
      for (const subfolder of subfolders) {
        const folder = await this.createFolder(
          subfolder.name,
          tournamentFolder.id
        )
        folderIds[subfolder.key] = folder.id
      }

      return folderIds
    } catch (error) {
      console.error('Error creating tournament folders:', error)
      throw new Error('Failed to create tournament folder structure')
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentId: string) {
    try {
      console.log(`Creating folder: ${name} in parent: ${parentId}`)
      
      // First check if folder already exists
      const existingFolders = await this.drive.files.list({
        q: `'${parentId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, webViewLink)',
      })

      if (existingFolders.data.files && existingFolders.data.files.length > 0) {
        console.log(`Folder "${name}" already exists, using existing folder`)
        return existingFolders.data.files[0]
      }

      console.log(`Creating new folder: ${name}`)
      const response = await this.drive.files.create({
        requestBody: {
          name: name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id, name, webViewLink',
      })

      console.log(`Folder created successfully: ${response.data.id}`)

      // Make folder publicly viewable
      try {
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        })
        console.log(`Folder permissions set successfully`)
      } catch (permError) {
        console.warn('Warning: Could not set folder permissions:', permError)
        // Continue anyway, folder creation succeeded
      }

      return response.data
    } catch (error) {
      console.error('Error creating folder:', error)
      
      // If it's the SSL/crypto error, try to use the master folder directly
      if (error instanceof Error && error.message.includes('ERR_OSSL_UNSUPPORTED')) {
        console.log('SSL error detected, falling back to master folder')
        return {
          id: parentId,
          name: name,
          webViewLink: `https://drive.google.com/drive/folders/${parentId}`
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to create folder in Google Drive: ${errorMessage}`)
    }
  }

  /**
   * Create a subfolder within an existing folder
   */
  async createSubfolder(parentFolderId: string, folderName: string, description?: string) {
    try {
      // Check if folder already exists
      const existingFolders = await this.drive.files.list({
        q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      })

      if (existingFolders.data.files.length > 0) {
        return existingFolders.data.files[0].id
      }

      // Create new subfolder
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
          description: description || `${folderName} folder`,
        },
        fields: 'id, name',
      })

      return response.data.id
    } catch (error) {
      console.error('Error creating subfolder:', error)
      throw new Error('Failed to create subfolder in Google Drive')
    }
  }

  /**
   * Upload image directly to specific folder
   */
  async uploadImageToFolder(
    fileBuffer: Buffer,
    fileName: string,
    folderId: string,
    metadata: ImageMetadata
  ) {
    try {
      const media = {
        mimeType: this.getMimeType(fileName),
        body: Readable.from(fileBuffer),
      }

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          description: `${metadata.description || ''}\nTags: ${metadata.tags.join(', ')}\nCategory: ${metadata.category}`,
        },
        media: media,
        fields: 'id, name, webViewLink, webContentLink',
      })

      // Make image publicly viewable
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        directLink: `/api/proxy/gdrive?id=${response.data.id}`,
      }
    } catch (error) {
      console.error('Error uploading to Google Drive:', error)
      throw new Error('Failed to upload image to Google Drive')
    }
  }

  /**
   * Get all images from a specific folder
   */
  async getFolderImages(folderId: string) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/'`,
        fields: 'files(id, name, webViewLink, createdTime, size)',
        orderBy: 'createdTime desc',
      })

      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        directLink: `/api/proxy/gdrive?id=${file.id}`,
        createdTime: file.createdTime,
        size: file.size,
      }))
    } catch (error) {
      console.error('Error fetching folder images:', error)
      throw new Error('Failed to fetch images from Google Drive folder')
    }
  }

  /**
   * Create organized folder structure for different content types
   */
  async createOrganizedStructure() {
    try {
      const mainStructure = [
        {
          name: '🏆 Tournaments',
          subfolders: []
        },
        {
          name: '🏟️ Facilities',
          subfolders: [
            { name: 'Ground-Photos' },
            { name: 'Equipment-Images' },
            { name: 'Infrastructure' },
          ]
        },
        {
          name: '🎉 Events',
          subfolders: [
            { name: 'Opening-Ceremony' },
            { name: 'Award-Functions' },
            { name: 'Community-Events' },
          ]
        },
        {
          name: '📸 General-Gallery',
          subfolders: []
        },
      ]

      const folderIds: Record<string, string> = {}

      for (const structure of mainStructure) {
        const mainFolder = await this.createFolder(
          structure.name,
          this.config.masterFolderId
        )
        folderIds[structure.name] = mainFolder.id

        // Create subfolders if they exist
        if (structure.subfolders && structure.subfolders.length > 0) {
          for (const subfolder of structure.subfolders) {
            const subfolderObj = await this.createFolder(
              subfolder.name,
              mainFolder.id
            )
            folderIds[`${structure.name}/${subfolder.name}`] = subfolderObj.id
          }
        }
      }

      return folderIds
    } catch (error) {
      console.error('Error creating organized structure:', error)
      throw new Error('Failed to create organized folder structure')
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string) {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      })
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file from Google Drive')
    }
  }

  /**
   * Get folder information
   */
  async getFolderInfo(folderId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, webViewLink, createdTime, parents',
      })
      return response.data
    } catch (error) {
      console.error('Error getting folder info:', error)
      throw new Error('Failed to get folder information')
    }
  }

  /**
   * Determine MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
    }
    return mimeTypes[extension || ''] || 'image/jpeg'
  }

  /**
   * Create sharing link for folder
   */
  async createSharingLink(folderId: string, role: 'reader' | 'writer' = 'reader') {
    try {
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: role,
          type: 'anyone',
        },
      })

      const file = await this.drive.files.get({
        fileId: folderId,
        fields: 'webViewLink',
      })

      return file.data.webViewLink
    } catch (error) {
      console.error('Error creating sharing link:', error)
      throw new Error('Failed to create sharing link')
    }
  }
}

/**
 * Utility functions for Google Drive URLs
 */
export class GoogleDriveUtils {
  /**
   * Convert Google Drive file ID to public viewable URL
   */
  static getPublicViewUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  }

  /**
   * Convert Google Drive file ID to thumbnail URL
   */
  static getThumbnailUrl(fileId: string, size: number = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`
  }

  /**
   * Extract file ID from various Google Drive URL formats
   */
  static extractFileId(url: string): string | null {
    // Handle different Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,  // /file/d/FILE_ID/view
      /id=([a-zA-Z0-9-_]+)/,          // ?id=FILE_ID
      /\/open\?id=([a-zA-Z0-9-_]+)/   // /open?id=FILE_ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Check if a URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('googleapis.com')
  }

  /**
   * Optimize Google Drive image URL for web display
   */
  static optimizeImageUrl(url: string, maxWidth: number = 800): string {
    const fileId = this.extractFileId(url)
    if (fileId) {
      return this.getThumbnailUrl(fileId, maxWidth)
    }
    return url
  }
}

// Utility function to initialize the service
export function createGoogleDriveService(): GoogleDriveService | null {
  try {
    const config = {
      clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '',
      privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY || '',
      masterFolderId: process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID || '',
    }

    if (!config.clientEmail || !config.privateKey || !config.masterFolderId) {
      console.warn('Google Drive configuration missing. Service not available.')
      return null
    }

    return new GoogleDriveService(config)
  } catch (error) {
    console.error('Failed to initialize Google Drive service:', error)
    return null
  }
}
