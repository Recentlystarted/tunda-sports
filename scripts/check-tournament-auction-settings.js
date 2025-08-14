const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTournamentAuctionSettings() {
  try {
    console.log('🔍 Checking tournament auction settings...')

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
        teamEntryFee: true,
        playerEntryFee: true,
        auctionCurrency: true,
        pointsBased: true,
        _count: {
          select: {
            auctionTeams: true,
            teamOwners: true,
            auctionPlayers: true
          }
        }
      }
    })

    if (!tournament) {
      console.log('❌ No auction tournament found')
      return
    }

    console.log('\n📊 Tournament Settings:')
    console.log(`  📝 Name: ${tournament.name}`)
    console.log(`  💰 Auction Budget: ${tournament.auctionBudget}`)
    console.log(`  👥 Team Entry Fee: ${tournament.teamEntryFee}`)
    console.log(`  🏏 Player Entry Fee: ${tournament.playerEntryFee}`)
    console.log(`  💱 Currency: ${tournament.auctionCurrency}`)
    console.log(`  🎯 Points Based: ${tournament.pointsBased}`)
    console.log(`  🏆 Auction Teams: ${tournament._count?.auctionTeams || 0}`)
    console.log(`  👤 Team Owners: ${tournament._count?.teamOwners || 0}`)
    console.log(`  🏏 Players: ${tournament._count?.auctionPlayers || 0}`)

    // Check individual auction teams
    if (tournament._count?.auctionTeams > 0) {
      const auctionTeams = await prisma.auctionTeam.findMany({
        where: {
          tournamentId: tournament.id
        },
        select: {
          id: true,
          name: true,
          ownerName: true,
          totalBudget: true,
          remainingBudget: true,
          spentAmount: true
        }
      })

      console.log('\n🏆 Auction Teams:')
      auctionTeams.forEach(team => {
        console.log(`  • ${team.name || 'Unnamed'} (${team.ownerName}):`)
        console.log(`    💰 Total: ${team.totalBudget}, Remaining: ${team.remainingBudget}, Spent: ${team.spentAmount}`)
      })
    }

    // Check individual team owners
    if (tournament._count?.teamOwners > 0) {
      const teamOwners = await prisma.teamOwner.findMany({
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

      console.log('\n👤 Team Owners:')
      teamOwners.forEach(owner => {
        console.log(`  • ${owner.teamName || 'Unnamed'} (${owner.ownerName}):`)
        console.log(`    💰 Total: ${owner.totalBudget}, Remaining: ${owner.remainingBudget}`)
      })
    }

    console.log('\n✅ Tournament data check completed!')

  } catch (error) {
    console.error('❌ Error checking tournament data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournamentAuctionSettings()
