import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const SMTP_SETTINGS_FILE = join(process.cwd(), 'temp', 'smtp-settings.json');
const RECIPIENTS_FILE = join(process.cwd(), 'temp', 'email-recipients.json');

async function checkEmailConfiguration() {
  console.log('📧 Checking Email Configuration...\n');

  // 1. Check Email Alert Settings
  console.log('1️⃣ Email Alert Settings:');
  const alertSettings = await prisma.emailAlertSettings.findMany({
    where: { isEnabled: true },
    orderBy: { alertType: 'asc' }
  });

  console.log(`   ✅ ${alertSettings.length} email alerts are enabled`);
  alertSettings.forEach(setting => {
    const testing = setting.testingMode ? ' [TESTING]' : '';
    const recipients = [
      setting.enabledForPlayers ? 'Players' : null,
      setting.enabledForAdmins ? 'Admins' : null,
      setting.enabledForTeamOwners ? 'Owners' : null
    ].filter(Boolean).join(', ');
    
    console.log(`      🟢 ${setting.alertName}${testing} → ${recipients}`);
  });

  // 2. Check SMTP Configuration
  console.log('\n2️⃣ SMTP Configuration:');
  try {
    if (!existsSync(SMTP_SETTINGS_FILE)) {
      console.log('   ❌ SMTP settings file not found');
      console.log('   📁 Expected: ' + SMTP_SETTINGS_FILE);
      await createDefaultSMTPSettings();
    } else {
      const smtpData = readFileSync(SMTP_SETTINGS_FILE, 'utf-8');
      const smtpSettings = JSON.parse(smtpData);
      
      console.log(`   📋 SMTP Status: ${smtpSettings.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   🏠 Host: ${smtpSettings.host || 'Not configured'}`);
      console.log(`   🔌 Port: ${smtpSettings.port || 'Not configured'}`);
      console.log(`   🔐 Secure: ${smtpSettings.secure ? 'Yes' : 'No'}`);
      console.log(`   👤 Username: ${smtpSettings.username || 'Not configured'}`);
      console.log(`   🔑 Password: ${smtpSettings.password ? '••••••••' : 'Not configured'}`);
      console.log(`   📧 From Email: ${smtpSettings.fromEmail || 'Not configured'}`);
      console.log(`   👨‍💼 From Name: ${smtpSettings.fromName || 'Not configured'}`);

      if (!smtpSettings.enabled) {
        console.log('   ⚠️  SMTP is disabled - emails will not be sent');
      } else if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
        console.log('   ⚠️  SMTP configuration incomplete');
      } else {
        console.log('   ✅ SMTP configuration looks complete');
      }
    }
  } catch (error) {
    console.log('   ❌ Error reading SMTP settings:', error);
  }

  // 3. Check Email Recipients
  console.log('\n3️⃣ Admin Email Recipients:');
  try {
    if (!existsSync(RECIPIENTS_FILE)) {
      console.log('   ❌ Recipients file not found');
      console.log('   📁 Expected: ' + RECIPIENTS_FILE);
      await createDefaultRecipients();
    } else {
      const recipientsData = readFileSync(RECIPIENTS_FILE, 'utf-8');
      const recipients = JSON.parse(recipientsData);
      
      if (recipients.length === 0) {
        console.log('   ⚠️  No admin recipients configured');
      } else {
        console.log(`   ✅ ${recipients.length} admin recipient(s) configured:`);
        recipients.forEach((recipient: any) => {
          console.log(`      📧 ${recipient.email} (${recipient.name || 'No name'})`);
        });
      }
    }
  } catch (error) {
    console.log('   ❌ Error reading recipients:', error);
  }

  // 4. Database Email Configuration
  console.log('\n4️⃣ Database Email Configuration:');
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (emailConfig) {
      console.log(`   ✅ Email configuration found in database`);
      console.log(`   📧 From: ${emailConfig.fromName} <${emailConfig.fromEmail}>`);
      console.log(`   🔄 Reply To: ${emailConfig.replyTo || 'Not set'}`);
      console.log(`   📋 Active: ${emailConfig.isActive ? 'Yes' : 'No'}`);
      console.log(`   📄 Footer: ${emailConfig.includeFooter ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log('   ⚠️  No email configuration found in database');
    }

    const adminRecipients = await prisma.adminEmailRecipient.findMany({
      where: { isActive: true }
    });
    console.log(`   👥 Database recipients: ${adminRecipients.length}`);
  } catch (error) {
    console.log('   ❌ Error checking database configuration:', error);
  }

  // 5. Summary and Recommendations
  console.log('\n📊 Summary and Recommendations:');
  const smtpConfigured = existsSync(SMTP_SETTINGS_FILE);
  const recipientsConfigured = existsSync(RECIPIENTS_FILE);
  
  if (!smtpConfigured) {
    console.log('   🔧 Configure SMTP settings in Admin → Settings → Email');
  }
  
  if (!recipientsConfigured) {
    console.log('   👥 Add admin email recipients in Admin → Settings → Email');
  }
  
  if (smtpConfigured && recipientsConfigured) {
    console.log('   ✅ Email system appears to be configured');
    console.log('   🧪 You can test email sending in Admin → Settings → Email → Test Email');
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Visit: http://localhost:3000/admin/settings/email');
  console.log('   2. Configure SMTP settings (Gmail, Outlook, or custom SMTP)');
  console.log('   3. Add admin email recipients');
  console.log('   4. Send a test email to verify configuration');
  console.log('   5. Check email alert settings if needed');
}

async function createDefaultSMTPSettings() {
  console.log('   🔧 Creating default SMTP settings file...');
  
  // Ensure temp directory exists
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const defaultSettings = {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: 'noreply@tundasportsclub.com',
    fromName: 'Tunda Sports Club'
  };

  writeFileSync(SMTP_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  console.log('   ✅ Default SMTP settings file created');
}

async function createDefaultRecipients() {
  console.log('   🔧 Creating default recipients file...');
  
  // Ensure temp directory exists
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const defaultRecipients = [
    {
      email: 'admin@tundasportsclub.com',
      name: 'Admin',
      role: 'Administrator'
    }
  ];

  writeFileSync(RECIPIENTS_FILE, JSON.stringify(defaultRecipients, null, 2));
  console.log('   ✅ Default recipients file created');
}

// Run the check
checkEmailConfiguration()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
