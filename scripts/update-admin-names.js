const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateAdminNames() {
  try {
    console.log('🔧 Updating admin names...')

    // Get all admins without names
    const admins = await prisma.admin.findMany({
      where: {
        name: null
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    })

    console.log(`📋 Found ${admins.length} admins without names`)

    for (const admin of admins) {
      // Generate a name from username (capitalize first letter)
      const name = admin.username.charAt(0).toUpperCase() + admin.username.slice(1)
      
      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: { name: name },
        select: {
          id: true,
          name: true,
          username: true,
          role: true
        }
      })

      console.log(`✅ Updated ${admin.username} -> name: "${updated.name}"`)
    }

    // Verify all admins now have names
    const allAdmins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true
      }
    })

    console.log('\n📋 All admins:')
    allAdmins.forEach(admin => {
      console.log(`  • ${admin.name || 'NO NAME'} (${admin.username}) - ${admin.role}`)
    })

    console.log('\n✅ Admin names update completed!')

  } catch (error) {
    console.error('❌ Error updating admin names:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminNames()
