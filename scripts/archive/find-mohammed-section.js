const { PrismaClient } = require('@prisma/client')

async function findMohammedSection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Finding Mohammed Faruk\'s section...')
    
    // Get Mohammed's details including section
    const mohammed = await prisma.person.findFirst({
      where: {
        OR: [
          { name: { contains: 'Mohammed' } },
          { name: { contains: 'Faruk' } }
        ]
      },
      include: {
        section: true
      }
    })
    
    if (!mohammed) {
      console.log('❌ Mohammed Faruk not found')
      return
    }
    
    console.log('👤 Mohammed Faruk details:')
    console.log(`   ID: ${mohammed.id}`)
    console.log(`   Name: ${mohammed.name}`)
    console.log(`   Role: ${mohammed.role}`)
    console.log(`   Profile Image: ${mohammed.profileImage}`)
    console.log(`   Section ID: ${mohammed.sectionId}`)
    console.log(`   Show on Landing: ${mohammed.showOnLanding}`)
    console.log(`   Is Active: ${mohammed.isActive}`)
    
    if (mohammed.section) {
      console.log('\n📁 Section details:')
      console.log(`   Section ID: ${mohammed.section.id}`)
      console.log(`   Section Type: ${mohammed.section.sectionType}`)
      console.log(`   Section Title: ${mohammed.section.title}`)
      console.log(`   Section Active: ${mohammed.section.isActive}`)
    } else {
      console.log('\n❌ No section found for Mohammed')
    }
    
    // Also list all available sections to see what exists
    console.log('\n📋 All available sections:')
    const sections = await prisma.landingPageSection.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    
    sections.forEach((section, index) => {
      console.log(`${index + 1}. ${section.sectionType} - ${section.title} (ID: ${section.id})`)
      console.log(`   Active: ${section.isActive}, Sort Order: ${section.sortOrder}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findMohammedSection()
