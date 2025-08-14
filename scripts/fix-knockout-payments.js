import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixKnockoutTournamentPayments() {
  try {
    console.log('🔧 Fixing payment data for knockout tournaments...')
    
    // Find all non-auction tournaments with wrong payment data
    const tournamentsToFix = await prisma.tournament.findMany({
      where: {
        isAuctionBased: false,
        OR: [
          { playerEntryFee: { not: null } },
          { teamEntryFee: { not: null } },
          { entryFeeType: { not: 'TEAM' } }
        ]
      }
    })
    
    console.log(`Found ${tournamentsToFix.length} tournaments to fix:`)
    
    for (const tournament of tournamentsToFix) {
      console.log(`\n📝 Fixing: ${tournament.name} (${tournament.competitionType})`)
      console.log(`   Before: entryFee=${tournament.entryFee}, playerEntryFee=${tournament.playerEntryFee}, teamEntryFee=${tournament.teamEntryFee}, entryFeeType=${tournament.entryFeeType}`)
      
      // For non-auction tournaments, only entryFee should be set
      const updatedTournament = await prisma.tournament.update({
        where: { id: tournament.id },
        data: {
          playerEntryFee: null, // Remove player entry fee
          teamEntryFee: null,   // Remove team entry fee  
          entryFeeType: 'TEAM', // Set to TEAM (single fee type)
          // Keep the main entryFee as is
        }
      })
      
      console.log(`   After:  entryFee=${updatedTournament.entryFee}, playerEntryFee=${updatedTournament.playerEntryFee}, teamEntryFee=${updatedTournament.teamEntryFee}, entryFeeType=${updatedTournament.entryFeeType}`)
      console.log('   ✅ Fixed!')
    }
    
    if (tournamentsToFix.length === 0) {
      console.log('✅ No tournaments need fixing!')
    } else {
      console.log(`\n🎉 Successfully fixed ${tournamentsToFix.length} tournaments!`)
    }
    
  } catch (error) {
    console.error('❌ Error fixing tournaments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixKnockoutTournamentPayments()
