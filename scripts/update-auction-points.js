const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAuctionPointsSystem() {
  console.log('🔄 Updating auction tournament to use points system...')

  try {
    const updatedTournament = await prisma.tournament.updateMany({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      data: {
        pointsBased: true,
        auctionCurrency: 'POINTS',
        auctionBudget: 50000, // 50,000 points per team
        playerEntryFee: 500,   // 500 points
        teamEntryFee: 2000,    // 2000 points
        entryFeeType: 'BOTH'
      }
    })

    console.log('✅ Updated tournament to points system:', updatedTournament)
    
    // Verify the update
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      select: {
        name: true,
        isAuctionBased: true,
        pointsBased: true,
        auctionCurrency: true,
        auctionBudget: true,
        playerEntryFee: true,
        teamEntryFee: true
      }
    })
    
    console.log('🔍 Updated tournament details:', tournament)
    
  } catch (error) {
    console.error('❌ Error updating tournament:', error)
  }
}

async function main() {
  await updateAuctionPointsSystem()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
