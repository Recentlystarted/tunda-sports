#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏏 Tunda Sports Club - Database Setup Wizard\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file');
  } else {
    console.log('❌ .env.example not found. Creating basic .env...');
    const basicEnv = `# Add your database URL here
DATABASE_URL="postgresql://username:password@localhost:5432/tunda_sports_club"
ADMIN_PASSWORD="admin123"
NEXTAUTH_SECRET="change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
`;
    fs.writeFileSync(envPath, basicEnv);
  }
}

console.log('\n🔧 Database Setup Options:');
console.log('1. I have already set up my DATABASE_URL in .env');
console.log('2. Show me connection strings for popular providers');
console.log('3. Set up with local PostgreSQL');

console.log('\n📝 Current .env status:');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasDbUrl = envContent.includes('DATABASE_URL=') && 
                   !envContent.includes('localhost:5432') && 
                   !envContent.includes('username:password');
  
  if (hasDbUrl) {
    console.log('✅ DATABASE_URL appears to be configured');
    console.log('\n🚀 Ready to set up database! Run:');
    console.log('npm run db:setup');
  } else {
    console.log('⚠️  DATABASE_URL needs to be configured');
    console.log('\n📋 Popular database providers:');
    console.log('\n🟢 Neon (Free Forever)');
    console.log('   Website: https://neon.tech');
    console.log('   Format: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require');
    
    console.log('\n🟦 Supabase (Free Tier)');
    console.log('   Website: https://supabase.com');
    console.log('   Format: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres');
    
    console.log('\n🟣 Railway (Easy Deploy)');
    console.log('   Website: https://railway.app');
    console.log('   Format: postgresql://postgres:pass@viaduct.proxy.rlwy.net:port/railway');
    
    console.log('\n🔧 After setting up your database:');
    console.log('1. Update DATABASE_URL in .env file');
    console.log('2. Run: npm run db:setup');
    console.log('3. Start development: npm run dev');
  }
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}

console.log('\n📚 Need help? Check these files:');
console.log('- DATABASE_QUICKSTART.md - Step-by-step setup');
console.log('- DATABASE_SETUP_GUIDE.md - Detailed comparison');
console.log('- .env.example - Environment variables template');

module.exports = {};
