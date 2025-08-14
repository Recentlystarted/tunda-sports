const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAuctionTeamBudgets() {
  try {
    console.log('🔧 Fixing auction team budgets...')

    // Find the auction tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: 'Kumbhar Premier League - Season 3',
        isAuctionBased: true
      },
      select: {
        id: true,
        name: true,
        auctionBudget: true,
        _count: {
          select: {
            auctionTeams: true,
            teamOwners: true
          }
        }
      }
    })

    if (!tournament) {
      console.log('❌ No auction tournament found')
      return
    }

    console.log(`📊 Tournament: ${tournament.name}`)
    console.log(`💰 Tournament auction budget: ${tournament.auctionBudget}`)
    console.log(`🏆 Auction teams: ${tournament._count?.auctionTeams || 0}`)
    console.log(`👥 Team owners: ${tournament._count?.teamOwners || 0}`)

    // Update auction teams if they exist
    if (tournament._count?.auctionTeams > 0) {
      const updatedAuctionTeams = await prisma.auctionTeam.updateMany({
        where: {
          tournamentId: tournament.id,
          totalBudget: {
            not: tournament.auctionBudget
          }
        },
        data: {
          totalBudget: tournament.auctionBudget || 50000,
          remainingBudget: tournament.auctionBudget || 50000
        }
      })

      console.log(`✅ Updated ${updatedAuctionTeams.count} auction teams with correct budget`)
    }

    // Update team owners if they exist
    if (tournament._count?.teamOwners > 0) {
      const updatedTeamOwners = await prisma.teamOwner.updateMany({
        where: {
          tournamentId: tournament.id,
          totalBudget: {
            not: tournament.auctionBudget
          }
        },
        data: {
          totalBudget: tournament.auctionBudget || 50000,
          remainingBudget: tournament.auctionBudget || 50000
        }
      })

      console.log(`✅ Updated ${updatedTeamOwners.count} team owners with correct budget`)
    }

    // Verify the updates
    const verifyAuctionTeams = await prisma.auctionTeam.findMany({
      where: {
        tournamentId: tournament.id
      },
      select: {
        id: true,
        name: true,
        ownerName: true,
        totalBudget: true,
        remainingBudget: true
      }
    })

    const verifyTeamOwners = await prisma.teamOwner.findMany({
      where: {
        tournamentId: tournament.id
      },
      select: {
        id: true,
        teamName: true,
        ownerName: true,
        totalBudget: true,
        remainingBudget: true
      }
    })

    console.log('\n📋 Current Auction Teams:')
    verifyAuctionTeams.forEach(team => {
      console.log(`  • ${team.name || 'Unnamed'} (${team.ownerName}): ${team.totalBudget} points budget`)
    })

    console.log('\n📋 Current Team Owners:')
    verifyTeamOwners.forEach(owner => {
      console.log(`  • ${owner.teamName || 'Unnamed'} (${owner.ownerName}): ${owner.totalBudget} points budget`)
    })

    console.log('\n✅ Auction budget fix completed!')

  } catch (error) {
    console.error('❌ Error fixing auction budgets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuctionTeamBudgets()
