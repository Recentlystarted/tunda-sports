const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupEmailRecipients() {
  console.log('🔧 Setting up sample email recipients...');

  try {
    // Get the superadmin user ID for addedBy field
    const superAdmin = await prisma.admin.findFirst({
      where: { role: 'SUPERADMIN' }
    });

    if (!superAdmin) {
      console.error('❌ No SUPERADMIN found. Please run the seed script first.');
      return;
    }

    // First, create email configuration if it doesn't exist
    const existingConfig = await prisma.emailConfiguration.findFirst();
    
    if (!existingConfig) {
      console.log('📧 Creating email configuration...');
      await prisma.emailConfiguration.create({
        data: {
          fromName: 'Tunda Sports Club',
          fromEmail: 'info@tundasportsclub.com',
          replyTo: 'info@tundasportsclub.com',
          smtpHost: 'smtp.hostinger.com',
          smtpPort: 465,
          smtpUser: 'info@tundasportsclub.com',
          smtpPassword: 'your-smtp-password', // Replace with actual password
          smtpSecure: true,
          includeFooter: true,
          footerText: '© 2025 Tunda Sports Club. All rights reserved.',
          logoUrl: '',
          isActive: true
        }
      });
      console.log('✅ Email configuration created');
    } else {
      console.log('📧 Email configuration already exists');
    }    // Create sample email recipients
    const recipients = [
      {
        email: 'admin@tundasportsclub.com',
        name: 'Head Administrator',
        role: 'Head Admin',
        receiveRegistrations: true,
        receiveApprovals: true,
        receiveRejections: true,
        receiveSystemAlerts: true,
        isCC: false,
        isBCC: false,
        isPrimary: true,
        isActive: true,
        addedBy: superAdmin.id
      },
      {
        email: 'tournaments@tundasportsclub.com',
        name: 'Tournament Manager',
        role: 'Tournament Manager',
        receiveRegistrations: true,
        receiveApprovals: true,
        receiveRejections: false,
        receiveSystemAlerts: false,
        isCC: true,
        isBCC: false,
        isPrimary: false,
        isActive: true,
        addedBy: superAdmin.id
      },
      {
        email: 'finance@tundasportsclub.com',
        name: 'Finance Manager',
        role: 'Finance Manager',
        receiveRegistrations: false,
        receiveApprovals: true,
        receiveRejections: true,
        receiveSystemAlerts: true,
        isCC: false,
        isBCC: true,
        isPrimary: false,
        isActive: true,
        addedBy: superAdmin.id
      }
    ];

    console.log('👥 Creating email recipients...');
      for (const recipient of recipients) {
      const existing = await prisma.adminEmailRecipient.findFirst({
        where: { email: recipient.email }
      });

      if (!existing) {
        await prisma.adminEmailRecipient.create({
          data: recipient
        });
        console.log(`✅ Created recipient: ${recipient.name} (${recipient.email})`);
      } else {
        console.log(`📧 Recipient already exists: ${recipient.email}`);
      }
    }

    // Display summary
    const totalRecipients = await prisma.adminEmailRecipient.count();
    const activeRecipients = await prisma.adminEmailRecipient.count({
      where: { isActive: true }
    });

    console.log('\n📊 Email Recipients Summary:');
    console.log(`   Total Recipients: ${totalRecipients}`);
    console.log(`   Active Recipients: ${activeRecipients}`);

    const primaryRecipient = await prisma.adminEmailRecipient.findFirst({
      where: { isPrimary: true, isActive: true }
    });

    if (primaryRecipient) {
      console.log(`   Primary Recipient: ${primaryRecipient.name} (${primaryRecipient.email})`);
    }

    console.log('\n✅ Email recipient setup completed!');
    console.log('\n🔧 Next Steps:');
    console.log('   1. Update SMTP password in email configuration');
    console.log('   2. Test email system with: node scripts/test-email-system.js');
    console.log('   3. Visit /admin/settings/email to manage recipients');

  } catch (error) {
    console.error('❌ Error setting up email recipients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEmailRecipients();
