import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTournamentDetails() {
  try {
    const tournamentId = 'cme8wixt00005u01kb65lg7mj'
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })
    
    if (!tournament) {
      console.log('Tournament not found')
      return
    }
    
    console.log('Tournament Details:')
    console.log('==================')
    console.log(`Name: ${tournament.name}`)
    console.log(`Competition Type: ${tournament.competitionType}`)
    console.log(`Format: ${tournament.format}`)
    console.log(`Team Size: ${tournament.teamSize}`)
    console.log(`Substitutes: ${tournament.substitutes}`)
    console.log(`Is Auction Based: ${tournament.isAuctionBased}`)
    console.log(`Require Team Owners: ${tournament.requireTeamOwners}`)
    console.log(`Status: ${tournament.status}`)
    console.log(`Entry Fee: ${tournament.entryFee}`)
    
    // Test the registration routing logic
    const competitionType = tournament.competitionType
    const isAuctionCompetition = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
    
    console.log('\nRegistration Routing:')
    console.log('====================')
    console.log(`Competition Type: ${competitionType}`)
    console.log(`Is Auction Competition: ${isAuctionCompetition}`)
    console.log(`Should use: ${isAuctionCompetition ? 'AuctionRegistration' : 'UniversalRegistration'}`)
    
    // Check if auto-generation should work
    console.log('\nAuto-generation Check:')
    console.log('=====================')
    console.log(`Team Size: ${tournament.teamSize} (will generate ${tournament.teamSize} player forms)`)
    console.log(`Entry Fee: ${tournament.entryFee} (will set as payment amount)`)
    
    if (tournament.teamSize && tournament.teamSize > 0) {
      console.log('✅ Auto-generation should work!')
    } else {
      console.log('❌ Auto-generation may fail - no team size set')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournamentDetails()
