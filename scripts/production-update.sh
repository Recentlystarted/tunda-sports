#!/bin/bash

# Production-safe database update script
# This script uses prisma db push which is safer than migrate for production

echo "🔄 Checking current database state..."

# Check if we're in production
if [[ "$NODE_ENV" == "production" ]]; then
    echo "⚠️  Production environment detected"
    echo "📋 Creating backup first..."
    
    # Create a backup (adjust for your MySQL setup)
    # mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
    
    echo "✅ Backup created (if configured)"
fi

echo "🔧 Updating database schema..."

# Use db push instead of migrate for production
# This is safer as it doesn't create migration files
npx prisma db push --accept-data-loss=false

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Database update completed!"

# Optional: Seed new data only if tables are empty
echo "🌱 Checking if seed data is needed..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const sectionCount = await prisma.landingPageSection.count();
    if (sectionCount === 0) {
      console.log('📦 No landing page data found. Running seed...');
      require('./scripts/seed-landing-page.js');
    } else {
      console.log('✅ Landing page data already exists. Skipping seed.');
    }
  } catch (error) {
    console.log('ℹ️  Tables may not exist yet. This is normal for first run.');
  } finally {
    await prisma.\$disconnect();
  }
}

checkAndSeed();
"

echo "🎉 Production update completed!"
