const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEmailRecipients() {
  console.log('🌱 Seeding email recipients and configuration...');

  try {    // Create email configuration
    await prisma.emailConfiguration.create({
      data: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'admin@tundasportsclub.com',
        fromEmail: 'admin@tundasportsclub.com',
        fromName: 'Tunda Sports Club',
        isActive: true,
      },
    });    // Create email recipients
    const recipients = [
      {
        email: 'admin@tundasportsclub.com',
        name: 'Admin Team',
        role: 'ADMIN',
        isPrimary: true,
        isActive: true,
        receiveRegistrations: true,
        receiveApprovals: true,
        receiveRejections: true,
        receiveSystemAlerts: true,
        isCC: false,
        isBCC: false,
        addedBy: 'SYSTEM',
      },
      {
        email: 'sports@tundasportsclub.com',
        name: 'Sports Coordinator',
        role: 'SPORTS_COORDINATOR',
        isPrimary: false,
        isActive: true,
        receiveRegistrations: true,
        receiveApprovals: true,
        receiveRejections: true,
        receiveSystemAlerts: false,
        isCC: true,
        isBCC: false,
        addedBy: 'SYSTEM',
      },
      {
        email: 'events@tundasportsclub.com',
        name: 'Events Manager',
        role: 'EVENT_MANAGER',
        isPrimary: false,
        isActive: true,
        receiveRegistrations: false,
        receiveApprovals: false,
        receiveRejections: false,
        receiveSystemAlerts: true,
        isCC: true,
        isBCC: false,
        addedBy: 'SYSTEM',
      },
    ];

    for (const recipient of recipients) {
      await prisma.adminEmailRecipient.create({
        data: recipient,
      });
    }

    console.log('✅ Email recipients and configuration seeded successfully!');
    console.log('📋 Summary:');
    console.log('- Email configuration created with default SMTP settings');
    console.log('- 3 email recipients created:');
    console.log('  - admin@tundasportsclub.com (Primary Admin)');
    console.log('  - sports@tundasportsclub.com (Sports Coordinator)');
    console.log('  - events@tundasportsclub.com (Events Manager)');

  } catch (error) {
    console.error('Error seeding email recipients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailRecipients();
