#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 VPS-Friendly Email Setup Tool\n');

const SMTP_SETTINGS_FILE = path.join(process.cwd(), 'temp', 'smtp-settings.json');

// VPS-friendly email providers
const vpsProviders = {
  sendgrid: {
    name: 'SendGrid',
    description: 'Most VPS-friendly, 100 free emails/day',
    setup: {
      enabled: true,
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      username: 'apikey', // Always 'apikey' for SendGrid
      password: 'your-sendgrid-api-key', // Replace with your API key
      fromEmail: 'noreply@yourdomain.com', // Replace with your verified domain
      fromName: 'Tunda Sports Club'
    },
    instructions: [
      '1. Sign up at https://sendgrid.com',
      '2. Verify your domain or use single sender verification',
      '3. Go to Settings → API Keys → Create API Key',
      '4. Choose "Restricted Access" → Mail Send permissions',
      '5. Copy the API key and replace "your-sendgrid-api-key"',
      '6. Update fromEmail with your verified email/domain'
    ]
  },
  
  mailgun: {
    name: 'Mailgun',
    description: 'Great for VPS, 5000 free emails/month',
    setup: {
      enabled: true,
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      username: 'postmaster@your-domain.mailgun.org', // Replace with your Mailgun domain
      password: 'your-mailgun-password', // Replace with your Mailgun password
      fromEmail: 'noreply@your-domain.mailgun.org', // Replace with your Mailgun domain
      fromName: 'Tunda Sports Club'
    },
    instructions: [
      '1. Sign up at https://mailgun.com',
      '2. Add and verify your domain',
      '3. Go to Domains → Select your domain → SMTP credentials',
      '4. Copy username and password',
      '5. Replace the placeholders above'
    ]
  },
  
  brevo: {
    name: 'Brevo (Sendinblue)',
    description: 'VPS-friendly, 300 free emails/day',
    setup: {
      enabled: true,
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      username: 'your-brevo-email@example.com', // Your Brevo account email
      password: 'your-brevo-smtp-key', // Your Brevo SMTP key
      fromEmail: 'noreply@yourdomain.com', // Your verified sender
      fromName: 'Tunda Sports Club'
    },
    instructions: [
      '1. Sign up at https://brevo.com',
      '2. Go to SMTP & API → SMTP',
      '3. Generate SMTP key',
      '4. Add sender email in Senders & IP',
      '5. Replace placeholders with your details'
    ]
  },
  
  gmail_oauth: {
    name: 'Gmail with OAuth2',
    description: 'More reliable than app passwords for VPS',
    setup: {
      enabled: true,
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'your-email@gmail.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        refreshToken: 'your-refresh-token'
      },
      fromEmail: 'your-email@gmail.com',
      fromName: 'Tunda Sports Club'
    },
    instructions: [
      '1. Go to Google Cloud Console',
      '2. Enable Gmail API',
      '3. Create OAuth2 credentials',
      '4. Use OAuth2 playground to get refresh token',
      '5. This is complex - consider SendGrid instead'
    ]
  }
};

function createBackupConfig() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(process.cwd(), 'temp', `smtp-settings-backup-${timestamp}.json`);
  
  if (fs.existsSync(SMTP_SETTINGS_FILE)) {
    fs.copyFileSync(SMTP_SETTINGS_FILE, backupFile);
    console.log(`📁 Backup created: ${backupFile}`);
  }
}

function setupProvider(providerKey) {
  const provider = vpsProviders[providerKey];
  if (!provider) {
    console.error('❌ Invalid provider');
    return;
  }
  
  console.log(`\n🔧 Setting up ${provider.name}`);
  console.log(`📝 ${provider.description}\n`);
  
  // Create backup
  createBackupConfig();
  
  // Ensure temp directory exists
  const tempDir = path.dirname(SMTP_SETTINGS_FILE);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Write new configuration
  fs.writeFileSync(SMTP_SETTINGS_FILE, JSON.stringify(provider.setup, null, 2));
  
  console.log('✅ Configuration file updated!');
  console.log(`📁 Config file: ${SMTP_SETTINGS_FILE}\n`);
  
  console.log('📋 Setup Instructions:');
  provider.instructions.forEach((instruction, index) => {
    console.log(`   ${index + 1}. ${instruction}`);
  });
  
  console.log('\n🔧 After completing setup:');
  console.log('   1. Update the configuration file with your actual credentials');
  console.log('   2. Test using: node scripts/diagnose-vps-email.js');
  console.log('   3. Deploy to VPS and test again');
}

function showMenu() {
  console.log('🔧 Choose a VPS-friendly email provider:\n');
  
  Object.entries(vpsProviders).forEach(([key, provider], index) => {
    console.log(`${index + 1}. ${provider.name}`);
    console.log(`   ${provider.description}\n`);
  });
  
  console.log('💡 Recommendation: SendGrid (#1) is most reliable for VPS');
  console.log('\n📞 Usage: node scripts/setup-vps-email.js [provider]');
  console.log('📞 Example: node scripts/setup-vps-email.js sendgrid');
}

// Main function
function main() {
  const provider = process.argv[2];
  
  if (!provider) {
    showMenu();
    return;
  }
  
  if (vpsProviders[provider]) {
    setupProvider(provider);
  } else {
    console.error(`❌ Unknown provider: ${provider}`);
    console.log('\n✅ Available providers:');
    Object.keys(vpsProviders).forEach(key => {
      console.log(`   - ${key}`);
    });
  }
}

main();
