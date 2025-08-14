const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAuctionBudget() {
  console.log('🔄 Updating auction budget to 30,000 points per team...')

  try {
    const updatedTournament = await prisma.tournament.updateMany({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      data: {
        auctionBudget: 30000, // 30,000 points per team for auction
        teamEntryFee: 0,      // Remove team entry fee if auction budget is the main fee
        playerEntryFee: 500   // Keep player entry fee
      }
    })

    console.log('✅ Updated auction budget:', updatedTournament)
    
    // Verify the update
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      select: {
        name: true,
        auctionBudget: true,
        teamEntryFee: true,
        playerEntryFee: true,
        pointsBased: true,
        auctionCurrency: true
      }
    })
    
    console.log('🔍 Updated tournament details:', tournament)
    
  } catch (error) {
    console.error('❌ Error updating auction budget:', error)
  }
}

async function main() {
  await updateAuctionBudget()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
