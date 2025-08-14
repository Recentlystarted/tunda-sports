const { PrismaClient } = require('@prisma/client')

async function revertMohammedProfileImage() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Reverting Mohammed Faruk profile image to original...')
    
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
    
    // Revert to the original Google Drive image
    const originalImageUrl = '/api/proxy/gdrive?id=12jyjKRY4Fk5ag9mzlkvtGI4HH7KrYyfe'
    
    const updatedMohammed = await prisma.person.update({
      where: { id: mohammed.id },
      data: {
        profileImage: originalImageUrl
      }
    })
    
    console.log('✅ Reverted successfully!')
    console.log(`   Profile Image: ${updatedMohammed.profileImage}`)
    
    // Now let's test if this image URL is accessible
    console.log('\n🔗 Testing image URL accessibility...')
    
    // Test the proxy URL
    const proxyTestUrl = `http://localhost:3000${originalImageUrl}`
    console.log(`   Proxy URL: ${proxyTestUrl}`)
    
    // Test the direct Google Drive URL
    const fileId = originalImageUrl.split('id=')[1]
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    console.log(`   Direct URL: ${directUrl}`)
    
    // Final verification
    const finalMohammed = await prisma.person.findUnique({
      where: { id: mohammed.id }
    })
    
    console.log('\n📊 Final state:')
    console.log(`   ID: ${finalMohammed.id}`)
    console.log(`   Name: ${finalMohammed.name}`)
    console.log(`   Role: ${finalMohammed.role}`)
    console.log(`   Profile Image: ${finalMohammed.profileImage}`)
    console.log(`   Section ID: ${finalMohammed.sectionId}`)
    console.log(`   Show on Landing: ${finalMohammed.showOnLanding}`)
    console.log(`   Is Active: ${finalMohammed.isActive}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

revertMohammedProfileImage()
