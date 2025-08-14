import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSectionTypes() {
  try {
    console.log('Checking section types in database...\n')
    
    // Get all unique section types
    const sections = await prisma.landingPageSection.findMany({
      select: {
        sectionType: true,
        title: true,
        isActive: true,
        _count: {
          select: {
            images: true,
            people: true
          }
        }
      }
    })
    
    console.log('Found sections:')
    sections.forEach((section, i) => {
      console.log(`${i + 1}. ${section.sectionType}: "${section.title}" (Active: ${section.isActive})`)
      console.log(`   - Images: ${section._count.images}`)
      console.log(`   - People: ${section._count.people}`)
    })
    
    console.log('\nChecking gallery images specifically...')
    const galleryImages = await prisma.sectionImage.findMany({
      where: {
        isActive: true,
        section: {
          sectionType: 'GALLERY_SHOWCASE'
        }
      },
      include: {
        section: {
          select: {
            title: true,
            sectionType: true
          }
        }
      }
    })
    
    console.log(`Found ${galleryImages.length} active gallery images`)
    galleryImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img.title} (${img.category}) - ${img.imageUrl}`)
    })
    
    // Check if there are tournament sections
    const tournaments = await prisma.landingPageSection.findMany({
      where: {
        OR: [
          { sectionType: 'TOURNAMENTS' },
          { sectionType: 'TOURNAMENT' },
          { title: { contains: 'tournament', mode: 'insensitive' } }
        ]
      }
    })
    
    console.log(`\nTournament sections: ${tournaments.length}`)
    tournaments.forEach(t => {
      console.log(`- ${t.sectionType}: "${t.title}"`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSectionTypes()
