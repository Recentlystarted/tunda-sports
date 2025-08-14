import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentTournament() {
  try {
    console.log('🔍 Checking current tournaments in database...')
    
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    if (tournaments.length === 0) {
      console.log('❌ No tournaments found in database')
      return
    }
    
    console.log(`Found ${tournaments.length} recent tournaments:`)
    console.log('=====================================')
    
    tournaments.forEach((tournament, index) => {
      console.log(`${index + 1}. ${tournament.name}`)
      console.log(`   - ID: ${tournament.id}`)
      console.log(`   - Competition Type: ${tournament.competitionType}`)
      console.log(`   - Is Auction Based: ${tournament.isAuctionBased}`)
      console.log(`   - Require Team Owners: ${tournament.requireTeamOwners}`)
      console.log(`   - Owner Verification Required: ${tournament.ownerVerificationRequired}`)
      console.log(`   - Status: ${tournament.status}`)
      console.log(`   - Format: ${tournament.format}`)
      console.log('   ---')
    })
    
    // Check specifically for ONE_DAY_KNOCKOUT tournaments
    const knockoutTournaments = tournaments.filter(t => t.competitionType === 'ONE_DAY_KNOCKOUT')
    
    if (knockoutTournaments.length > 0) {
      console.log(`\n🎯 Found ${knockoutTournaments.length} ONE_DAY_KNOCKOUT tournaments:`)
      knockoutTournaments.forEach(tournament => {
        const registrationUrl = `http://localhost:3000/tournament/${tournament.id}/register`
        console.log(`   - ${tournament.name}: ${registrationUrl}`)
        
        // Check which registration component it should use
        const competitionType = tournament.competitionType
        const isAuctionCompetition = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
        
        console.log(`   - Should use: ${isAuctionCompetition ? 'AuctionRegistration' : 'UniversalRegistration'}`)
        console.log(`   - Settings correct: ${tournament.requireTeamOwners === false ? '✅' : '❌'}`)
      })
    } else {
      console.log('\n❌ No ONE_DAY_KNOCKOUT tournaments found')
    }
    
  } catch (error) {
    console.error('❌ Error checking tournaments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentTournament()
