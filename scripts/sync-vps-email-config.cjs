#!/usr/bin/env node

// VPS Email Configuration Sync Script
// This script ensures your VPS uses the same SMTP settings as your local environment

const fs = require('fs');
const path = require('path');

console.log('🔄 VPS Email Configuration Sync');
console.log('===============================\n');

// Hostinger SMTP configuration (working locally)
const hostingerConfig = {
  enabled: true,
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // Port 465 uses SSL
  username: 'info@tundasportsclub.com',
  password: process.env.SMTP_PASS || 'your-hostinger-email-password',
  fromEmail: 'info@tundasportsclub.com',
  fromName: 'Tunda Sports Club'
};

console.log('📧 Hostinger SMTP Configuration (Local Working Setup):');
console.log('   Host:', hostingerConfig.host);
console.log('   Port:', hostingerConfig.port);
console.log('   Username:', hostingerConfig.username);
console.log('   From:', hostingerConfig.fromEmail);
console.log('   SSL:', hostingerConfig.secure ? 'Yes' : 'No');

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('\n✅ Created temp directory');
}

// Write the working configuration
const configFile = path.join(tempDir, 'smtp-settings.json');
fs.writeFileSync(configFile, JSON.stringify(hostingerConfig, null, 2));

console.log('\n✅ Created Hostinger SMTP configuration file');
console.log('📁 Config file:', configFile);

// Create VPS deployment instructions
const vpsInstructions = `
# VPS Deployment Instructions for Email Fix

## Problem Identified:
- Local environment: Using Hostinger SMTP (working ✅)
- VPS environment: Using Gmail SMTP (failing ❌)

## Solution:
Use the same Hostinger SMTP configuration on both environments.

## VPS Environment Variables:
Add these to your VPS .env.local or environment:

\`\`\`env
# Hostinger SMTP Settings (Working Configuration)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@tundasportsclub.com
SMTP_PASS=your-hostinger-email-password
SMTP_FROM_EMAIL=info@tundasportsclub.com
SMTP_FROM_NAME=Tunda Sports Club
\`\`\`

## VPS Deployment Steps:

1. **SSH into your VPS:**
   \`\`\`bash
   ssh your-user@your-vps-ip
   cd /var/www/tunda-sports-club
   \`\`\`

2. **Update environment variables:**
   \`\`\`bash
   nano .env.local
   # Add the Hostinger SMTP settings above
   \`\`\`

3. **Copy the working SMTP config:**
   \`\`\`bash
   mkdir -p temp
   # Upload the smtp-settings.json file to VPS temp/ directory
   \`\`\`

4. **Restart your application:**
   \`\`\`bash
   pm2 restart tunda-sports-club
   pm2 logs tunda-sports-club --lines 50
   \`\`\`

5. **Test email functionality:**
   - Register a test user on your live site
   - Check the logs for email success/failure

## Alternative: Use SCP to copy config file:
\`\`\`bash
scp temp/smtp-settings.json your-user@your-vps:/var/www/tunda-sports-club/temp/
\`\`\`

## Verify VPS Configuration:
After deployment, run this on VPS to test:
\`\`\`bash
cd /var/www/tunda-sports-club
node scripts/vps-email-urgent-fix.js
\`\`\`

## Expected Result:
Your VPS should now send emails successfully using Hostinger SMTP,
just like your local environment does.
`;

fs.writeFileSync(path.join(process.cwd(), 'VPS_EMAIL_DEPLOYMENT_INSTRUCTIONS.md'), vpsInstructions);

console.log('\n📋 VPS Deployment Instructions Created');
console.log('📄 File: VPS_EMAIL_DEPLOYMENT_INSTRUCTIONS.md');

console.log('\n🚀 IMMEDIATE ACTION REQUIRED:');
console.log('1. Upload smtp-settings.json to your VPS temp/ directory');
console.log('2. Update VPS environment variables with Hostinger settings');
console.log('3. Restart your VPS application');
console.log('4. Test email registration on live site');

console.log('\n💡 Why this will work:');
console.log('- Hostinger SMTP works on your local machine');
console.log('- Hostinger SMTP is VPS-friendly (unlike Gmail)');
console.log('- You already have valid Hostinger email credentials');
console.log('- No additional setup or API keys needed');

// Create quick VPS test script
const vpsTestScript = `#!/usr/bin/env node

// Quick VPS Email Test
const nodemailer = require('nodemailer');

const testHostingerSMTP = async () => {
  console.log('🧪 Testing Hostinger SMTP on VPS...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'info@tundasportsclub.com',
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Hostinger SMTP connection verified!');
    
    const testEmail = {
      from: 'info@tundasportsclub.com',
      to: 'info@tundasportsclub.com',
      subject: '🎉 VPS Email Test - Hostinger SMTP',
      html: '<h2>Success!</h2><p>Hostinger SMTP is working on VPS!</p>'
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('📧 Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Hostinger SMTP test failed:', error.message);
  }
};

testHostingerSMTP();
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'test-hostinger-vps.js'), vpsTestScript);

console.log('\n📧 VPS Test Script Created: scripts/test-hostinger-vps.js');
console.log('\n✅ Configuration sync complete!');
