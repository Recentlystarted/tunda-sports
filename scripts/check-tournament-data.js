const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTournamentData() {
  console.log('🔍 Checking current tournament auction data...')

  try {
    const tournaments = await prisma.tournament.findMany({
      select: {
        name: true,
        isAuctionBased: true,
        auctionBudget: true,
        playerEntryFee: true,
        teamEntryFee: true,
        pointsBased: true,
        auctionCurrency: true
      }
    })
    
    tournaments.forEach(tournament => {
      console.log(`\n📄 ${tournament.name}:`)
      console.log(`  - Auction Based: ${tournament.isAuctionBased}`)
      console.log(`  - Auction Budget: ${tournament.auctionBudget}`)
      console.log(`  - Player Entry Fee: ${tournament.playerEntryFee}`)
      console.log(`  - Team Entry Fee: ${tournament.teamEntryFee}`)
      console.log(`  - Points Based: ${tournament.pointsBased}`)
      console.log(`  - Currency: ${tournament.auctionCurrency}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking tournament data:', error)
  }
}

async function main() {
  await checkTournamentData()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
