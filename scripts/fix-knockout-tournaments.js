import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixKnockoutTournaments() {
  try {
    console.log('🔍 Finding tournaments that need fixing...')
    
    // Find all ONE_DAY_KNOCKOUT tournaments with requireTeamOwners: true
    const problematicTournaments = await prisma.tournament.findMany({
      where: {
        competitionType: 'ONE_DAY_KNOCKOUT',
        requireTeamOwners: true
      },
      select: {
        id: true,
        name: true,
        competitionType: true,
        requireTeamOwners: true,
        isAuctionBased: true,
        entryFeeType: true
      }
    })
    
    console.log(`📊 Found ${problematicTournaments.length} tournaments to fix:`)
    problematicTournaments.forEach(t => {
      console.log(`  - ${t.name} (ID: ${t.id})`)
      console.log(`    Current: requireTeamOwners=${t.requireTeamOwners}, isAuctionBased=${t.isAuctionBased}, entryFeeType=${t.entryFeeType}`)
    })
    
    if (problematicTournaments.length === 0) {
      console.log('✅ No tournaments need fixing!')
      return
    }
    
    // Fix each tournament
    for (const tournament of problematicTournaments) {
      console.log(`🔧 Fixing tournament: ${tournament.name}`)
      
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: {
          requireTeamOwners: false,
          isAuctionBased: false,
          entryFeeType: 'TEAM',
          ownerVerificationRequired: false
        }
      })
      
      console.log(`✅ Fixed: ${tournament.name}`)
    }
    
    console.log('🎉 All tournaments fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing tournaments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixKnockoutTournaments()
