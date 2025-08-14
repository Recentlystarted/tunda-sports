const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTournamentDescriptions() {
  console.log('📝 Updating tournament descriptions with proper HTML...')

  try {
    // Update Kumbhar Premier League description
    await prisma.tournament.updateMany({
      where: {
        name: 'Kumbhar Premier League - Season 3'
      },
      data: {
        description: '<p><strong>Welcome to the third season of Kumbhar Premier League</strong>, the most exciting T10 cricket tournament in the region.</p><p>Join us for an action-packed season of cricket excellence with our innovative auction system where team owners bid for players using points!</p>'
      }
    })

    // Update Weekend League Championship description
    await prisma.tournament.updateMany({
      where: {
        name: 'Weekend League Championship'
      },
      data: {
        description: '<p><strong>Weekend League Championship</strong> - A regular weekend cricket tournament for local teams.</p><p>Standard T20 format with direct team registration and competitive play across multiple groups.</p>'
      }
    })

    // Update Corporate Cup description
    await prisma.tournament.updateMany({
      where: {
        name: 'Corporate Cup 2025'
      },
      data: {
        description: '<p><strong>Corporate Cup 2025</strong> - Annual corporate cricket tournament bringing together companies and organizations.</p><p>Perfect opportunity for networking, team building, and competitive cricket in a professional environment.</p>'
      }
    })

    console.log('✅ Tournament descriptions updated successfully!')
    
    // Verify the updates
    const tournaments = await prisma.tournament.findMany({
      select: {
        name: true,
        description: true
      }
    })
    
    tournaments.forEach(tournament => {
      console.log(`\n📄 ${tournament.name}:`)
      console.log(tournament.description)
    })
    
  } catch (error) {
    console.error('❌ Error updating descriptions:', error)
  }
}

async function main() {
  await updateTournamentDescriptions()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
