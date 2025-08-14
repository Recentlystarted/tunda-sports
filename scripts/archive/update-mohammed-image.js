const { PrismaClient } = require('@prisma/client')

async function updateMohammedProfileImage() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Updating Mohammed Faruk profile image...')
    
    // First, let's see current state
    const mohammed = await prisma.person.findFirst({
      where: {
        OR: [
          { name: { contains: 'Mohammed' } },
          { name: { contains: 'Faruk' } }
        ]
      }
    })
    
    if (!mohammed) {
      console.log('❌ Mohammed Faruk not found in database')
      return
    }
    
    console.log('📋 Current state:')
    console.log(`   Name: ${mohammed.name}`)
    console.log(`   Profile Image: ${mohammed.profileImage || 'Not set'}`)
    
    // Update with a mock image URL for testing
    const mockImageUrl = '/api/proxy/gdrive?id=1_mock_mohammed_faruk_image_id'
    
    const updatedMohammed = await prisma.person.update({
      where: { id: mohammed.id },
      data: {
        profileImage: mockImageUrl
      }
    })
    
    console.log('✅ Updated successfully!')
    console.log(`   New Profile Image: ${updatedMohammed.profileImage}`)
    
    // Verify the update
    const verifyMohammed = await prisma.person.findUnique({
      where: { id: mohammed.id }
    })
    
    console.log('🔍 Verification:')
    console.log(`   Name: ${verifyMohammed.name}`)
    console.log(`   Profile Image: ${verifyMohammed.profileImage}`)
    console.log(`   Show on Landing: ${verifyMohammed.showOnLanding}`)
    console.log(`   Is Active: ${verifyMohammed.isActive}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateMohammedProfileImage()
