const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateGoogleDriveUrls() {
  try {
    console.log('Starting Google Drive URL migration...')

    // Update section images
    const sectionImages = await prisma.sectionImage.findMany({
      where: {
        imageUrl: {
          contains: 'drive.google.com/uc?id='
        }
      }
    })

    console.log(`Found ${sectionImages.length} section images to update`)

    for (const image of sectionImages) {
      const fileId = image.imageUrl.match(/id=([^&]+)/)?.[1]
      if (fileId) {
        const newUrl = `/api/proxy/gdrive?id=${fileId}`
        await prisma.sectionImage.update({
          where: { id: image.id },
          data: { imageUrl: newUrl }
        })
        console.log(`Updated section image ${image.id}: ${image.imageUrl} -> ${newUrl}`)
      }
    }

    // Update person profile images
    const people = await prisma.person.findMany({
      where: {
        profileImage: {
          contains: 'drive.google.com/uc?id='
        }
      }
    })

    console.log(`Found ${people.length} person profile images to update`)

    for (const person of people) {
      if (person.profileImage) {
        const fileId = person.profileImage.match(/id=([^&]+)/)?.[1]
        if (fileId) {
          const newUrl = `/api/proxy/gdrive?id=${fileId}`
          await prisma.person.update({
            where: { id: person.id },
            data: { profileImage: newUrl }
          })
          console.log(`Updated person ${person.id}: ${person.profileImage} -> ${newUrl}`)
        }
      }
    }

    console.log('Google Drive URL migration completed!')

  } catch (error) {
    console.error('Error during migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateGoogleDriveUrls()
