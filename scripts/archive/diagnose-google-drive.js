const { GoogleDriveService } = require('./lib/googleDriveService')

async function diagnoseGoogleDrive() {
  console.log('🔍 Google Drive Configuration Diagnosis')
  console.log('=====================================')
  
  // Check environment variables
  console.log('\n1. Environment Variables Check:')
  console.log('GOOGLE_DRIVE_CLIENT_EMAIL:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing')
  console.log('GOOGLE_DRIVE_PRIVATE_KEY:', process.env.GOOGLE_DRIVE_PRIVATE_KEY ? '✅ Set' : '❌ Missing')
  console.log('GOOGLE_DRIVE_MASTER_FOLDER_ID:', process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID ? '✅ Set' : '❌ Missing')
  
  if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID) {
    console.log('\n❌ Missing required environment variables. Please check your .env file.')
    return
  }
  
  // Check private key format
  console.log('\n2. Private Key Format Check:')
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY
  console.log('Private key length:', privateKey.length)
  console.log('Has BEGIN marker:', privateKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌')
  console.log('Has END marker:', privateKey.includes('-----END PRIVATE KEY-----') ? '✅' : '❌')
  console.log('Has escaped newlines:', privateKey.includes('\\n') ? '✅' : '❌')
  
  // Try to initialize Google Drive Service
  console.log('\n3. Google Drive Service Initialization:')
  try {
    const driveService = new GoogleDriveService({
      clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
      masterFolderId: process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID,
    })
    console.log('✅ Google Drive service initialized successfully')
    
    // Try to create a test folder
    console.log('\n4. Test Folder Creation:')
    try {
      const testFolder = await driveService.createFolder(
        'Test Folder - ' + Date.now(),
        process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID
      )
      console.log('✅ Test folder created successfully:', testFolder.id)
      console.log('   Folder URL:', testFolder.webViewLink)
    } catch (folderError) {
      console.log('❌ Failed to create test folder:', folderError.message)
      
      if (folderError.message.includes('ERR_OSSL_UNSUPPORTED')) {
        console.log('\n🔧 SOLUTION: SSL/Crypto Error Detected')
        console.log('This error occurs when the private key format is incompatible with your Node.js version.')
        console.log('Try these solutions:')
        console.log('1. Regenerate the Google service account key in PKCS#8 format')
        console.log('2. Update Node.js to a more recent version')
        console.log('3. Use the fallback mechanism (master folder only)')
      }
    }
    
  } catch (initError) {
    console.log('❌ Failed to initialize Google Drive service:', initError.message)
    
    if (initError.message.includes('Private key must be in PEM format')) {
      console.log('\n🔧 SOLUTION: Private Key Format Issue')
      console.log('Your private key is not in the correct format.')
      console.log('Make sure it starts with -----BEGIN PRIVATE KEY----- and ends with -----END PRIVATE KEY-----')
    }
  }
  
  console.log('\n✅ Diagnosis complete!')
}

diagnoseGoogleDrive().catch(console.error)
