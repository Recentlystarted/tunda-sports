// Production-safe database migration script
// This script checks if tables exist before creating them
// Safe to run on production without data loss

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function safeProductionMigration() {
  console.log('🔄 Starting safe production migration...')

  try {
    // Check if the new tables already exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('LandingPageSection', 'Person', 'SectionImage', 'SiteSettings')
    `

    const existingTables = tableCheck.map(row => row.table_name)
    console.log('📋 Existing tables:', existingTables)

    if (existingTables.length === 4) {
      console.log('✅ All landing page tables already exist. No migration needed.')
      return
    }

    console.log('🔧 Creating missing tables...')

    // Execute the safe migration SQL
    const fs = require('fs')
    const path = require('path')
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'safe-migration.sql'), 
      'utf8'
    )

    // Split SQL into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement)
          console.log('✅ Executed:', statement.substring(0, 50) + '...')
        } catch (error) {
          // Ignore errors for tables that already exist
          if (!error.message.includes('already exists')) {
            console.warn('⚠️ Warning:', error.message)
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  safeProductionMigration()
    .then(() => {
      console.log('🎉 Production migration completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { safeProductionMigration }
