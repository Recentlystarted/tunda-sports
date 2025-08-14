import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTournamentOwners() {
  try {
    console.log('🔍 Finding tournaments with incorrect requireTeamOwners settings...')
    
    // Find all non-auction tournaments that have requireTeamOwners: true
    const nonAuctionTournaments = await prisma.tournament.findMany({
      where: {
        competitionType: {
          notIn: ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT']
        },
        requireTeamOwners: true
      },
      select: {
        id: true,
        name: true,
        competitionType: true,
        requireTeamOwners: true,
        isAuctionBased: true
      }
    })
    
    console.log(`Found ${nonAuctionTournaments.length} non-auction tournaments with requireTeamOwners: true`)
    
    if (nonAuctionTournaments.length > 0) {
      console.log('\nTournaments to fix:')
      nonAuctionTournaments.forEach(tournament => {
        console.log(`- ${tournament.name} (${tournament.competitionType})`)
      })
      
      // Fix these tournaments
      const updateResult = await prisma.tournament.updateMany({
        where: {
          id: {
            in: nonAuctionTournaments.map(t => t.id)
          }
        },
        data: {
          requireTeamOwners: false,
          ownerVerificationRequired: false,
          isAuctionBased: false
        }
      })
      
      console.log(`\n✅ Fixed ${updateResult.count} tournaments`)
    }
    
    // Also find auction tournaments that might have requireTeamOwners: false
    const auctionTournaments = await prisma.tournament.findMany({
      where: {
        competitionType: {
          in: ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT']
        },
        requireTeamOwners: false
      },
      select: {
        id: true,
        name: true,
        competitionType: true,
        requireTeamOwners: true,
        isAuctionBased: true
      }
    })
    
    console.log(`\nFound ${auctionTournaments.length} auction tournaments with requireTeamOwners: false`)
    
    if (auctionTournaments.length > 0) {
      console.log('\nAuction tournaments to fix:')
      auctionTournaments.forEach(tournament => {
        console.log(`- ${tournament.name} (${tournament.competitionType})`)
      })
      
      // Fix these tournaments
      const updateResult = await prisma.tournament.updateMany({
        where: {
          id: {
            in: auctionTournaments.map(t => t.id)
          }
        },
        data: {
          requireTeamOwners: true,
          ownerVerificationRequired: true,
          isAuctionBased: true
        }
      })
      
      console.log(`✅ Fixed ${updateResult.count} auction tournaments`)
    }
    
    console.log('\n🎉 Tournament ownership settings fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing tournaments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTournamentOwners()
