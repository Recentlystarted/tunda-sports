const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTournamentImages() {
  console.log('🖼️ Adding specific tournament images...')

  try {
    // Get tournament IDs
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true }
    })

    for (const tournament of tournaments) {
      // Check if tournament already has images
      const existingImages = await prisma.tournamentImage.count({
        where: { tournamentId: tournament.id }
      })

      if (existingImages === 0) {
        let imageUrl = ''
        let title = ''
        let description = ''

        // Set specific images based on tournament type
        if (tournament.name.includes('Kumbhar Premier League')) {
          imageUrl = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
          title = 'Kumbhar Premier League - Auction Tournament'
          description = 'T10 cricket tournament with exciting player auction system'
        } else if (tournament.name.includes('Weekend League')) {
          imageUrl = 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
          title = 'Weekend League Championship - T20 Cricket'
          description = 'Regular T20 cricket tournament for local teams'
        } else if (tournament.name.includes('Corporate Cup')) {
          imageUrl = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
          title = 'Corporate Cup - Professional Tournament'
          description = 'Corporate cricket tournament for companies and organizations'
        } else {
          // Default cricket image
          imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
          title = 'Cricket Tournament'
          description = 'Exciting cricket tournament at Tunda Cricket Ground'
        }

        await prisma.tournamentImage.create({
          data: {
            tournamentId: tournament.id,
            filename: `${tournament.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-banner.jpg`,
            originalName: `${title}.jpg`,
            mimeType: 'image/jpeg',
            size: 1024000, // Approximate size
            googleDriveUrl: imageUrl,
            publicUrl: imageUrl,
            category: 'TOURNAMENT',
            description: description,
            isPublic: true
          }
        })

        console.log(`✅ Added image for: ${tournament.name}`)
      } else {
        console.log(`⏭️ ${tournament.name} already has images`)
      }
    }

    console.log('✅ Tournament images setup completed!')
    
  } catch (error) {
    console.error('❌ Error adding tournament images:', error)
  }
}

async function main() {
  await addTournamentImages()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
