const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addRegularTournament() {
  console.log('🏏 Adding regular tournament for comparison...')

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Weekend League Championship',
        description: 'A regular weekend cricket tournament for local teams. Standard format with direct team registration and entry fees.',
        format: 'T20',
        competitionType: 'LEAGUE',
        venue: 'Tunda Cricket Ground',
        venueAddress: 'Tunda Sports Complex, Main Road, Cricket Ground Area',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-03'),
        registrationDeadline: new Date('2025-07-25'),
        maxTeams: 8,
        entryFee: 3000,
        totalPrizePool: 15000,
        ageLimit: 'Open to all ages',
        teamSize: 11,
        substitutes: 3,
        overs: 20,
        status: 'REGISTRATION_OPEN',
        rules: 'Standard T20 cricket rules apply. Each team gets 20 overs to bat.',
        requirements: JSON.stringify(['Team of 11 players + 3 substitutes', 'Valid ID proof for all players', 'Team registration fee']),
        organizers: JSON.stringify([
          {
            name: 'Local Sports Committee',
            role: 'Organizer',
            contact: '+91 98765 43212',
            email: 'weekend@tundasports.com'
          }
        ]),
        isAuctionBased: false
      }
    })

    console.log('✅ Added regular tournament:', tournament.name)
    
  } catch (error) {
    console.error('❌ Error adding tournament:', error)
  }
}

async function main() {
  await addRegularTournament()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
