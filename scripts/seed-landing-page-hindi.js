// Updated Seed data for Landing Page Content Management with Hindi Content
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedLandingPageContentWithHindi() {
  console.log('🌱 Seeding landing page content with Hindi support...')

  try {
    // Clear existing duplicate data first
    await prisma.person.deleteMany({})
    await prisma.sectionImage.deleteMany({})
    await prisma.landingPageSection.deleteMany({})

    // Create Landing Page Sections with Hindi content
    const heroSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'HERO_BANNER' },
      update: {},
      create: {
        sectionType: 'HERO_BANNER',
        title: 'तुंडा स्पोर्ट्स क्लब में आपका स्वागत है',
        subtitle: 'जहाँ क्रिकेट के सपने साकार होते हैं | Where Cricket Dreams Come Alive',
        content: 'तुंडा गांव के जीवंत क्रिकेट समुदाय में शामिल हों। हम प्रतिभा को बढ़ावा देते हैं, टीमें बनाते हैं, और सभी कौशल स्तरों के खिलाड़ियों के लिए अविस्मरणीय क्रिकेट अनुभव बनाते हैं।',
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
        title: 'तुंडा स्पोर्ट्स क्लब के बारे में | About Tunda Sports Club',
        subtitle: 'हमारी स्थापना के बाद से क्रिकेट में उत्कृष्टता का निर्माण',
        content: 'तुंडा स्पोर्ट्स क्लब, गुजरात के कच्छ जिले के मुंद्रा तालुका के खूबसूरत गांव तुंडा में स्थित है। हमारा क्रिकेट मैदान हमारे स्थानीय क्रिकेट समुदाय का दिल है, जो सभी उम्र के खिलाड़ियों को खेल का आनंद लेने के लिए एक स्थान प्रदान करता है। मैत्रीपूर्ण गांव मैचों से लेकर स्थानीय टूर्नामेंटों तक, हमारा मैदान अनगिनत यादगार पलों का गवाह रहा है। | Located in the beautiful village of Tunda in Kutch district, Gujarat, our cricket ground serves as the heart of our local cricket community.',
        isActive: true,
        sortOrder: 2
      }
    })

    const facilitiesSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'FACILITIES' },
      update: {},
      create: {
        sectionType: 'FACILITIES',
        title: 'हमारी सुविधाएं | Our Facilities',
        subtitle: 'विश्व स्तरीय क्रिकेट बुनियादी ढांचा',
        content: 'हमारे क्लब में आधुनिक सुविधाएं हैं जिनमें एक अच्छी तरह से बनाए रखा गया क्रिकेट मैदान, अभ्यास नेट, पवेलियन, और दर्शकों के बैठने की व्यवस्था शामिल है। | Our club boasts modern facilities including a well-maintained cricket ground, practice nets, pavilion, and spectator seating.',
        isActive: true,
        sortOrder: 3
      }
    })

    const teamSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'TEAM_MEMBERS' },
      update: {},
      create: {
        sectionType: 'TEAM_MEMBERS',
        title: 'हमारी टीम | Our Team',
        subtitle: 'समर्पित व्यक्ति जो क्रिकेट को संभव बनाते हैं',
        content: 'उन जुनूनी व्यक्तियों से मिलें जो टूर्नामेंट आयोजित करने, सुविधाओं को बनाए रखने और हमारे क्रिकेट समुदाय का समर्थन करने के लिए अथक परिश्रम करते हैं। | Meet the passionate individuals who work tirelessly to organize tournaments and support our cricket community.',
        isActive: true,
        sortOrder: 4
      }
    })

    const boardSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'BOARD_MEMBERS' },
      update: {},
      create: {
        sectionType: 'BOARD_MEMBERS',
        title: 'बोर्ड सदस्य | Board Members',
        subtitle: 'क्लब का नेतृत्व करने वाले अनुभवी व्यक्ति',
        content: 'हमारे बोर्ड सदस्य अनुभवी और समर्पित व्यक्ति हैं जो क्लब की दिशा तय करते हैं। | Our board members are experienced individuals who guide the club direction.',
        isActive: true,
        sortOrder: 5
      }
    })

    const donorsSection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'DONORS_SPONSORS' },
      update: {},
      create: {
        sectionType: 'DONORS_SPONSORS',
        title: 'दानदाता और प्रायोजक | Donors & Sponsors',
        subtitle: 'हमारे समुदाय का समर्थन करने वाले उदार हृदय',
        content: 'उन व्यक्तियों और संगठनों के लिए आभार जो हमारे क्रिकेट क्लब और समुदाय का समर्थन करते हैं। | Gratitude to individuals and organizations supporting our cricket club.',
        isActive: true,
        sortOrder: 6
      }
    })

    const gallerySection = await prisma.landingPageSection.upsert({
      where: { sectionType: 'GALLERY' },
      update: {},
      create: {
        sectionType: 'GALLERY',
        title: 'फोटो गैलरी | Photo Gallery',
        subtitle: 'यादों की तस्वीरें | Capturing Memories',
        content: 'हमारे टूर्नामेंट, मैच और समुदायिक कार्यक्रमों की सुंदर तस्वीरें देखें। | View beautiful pictures from our tournaments, matches and community events.',
        isActive: true,
        sortOrder: 7
      }
    })

    // Create sample people with Hindi names for different sections
    const samplePeople = [
      // Board Members
      {
        name: 'राजेश कुमार | Rajesh Kumar',
        role: 'अध्यक्ष | President',
        designation: 'क्लब अध्यक्ष | Club President',
        bio: 'खेल प्रशासन में 20 साल से अधिक अनुभव के साथ एक भावुक क्रिकेट उत्साही। | A passionate cricket enthusiast with over 20 years of experience in sports administration.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 1
      },
      {
        name: 'प्रिया शर्मा | Priya Sharma',
        role: 'सचिव | Secretary',
        designation: 'क्लब सचिव | Club Secretary',
        bio: 'सभी प्रशासनिक कार्यों को संभालती हैं और क्लब के सुचारू संचालन को सुनिश्चित करती हैं। | Handles all administrative functions and ensures smooth operations.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 2
      },
      {
        name: 'अमित पटेल | Amit Patel',
        role: 'कोषाध्यक्ष | Treasurer',
        designation: 'क्लब कोषाध्यक्ष | Club Treasurer',
        bio: 'वित्तीय पहलुओं का प्रबंधन करते हैं और पारदर्शी वित्तीय संचालन सुनिश्चित करते हैं। | Manages financial aspects and ensures transparent operations.',
        sectionId: boardSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 3
      },
      // Team Members
      {
        name: 'विक्रम सिंह | Vikram Singh',
        role: 'मुख्य कोच | Head Coach',
        designation: 'वरिष्ठ क्रिकेट कोच | Senior Cricket Coach',
        bio: 'पूर्व जिला स्तरीय खिलाड़ी अब क्रिकेटरों की अगली पीढ़ी को प्रशिक्षित कर रहे हैं। | Former district-level player now coaching the next generation of cricketers.',
        sectionId: teamSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: true,
        sortOrder: 1
      },
      {
        name: 'नेहा जोशी | Neha Joshi',
        role: 'ग्राउंडकीपर | Groundskeeper',
        designation: 'मैदान रखरखाव प्रमुख | Ground Maintenance Head',
        bio: 'सुनिश्चित करती हैं कि हमारा क्रिकेट मैदान मैच और अभ्यास के लिए हमेशा परफेक्ट कंडीशन में रहे। | Ensures our cricket ground is always in perfect condition.',
        sectionId: teamSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 2
      },
      // Donors
      {
        name: 'रमेश भाई पटेल | Ramesh Bhai Patel',
        role: 'मुख्य प्रायोजक | Main Sponsor',
        designation: 'स्थानीय व्यापारी | Local Businessman',
        bio: 'तुंडा गांव के सफल व्यापारी जो समुदाय के विकास में योगदान देते हैं। | Successful businessman from Tunda village contributing to community development.',
        sectionId: donorsSection.id,
        isActive: true,
        showOnLanding: true,
        showContact: false,
        sortOrder: 1
      },
      {
        name: 'सुनीता बेन | Sunita Ben',
        role: 'सामुदायिक समर्थक | Community Supporter',
        designation: 'स्थानीय सामाजिक कार्यकर्ता | Local Social Worker',
        bio: 'गांव की महिला जो खेल और शिक्षा के विकास में सक्रिय रूप से भाग लेती हैं। | Village woman actively participating in sports and education development.',
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

    console.log('✅ Landing page content with Hindi seeded successfully!')
    console.log(`Created ${samplePeople.length} people across different sections`)
    console.log('🎉 Hindi landing page seeding completed!')

  } catch (error) {
    console.error('Error seeding landing page content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedLandingPageContentWithHindi()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
