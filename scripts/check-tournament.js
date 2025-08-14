import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTournament() {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: 'cme8u82f10000u0xwwnf5ast8' },
      select: {
        id: true,
        name: true,
        format: true,
        overs: true,
        teamSize: true,
        substitutes: true,
        competitionType: true,
        requireTeamOwners: true,
        isAuctionBased: true
      }
    })
    console.log('Tournament settings:', JSON.stringify(tournament, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

checkTournament()
