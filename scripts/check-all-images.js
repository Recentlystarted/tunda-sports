// Check all uploaded images regardless of section
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllImages() {
  try {
    console.log('🔍 Checking all uploaded images...')
    
    const allImages = await prisma.sectionImage.findMany({
      include: {
        section: {
          select: {
            title: true,
            sectionType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📸 Total images in database: ${allImages.length}`)
    
    if (allImages.length > 0) {
      console.log('\n📋 Recent uploads:')
      allImages.slice(0, 10).forEach((image, index) => {
        console.log(`  ${index + 1}. "${image.title}" - ${image.section?.sectionType}`)
        console.log(`     Section: ${image.section?.title}`)
        console.log(`     URL: ${image.imageUrl}`)
        console.log(`     Active: ${image.isActive}`)
        console.log(`     Created: ${image.createdAt}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No images found in database at all')
    }

    // Check by section
    console.log('\n📊 Images per section:')
    const sections = await prisma.landingPageSection.findMany({
      include: {
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    sections.forEach(section => {
      console.log(`  - ${section.sectionType}: ${section._count.images} images`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllImages()
