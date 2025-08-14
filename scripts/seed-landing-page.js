// Seed data for Landing Page Content Management
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedLandingPageContent() {
  console.log('🌱 Seeding landing page content...')

  try {
    // Create Landing Page Sections
    const heroSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'HERO_BANNER' },
      update: {},
      create: {
        sectionType: 'HERO_BANNER',
        title: 'Welcome to Tunda Sports Club',
        subtitle: 'Where Cricket Dreams Come Alive',
        content: 'Join our vibrant cricket community in Tunda village. We foster talent, build teams, and create unforgettable cricket experiences for players of all skill levels.',
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
        content: 'Tunda Sports Club has been at the heart of our village cricket community, organizing tournaments, training sessions, and fostering young talent. Our mission is to provide a platform where every cricket enthusiast can grow and excel.',
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
        content: 'Our club boasts modern facilities including a well-maintained cricket ground, practice nets, pavilion, and spectator seating to ensure the best cricket experience.',
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
        content: 'Meet the passionate individuals who work tirelessly to organize tournaments, maintain facilities, and support our cricket community.',
        isActive: true,
        sortOrder: 4
      }
    })

    const boardSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'BOARD_MEMBERS' },
      update: {},
      create: {
        sectionType: 'BOARD_MEMBERS',
        title: 'Board of Directors',
        subtitle: 'Leadership Guiding Our Vision',
        content: 'Our experienced board members provide strategic direction and governance to ensure the continued growth and success of Tunda Sports Club.',
        isActive: true,
        sortOrder: 5
      }
    })

    const donorsSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'DONORS' },
      update: {},
      create: {
        sectionType: 'DONORS',
        title: 'Our Donors',
        subtitle: 'Generous Hearts Supporting Cricket',
        content: 'We are grateful to our donors who contribute to the development of cricket infrastructure and support our community initiatives.',
        isActive: true,
        sortOrder: 6
      }
    })

    const sponsorsSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'SPONSORS' },
      update: {},
      create: {
        sectionType: 'SPONSORS',
        title: 'Our Sponsors',
        subtitle: 'Business Partners Enabling Excellence',
        content: 'Our sponsors play a crucial role in supporting tournaments, equipment, and facilities that make our cricket programs possible.',
        isActive: true,
        sortOrder: 7
      }
    })

    // Create sample people for different sections
    const samplePeople = [
      // Board Members
      {
        name: 'Rajesh Kumar',
        role: 'President',
        designation: 'Club President',
        bio: 'A passionate cricket enthusiast with over 20 years of experience in sports administration.',
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
        bio: 'Handles all administrative functions and ensures smooth operations of the club.',
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
        bio: 'Manages the financial aspects and ensures transparent financial operations.',
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
        bio: 'Former district-level player now coaching the next generation of cricketers.',
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
        bio: 'Ensures our cricket ground is always in perfect condition for matches and practice.',
        sectionId: teamSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      },
      // Donors
      {
        name: 'Mahesh Industries',
        role: 'Major Donor',
        designation: 'Infrastructure Supporter',
        bio: 'Contributed significantly to the development of our cricket pavilion and seating arrangements.',
        sectionId: donorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 1
      },
      {
        name: 'Local Community Fund',
        role: 'Community Supporter',
        designation: 'Equipment Provider',
        bio: 'Regular supporter providing cricket equipment and tournament prizes.',
        sectionId: donorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      },
      // Sponsors
      {
        name: 'Sports Galaxy',
        role: 'Equipment Sponsor',
        designation: 'Official Equipment Partner',
        bio: 'Provides cricket equipment and sports gear for our tournaments and training sessions.',
        sectionId: sponsorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 1
      },
      {
        name: 'Village Bank',
        role: 'Financial Sponsor',
        designation: 'Banking Partner',
        bio: 'Supports our financial transactions and sponsors annual tournaments.',
        sectionId: sponsorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      }
    ]

    for (const person of samplePeople) {
      await prisma.person.create({ data: person })
    }

    // Create Site Settings
    await prisma.siteSettings.create({
      data: {
        siteName: 'Tunda Sports Club',
        tagline: 'Where Cricket Dreams Come Alive',
        description: 'Tunda Sports Club is a vibrant cricket community in Tunda village, dedicated to fostering talent, organizing tournaments, and providing world-class cricket facilities.',
        email: 'info@tundasportsclub.com',
        phone: '+91-9876543210',
        address: 'Tunda Village, Kutch District, Gujarat, India',
        primaryColor: '#1a365d',
        secondaryColor: '#2d3748',
        accentColor: '#ed8936',
        enableRegistration: true,
        enableTournaments: true,
        enableGallery: true,
        enableContact: true,
        maintenanceMode: false
      }
    })

    console.log('✅ Landing page content seeded successfully!')
    console.log(`Created ${samplePeople.length} people across 7 sections`)

  } catch (error) {
    console.error('❌ Error seeding landing page content:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedLandingPageContent()
    .then(() => {
      console.log('🎉 Landing page seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Landing page seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedLandingPageContent }
