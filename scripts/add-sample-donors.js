const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSampleDonors() {
  console.log('🎁 Adding sample donors...')

  try {
    // Find the DONORS section
    const donorsSection = await prisma.landingPageSection.findUnique({
      where: { sectionType: 'DONORS' }
    })

    if (!donorsSection) {
      console.log('❌ Donors section not found')
      return
    }

    const sampleDonors = [
      {
        name: 'Rajesh Merchant',
        role: 'Gold Donor',
        designation: 'Business Owner',
        bio: 'A passionate cricket enthusiast and long-time supporter of local sports development.',
        department: 'Donors',
        isActive: true,
        sortOrder: 1,
        showOnLanding: true,
        showContact: false,
        sectionId: donorsSection.id
      },
      {
        name: 'Anita Foundation',
        role: 'Platinum Donor',
        designation: 'Educational Foundation',
        bio: 'Supporting youth development through sports and education since 2015.',
        department: 'Donors',
        isActive: true,
        sortOrder: 2,
        showOnLanding: true,
        showContact: false,
        sectionId: donorsSection.id
      },
      {
        name: 'Kumar Family Trust',
        role: 'Silver Donor',
        designation: 'Family Trust',
        bio: 'Dedicated to promoting cricket at the grassroots level in our community.',
        department: 'Donors',
        isActive: true,
        sortOrder: 3,
        showOnLanding: true,
        showContact: false,
        sectionId: donorsSection.id
      }
    ]

    for (const donor of sampleDonors) {
      const existingDonor = await prisma.person.findFirst({
        where: {
          name: donor.name,
          sectionId: donorsSection.id
        }
      })

      if (!existingDonor) {
        await prisma.person.create({
          data: donor
        })
        console.log(`✅ Added donor: ${donor.name}`)
      } else {
        console.log(`⏭️  Donor already exists: ${donor.name}`)
      }
    }

    console.log('🎁 Sample donors added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding donors:', error)
    throw error
  }
}

async function main() {
  await addSampleDonors()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
