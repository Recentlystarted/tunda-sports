// Test script to check landing page sections and images
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkGalleryImages() {
  try {
    console.log('🔍 Checking gallery section and images...')
    
    // Find gallery section
    const gallerySection = await prisma.landingPageSection.findFirst({
      where: {
        sectionType: 'GALLERY_SHOWCASE',
        isActive: true
      },
      include: {
        images: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!gallerySection) {
      console.log('❌ No active gallery section found')
      return
    }

    console.log('✅ Gallery section found:', gallerySection.title)
    console.log('📸 Images found:', gallerySection.images.length)
    
    if (gallerySection.images.length > 0) {
      console.log('\n📋 Image details:')
      gallerySection.images.forEach((image, index) => {
        console.log(`  ${index + 1}. ${image.title}`)
        console.log(`     URL: ${image.imageUrl}`)
        console.log(`     Active: ${image.isActive}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No images found in gallery section')
    }

    // Check all sections for debugging
    console.log('\n🔍 All landing page sections:')
    const allSections = await prisma.landingPageSection.findMany({
      include: {
        images: {
          where: { isActive: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    allSections.forEach(section => {
      console.log(`  - ${section.sectionType}: "${section.title}" (${section.images.length} images)`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGalleryImages()
