const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleTournaments = [
  {
    name: 'Kumbhar Premier League - Season 3',
    description: 'Welcome to the third season of Kumbhar Premier League, the most exciting T10 cricket tournament in the region. Join us for an action-packed season of cricket excellence.',
    format: 'T10',
    competitionType: 'LEAGUE',
    venue: 'Tunda Cricket Ground',
    venueAddress: 'Tunda Sports Complex, Main Road, Cricket Ground Area',
    startDate: new Date('2025-07-10'),
    endDate: new Date('2025-09-30'),
    registrationDeadline: new Date('2025-07-05'),
    maxTeams: 12,
    entryFee: 0,
    totalPrizePool: 25000,
    ageLimit: 'Open to all ages',
    teamSize: 11,
    substitutes: 3,
    overs: 10,
    status: 'UPCOMING',
    rules: 'Standard T10 cricket rules apply. Each team gets 10 overs to bat.',
    requirements: JSON.stringify(['Team of 11 players + 3 substitutes', 'Valid ID proof for all players', 'Team captain contact details']),
    organizers: JSON.stringify([
      {
        name: 'Tournament Director',
        role: 'Director',
        contact: '+91 98765 43210',
        email: 'tournament@tundasports.com'
      }
    ]),
    isAuctionBased: true,
    auctionDate: new Date('2025-07-08'),
    auctionBudget: 50000,
    playerEntryFee: 500,
    teamEntryFee: 2000,
    entryFeeType: 'BOTH'
  },
  {
    name: 'Corporate Cup 2025',
    description: 'Annual corporate cricket tournament bringing together companies and organizations for a day of fun, competition, and networking.',
    format: 'T15',
    competitionType: 'KNOCKOUT',
    venue: 'Tunda Cricket Ground',
    venueAddress: 'Tunda Sports Complex, Main Road, Cricket Ground Area',
    startDate: new Date('2025-08-15'),
    endDate: new Date('2025-08-17'),
    registrationDeadline: new Date('2025-08-10'),
    maxTeams: 8,
    entryFee: 5000,
    totalPrizePool: 30000,
    ageLimit: 'Corporate employees only',
    teamSize: 11,
    substitutes: 3,
    overs: 15,
    status: 'REGISTRATION_OPEN',
    rules: 'T15 format with corporate team restrictions.',
    requirements: JSON.stringify(['Valid company registration', 'Employee ID for all players', 'Team insurance']),
    organizers: JSON.stringify([
      {
        name: 'Corporate Events Manager',
        role: 'Manager',
        contact: '+91 98765 43211',
        email: 'corporate@tundasports.com'
      }
    ]),
    isAuctionBased: false
  }
]

async function seedTournaments() {
  console.log('🏏 Seeding sample tournaments...')

  try {
    for (const tournament of sampleTournaments) {
      const existingTournament = await prisma.tournament.findFirst({
        where: { name: tournament.name }
      })

      if (!existingTournament) {
        const createdTournament = await prisma.tournament.create({
          data: tournament
        })
        console.log(`✅ Created tournament: ${tournament.name}`)
        
        // Add a sample image for the tournament
        if (tournament.name.includes('Kumbhar Premier League')) {
          await prisma.tournamentImage.create({
            data: {
              tournamentId: createdTournament.id,
              url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
              title: 'Cricket Tournament Banner',
              description: 'Official tournament banner image',
              category: 'banner',
              storageType: 'URL',
              thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
              isActive: true,
              sortOrder: 1
            }
          })
          console.log(`  🖼️ Added banner image for: ${tournament.name}`)
        }
      } else {
        console.log(`⏭️  Tournament already exists: ${tournament.name}`)
      }
    }

    console.log('✅ Tournament seeding completed!')
    
    // Display summary
    const totalTournaments = await prisma.tournament.count()
    console.log(`📊 Total tournaments in database: ${totalTournaments}`)
    
  } catch (error) {
    console.error('❌ Error seeding tournaments:', error)
    throw error
  }
}

async function main() {
  await seedTournaments()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
