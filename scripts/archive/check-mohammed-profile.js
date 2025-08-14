const { PrismaClient } = require('@prisma/client')

async function checkMohammedProfile() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Searching for Mohammed Faruk in the database...')
    
    // Search for Mohammed Faruk (try different variations)
    const people = await prisma.person.findMany({
      where: {
        OR: [
          { name: { contains: 'Mohammed' } },
          { name: { contains: 'Faruk' } },
          { name: { contains: 'mohammed' } },
          { name: { contains: 'faruk' } }
        ]
      }
    })
    
    console.log(`\n📊 Found ${people.length} person(s) matching 'Mohammed' or 'Faruk':`)
    
    people.forEach((person, index) => {
      console.log(`\n${index + 1}. Person Details:`)
      console.log(`   ID: ${person.id}`)
      console.log(`   Name: ${person.name}`)
      console.log(`   Role: ${person.role}`)
      console.log(`   Profile Image: ${person.profileImage || 'Not set'}`)
      console.log(`   Section ID: ${person.sectionId || 'Not assigned'}`)
      console.log(`   Show on Landing: ${person.showOnLanding}`)
      console.log(`   Is Active: ${person.isActive}`)
    })
    
    // Also check all landing sections to see if Mohammed is in any
    console.log('\n🏠 Checking landing sections...')
    const sections = await prisma.landingPageSection.findMany({
      where: {
        sectionType: 'TEAM_MEMBERS'
      }
    })
    
    console.log(`Found ${sections.length} TEAM_MEMBERS sections:`)
    sections.forEach((section, index) => {
      console.log(`\n${index + 1}. Section: ${section.title}`)
      console.log(`   Content: ${section.content ? section.content.substring(0, 200) + '...' : 'No content'}`)
      
      // Try to parse content to see if Mohammed is mentioned
      if (section.content) {
        try {
          const data = JSON.parse(section.content)
          if (data.people) {
            console.log(`   People in this section: ${data.people.length}`)
            data.people.forEach((person, pIndex) => {
              if (person.name && (person.name.toLowerCase().includes('mohammed') || person.name.toLowerCase().includes('faruk'))) {
                console.log(`   ⭐ FOUND MOHAMMED: ${person.name}`)
                console.log(`      Profile Image: ${person.profileImageUrl || 'Not set'}`)
                console.log(`      Position: ${person.position || 'Not set'}`)
              }
            })
          }
        } catch (e) {
          console.log(`   Could not parse content as JSON`)
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMohammedProfile()
