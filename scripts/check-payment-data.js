import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTournamentPaymentData() {
  try {
    const tournamentId = 'cme8wixt00005u01kb65lg7mj'
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })
    
    if (!tournament) {
      console.log('Tournament not found')
      return
    }
    
    console.log('Tournament Payment Data:')
    console.log('========================')
    console.log(`Name: ${tournament.name}`)
    console.log(`Competition Type: ${tournament.competitionType}`)
    console.log(`Is Auction Based: ${tournament.isAuctionBased}`)
    console.log(`Require Team Owners: ${tournament.requireTeamOwners}`)
    console.log('')
    console.log('Payment Fields:')
    console.log(`- entryFee (main): ${tournament.entryFee}`)
    console.log(`- playerEntryFee: ${tournament.playerEntryFee}`)
    console.log(`- teamEntryFee: ${tournament.teamEntryFee}`)
    console.log(`- entryFeeType: ${tournament.entryFeeType}`)
    console.log('')
    console.log('Expected Payment Logic:')
    if (tournament.isAuctionBased) {
      console.log('✅ Auction Tournament:')
      console.log(`  - Player Registration: ₹${tournament.playerEntryFee || 0}`)
      console.log(`  - Team Owner Registration: ₹${tournament.teamEntryFee || 0}`)
    } else {
      console.log('✅ Regular Tournament:')
      console.log(`  - Team Registration: ₹${tournament.entryFee || 0}`)
      console.log(`  - Should NOT have Player Registration`)
    }
    
    console.log('')
    console.log('Current Issue:')
    console.log('The payment manager is showing:')
    console.log(`- Player Fee: ₹500 (hardcoded default)`)
    console.log(`- Team Fee: ₹5000 (wrong)`)
    console.log('')
    console.log('Should show for this knockout tournament:')
    console.log(`- General Registration: ₹${tournament.entryFee} (team entry fee)`)
    console.log('- No player registration option')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournamentPaymentData()
