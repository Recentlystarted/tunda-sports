const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const landingSections = [
  {
    sectionType: 'HERO_BANNER',
    title: 'Welcome to Tunda Sports Club',
    subtitle: 'Where Champions Are Made',
    content: 'Join us in the spirit of cricket excellence. Our club has been nurturing talent and promoting the beautiful game of cricket for years. Experience world-class facilities, expert coaching, and a vibrant community of cricket enthusiasts.',
    isActive: true,
    sortOrder: 1,
    bgColor: 'bg-gradient-to-r from-green-600 to-blue-600',
    textColor: 'text-white'
  },
  {
    sectionType: 'ABOUT_US',
    title: 'About Tunda Sports Club',
    subtitle: 'Excellence in Cricket Since Our Foundation',
    content: 'Tunda Sports Club is a premier cricket institution dedicated to developing talent and promoting the sport at all levels. We provide comprehensive training programs, state-of-the-art facilities, and a supportive environment for players of all ages and skill levels. Our mission is to foster excellence, sportsmanship, and community through the beautiful game of cricket.',
    isActive: true,
    sortOrder: 2
  },
  {
    sectionType: 'FACILITIES',
    title: 'World-Class Facilities',
    subtitle: 'Everything You Need for Cricket Excellence',
    content: 'Our club boasts modern cricket facilities including professional-grade pitches, indoor practice nets, fully equipped gymnasium, changing rooms, and spectator seating. We maintain our grounds to international standards to provide the best playing experience.',
    isActive: true,
    sortOrder: 3
  },
  {
    sectionType: 'TEAM_MEMBERS',
    title: 'Our Team',
    subtitle: 'Meet the People Behind Our Success',
    content: 'Our dedicated team of coaches, administrators, and support staff work tirelessly to ensure every member gets the best possible experience. With years of combined experience in cricket and sports management, our team is committed to excellence.',
    isActive: true,
    sortOrder: 4
  },
  {
    sectionType: 'BOARD_MEMBERS',
    title: 'Board of Directors',
    subtitle: 'Leadership and Governance',
    content: 'Our board consists of experienced professionals from various fields who provide strategic direction and governance to ensure the club continues to thrive and serve the community effectively.',
    isActive: true,
    sortOrder: 5
  },
  {
    sectionType: 'DONORS',
    title: 'Our Valued Donors',
    subtitle: 'Supporting Cricket Development',
    content: 'We are grateful to our generous donors who help us maintain facilities, support player development programs, and organize community events. Their contributions make a real difference in promoting cricket in our community.',
    isActive: true,
    sortOrder: 6
  },
  {
    sectionType: 'SPONSORS',
    title: 'Our Sponsors',
    subtitle: 'Partners in Excellence',
    content: 'We appreciate our sponsors who support our tournaments, events, and development programs. These partnerships help us provide better facilities and opportunities for our members.',
    isActive: true,
    sortOrder: 7
  },
  {
    sectionType: 'GALLERY_SHOWCASE',
    title: 'Gallery',
    subtitle: 'Capturing Our Best Moments',
    content: 'Browse through our collection of memorable moments, tournament highlights, training sessions, and community events. These images tell the story of our club\'s journey and achievements.',
    isActive: true,
    sortOrder: 8
  },
  {
    sectionType: 'TESTIMONIALS',
    title: 'What Our Members Say',
    subtitle: 'Stories of Success and Growth',
    content: 'Hear from our members about their experiences at Tunda Sports Club and how we\'ve helped them achieve their cricket goals.',
    isActive: true,
    sortOrder: 9
  },
  {
    sectionType: 'CONTACT_INFO',
    title: 'Get in Touch',
    subtitle: 'Ready to Join Our Cricket Family?',
    content: 'Contact us today to learn more about membership, training programs, or to schedule a visit to our facilities. We\'re here to help you start your cricket journey.',
    isActive: true,
    sortOrder: 10
  }
]

const samplePeople = [
  {
    name: 'Raj Kumar Sharma',
    role: 'Head Coach',
    designation: 'Former State Player',
    bio: 'With over 15 years of coaching experience and a background as a state-level player, Raj brings expertise and passion to our training programs.',
    email: 'raj.sharma@tundasports.com',
    phone: '+91 98765 43210',
    department: 'Coaching Staff',
    isActive: true,
    sortOrder: 1,
    showOnLanding: true,
    showContact: true,
    sectionId: null // Will be set during creation
  },
  {
    name: 'Priya Patel',
    role: 'Club Secretary',
    designation: 'Administration',
    bio: 'Priya manages all administrative activities and ensures smooth operations of the club. She has been with us for over 8 years.',
    email: 'priya.patel@tundasports.com',
    phone: '+91 98765 43211',
    department: 'Administration',
    isActive: true,
    sortOrder: 2,
    showOnLanding: true,
    showContact: true,
    sectionId: null
  },
  {
    name: 'Dr. Anil Gupta',
    role: 'President',
    designation: 'Board of Directors',
    bio: 'Dr. Gupta has been leading our club with vision and dedication. Under his leadership, we have expanded our facilities and programs significantly.',
    email: 'anil.gupta@tundasports.com',
    phone: '+91 98765 43212',
    department: 'Board',
    isActive: true,
    sortOrder: 1,
    showOnLanding: true,
    showContact: false,
    sectionId: null
  },
  {
    name: 'Suresh Industries',
    role: 'Platinum Sponsor',
    designation: 'Manufacturing',
    bio: 'Our premier sponsor supporting all major tournaments and development programs.',
    email: 'contact@sureshindustries.com',
    department: 'Sponsors',
    isActive: true,
    sortOrder: 1,
    showOnLanding: true,
    showContact: false,
    sectionId: null
  }
]

async function seedLandingSections() {
  console.log('🌱 Seeding landing page sections...')

  try {
    // Create sections
    for (const section of landingSections) {
      const existingSection = await prisma.landingPageSection.findUnique({
        where: { sectionType: section.sectionType }
      })

      if (!existingSection) {
        const createdSection = await prisma.landingPageSection.create({
          data: section
        })
        console.log(`✅ Created section: ${section.title}`)

        // Add people to relevant sections
        if (section.sectionType === 'TEAM_MEMBERS') {
          const teamMembers = samplePeople.filter(person => 
            person.department === 'Coaching Staff' || person.department === 'Administration'
          )
          
          for (const person of teamMembers) {
            await prisma.person.create({
              data: {
                ...person,
                sectionId: createdSection.id
              }
            })
            console.log(`  👤 Added team member: ${person.name}`)
          }
        }

        if (section.sectionType === 'BOARD_MEMBERS') {
          const boardMembers = samplePeople.filter(person => 
            person.department === 'Board'
          )
          
          for (const person of boardMembers) {
            await prisma.person.create({
              data: {
                ...person,
                sectionId: createdSection.id
              }
            })
            console.log(`  👤 Added board member: ${person.name}`)
          }
        }

        if (section.sectionType === 'SPONSORS') {
          const sponsors = samplePeople.filter(person => 
            person.department === 'Sponsors'
          )
          
          for (const person of sponsors) {
            await prisma.person.create({
              data: {
                ...person,
                sectionId: createdSection.id
              }
            })
            console.log(`  🏢 Added sponsor: ${person.name}`)
          }
        }
      } else {
        console.log(`⏭️  Section already exists: ${section.title}`)
      }
    }

    console.log('✅ Landing page sections seeding completed!')
    
    // Display summary
    const totalSections = await prisma.landingPageSection.count()
    const totalPeople = await prisma.person.count()
    
    console.log(`📊 Summary:`)
    console.log(`   - Total sections: ${totalSections}`)
    console.log(`   - Total people: ${totalPeople}`)
    
  } catch (error) {
    console.error('❌ Error seeding landing sections:', error)
    throw error
  }
}

async function main() {
  await seedLandingSections()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
