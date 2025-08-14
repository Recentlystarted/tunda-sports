const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAuctionTournament() {
  console.log('🔄 Updating Kumbhar Premier League with auction fees...')

  try {
    const updatedTournament = await prisma.tournament.updateMany({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      data: {
        playerEntryFee: 500,
        teamEntryFee: 2000,
        entryFeeType: 'BOTH',
        auctionCurrency: 'INR'
      }
    })

    console.log('✅ Updated tournament with auction fees:', updatedTournament)
    
    // Verify the update
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      select: {
        name: true,
        isAuctionBased: true,
        playerEntryFee: true,
        teamEntryFee: true,
        auctionBudget: true,
        entryFeeType: true
      }
    })
    
    console.log('🔍 Tournament details:', tournament)
    
  } catch (error) {
    console.error('❌ Error updating tournament:', error)
  }
}

async function main() {
  await updateAuctionTournament()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
