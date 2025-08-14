import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SMTP_SETTINGS_FILE = join(process.cwd(), 'temp', 'smtp-settings.json');

async function enableEmailWithGmailExample() {
  console.log('📧 Setting up Email Configuration...\n');

  // Ensure temp directory exists
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
    console.log('✅ Created temp directory');
  }

  // Gmail SMTP configuration template
  const gmailSMTPSettings = {
    enabled: true, // Enable email sending
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    username: 'your-email@gmail.com', // Replace with your Gmail
    password: 'your-app-password', // Replace with Gmail App Password
    fromEmail: 'your-email@gmail.com', // Replace with your Gmail
    fromName: 'Tunda Sports Club'
  };

  // Alternative configurations for different providers
  const configurations = {
    gmail: {
      ...gmailSMTPSettings,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    },
    outlook: {
      ...gmailSMTPSettings,
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      username: 'your-email@outlook.com',
      fromEmail: 'your-email@outlook.com'
    },
    yahoo: {
      ...gmailSMTPSettings,
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
      username: 'your-email@yahoo.com',
      fromEmail: 'your-email@yahoo.com'
    },
    custom: {
      ...gmailSMTPSettings,
      host: 'your-smtp-server.com',
      port: 587,
      secure: false,
      username: 'your-username',
      fromEmail: 'noreply@yourdomain.com'
    }
  };

  // Write the Gmail configuration as default
  writeFileSync(SMTP_SETTINGS_FILE, JSON.stringify(gmailSMTPSettings, null, 2));

  console.log('✅ SMTP configuration file created with Gmail template\n');
  
  console.log('📋 Configuration Details:');
  console.log('   🏠 Host: smtp.gmail.com');
  console.log('   🔌 Port: 587');
  console.log('   🔐 Security: STARTTLS (not SSL)');
  console.log('   📧 From Email: your-email@gmail.com');
  console.log('   👨‍💼 From Name: Tunda Sports Club');
  console.log('   📁 Config File: ' + SMTP_SETTINGS_FILE);

  console.log('\n🔧 To Complete Setup:');
  console.log('   1. Edit the file: ' + SMTP_SETTINGS_FILE);
  console.log('   2. Replace "your-email@gmail.com" with your actual Gmail address');
  console.log('   3. Replace "your-app-password" with your Gmail App Password');
  console.log('   4. Or visit: http://localhost:3000/admin/settings/email');

  console.log('\n🔑 Gmail App Password Setup:');
  console.log('   1. Go to your Google Account settings');
  console.log('   2. Security → 2-Step Verification');
  console.log('   3. App passwords → Generate app password');
  console.log('   4. Select "Mail" as the app');
  console.log('   5. Copy the 16-character password');

  console.log('\n📧 Other Email Provider Examples:');
  console.log('   📁 Check these configuration examples:');
  
  // Write example configurations to separate files
  Object.entries(configurations).forEach(([provider, config]) => {
    const exampleFile = join(tempDir, `smtp-${provider}-example.json`);
    writeFileSync(exampleFile, JSON.stringify(config, null, 2));
    console.log(`      ${provider.toUpperCase()}: ${exampleFile}`);
  });

  console.log('\n✅ Email configuration setup complete!');
  console.log('💡 After updating credentials, test email sending in the admin panel.');
}

// Run the setup
enableEmailWithGmailExample()
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
