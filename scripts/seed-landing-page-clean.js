// Clean English-only seed data for Landing Page Content Management
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedLandingPageContentClean() {
  console.log('🌱 Seeding landing page content (English only)...')

  try {
    // Clear existing data first
    await prisma.person.deleteMany({})
    await prisma.sectionImage.deleteMany({})
    await prisma.landingPageSection.deleteMany({})

    // Create Landing Page Sections with proper English content
    const heroSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'HERO_BANNER' },
      update: {},
      create: {
        sectionType: 'HERO_BANNER',
        title: 'Welcome to Tunda Sports Club',
        subtitle: 'Where Cricket Dreams Come Alive',
        content: 'Join our vibrant cricket community in Tunda village, Kutch district, Gujarat. We foster talent, build teams, and create unforgettable cricket experiences for players of all skill levels.',
        isActive: true,
        sortOrder: 1,
        bgColor: '#1a365d',
        textColor: '#ffffff'
      }
    })

    const aboutSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'ABOUT_US' },
      update: {},
      create: {
        sectionType: 'ABOUT_US',
        title: 'About Tunda Sports Club',
        subtitle: 'Building Cricket Excellence Since Our Founding',
        content: 'Located in the beautiful village of Tunda in Kutch district, Mundra Taluka, Gujarat, our cricket ground serves as the heart of our local cricket community. From friendly village matches to local tournaments, our ground has been witness to countless memorable moments and has helped nurture cricket talent in our region.',
        isActive: true,
        sortOrder: 2
      }
    })

    const facilitiesSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'FACILITIES' },
      update: {},
      create: {
        sectionType: 'FACILITIES',
        title: 'Our Facilities',
        subtitle: 'World-Class Cricket Infrastructure',
        content: 'Our club boasts modern facilities including a well-maintained cricket ground, practice nets, pavilion, and spectator seating to ensure the best cricket experience for players and spectators alike.',
        isActive: true,
        sortOrder: 3
      }
    })

    const teamSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'TEAM_MEMBERS' },
      update: {},
      create: {
        sectionType: 'TEAM_MEMBERS',
        title: 'Our Team',
        subtitle: 'Dedicated Individuals Making Cricket Possible',
        content: 'Meet the passionate individuals who work tirelessly to organize tournaments, maintain facilities, and support our cricket community in Tunda village.',
        isActive: true,
        sortOrder: 4
      }
    })

    const boardSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'BOARD_MEMBERS' },
      update: {},
      create: {
        sectionType: 'BOARD_MEMBERS',
        title: 'Board Members',
        subtitle: 'Experienced Leaders Guiding Our Club',
        content: 'Our board members are experienced and dedicated individuals who guide the strategic direction of Tunda Sports Club and ensure its continued growth.',
        isActive: true,
        sortOrder: 5
      }
    })

    const donorsSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'DONORS' },
      update: {},
      create: {
        sectionType: 'DONORS',
        title: 'Donors & Supporters',
        subtitle: 'Generous Hearts Supporting Our Community',
        content: 'We are grateful to the individuals and organizations who support our cricket club and help us continue serving the Tunda village community.',
        isActive: true,
        sortOrder: 6
      }
    })

    const gallerySection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'GALLERY_SHOWCASE' },
      update: {},
      create: {
        sectionType: 'GALLERY_SHOWCASE',
        title: 'Photo Gallery',
        subtitle: 'Capturing Cricket Memories',
        content: 'View beautiful pictures from our tournaments, matches and community events that showcase the spirit of cricket in Tunda village.',
        isActive: true,
        sortOrder: 7
      }
    })

    // Create sample people with proper English names for different sections
    const samplePeople = [
      // Board Members
      {
        name: 'Rajesh Kumar',
        role: 'President',
        designation: 'Club President',
        bio: 'A passionate cricket enthusiast with over 20 years of experience in sports administration and community leadership.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 1
      },
      {
        name: 'Priya Sharma',
        role: 'Secretary',
        designation: 'Club Secretary',
        bio: 'Handles all administrative functions and ensures smooth operations of the club with dedication and efficiency.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 2
      },
      {
        name: 'Amit Patel',
        role: 'Treasurer',
        designation: 'Club Treasurer',
        bio: 'Manages the financial aspects of the club and ensures transparent and responsible financial operations.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 3
      },
      // Team Members
      {
        name: 'Vikram Singh',
        role: 'Head Coach',
        designation: 'Senior Cricket Coach',
        bio: 'Former district-level player now coaching the next generation of cricketers with expertise and passion.',
        sectionId: teamSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 1
      },
      {
        name: 'Neha Joshi',
        role: 'Groundskeeper',
        designation: 'Ground Maintenance Head',
        bio: 'Ensures our cricket ground is always in perfect condition for matches and practice sessions.',
        sectionId: teamSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      },
      // Donors
      {
        name: 'Ramesh Patel',
        role: 'Main Sponsor',
        designation: 'Local Businessman',
        bio: 'Successful businessman from Tunda village who actively contributes to community development and sports.',
        sectionId: donorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 1
      },
      {
        name: 'Sunita Desai',
        role: 'Community Supporter',
        designation: 'Local Social Worker',
        bio: 'Active community member who supports sports and education development in Tunda village.',
        sectionId: donorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      }
    ]

    // Create people
    for (const person of samplePeople) {
      await prisma.person.create({
        data: person
      })
    }

    console.log('✅ Landing page content (English only) seeded successfully!')
    console.log(`Created ${samplePeople.length} people across different sections`)
    console.log('🎉 English landing page seeding completed!')

  } catch (error) {
    console.error('Error seeding landing page content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedLandingPageContentClean()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
