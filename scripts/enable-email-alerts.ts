import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableEssentialEmailAlerts() {
  console.log('🔧 Enabling Essential Email Alerts...');

  // Define which alerts should be enabled for production use
  const essentialAlerts = [
    'player_registration',
    'player_approval', 
    'player_rejection',
    'team_registration',
    'team_approval',
    'team_rejection',
    'team_owner_registration',
    'team_owner_approval',
    'team_owner_rejection',
    'payment_received',
    'system_alert'
  ];

  try {
    let enabledCount = 0;

    for (const alertType of essentialAlerts) {
      const result = await prisma.emailAlertSettings.update({
        where: { alertType },
        data: {
          isEnabled: true,
          testingMode: false, // Disable testing mode for production
          updatedAt: new Date()
        }
      });

      console.log(`✅ Enabled: ${result.alertName}`);
      enabledCount++;
    }

    console.log(`\n📊 Summary: Enabled ${enabledCount} essential email alerts`);

    // Display updated settings
    console.log('\n📧 Updated Email Alert Settings:');
    const allSettings = await prisma.emailAlertSettings.findMany({
      orderBy: { alertType: 'asc' }
    });

    allSettings.forEach(setting => {
      const status = setting.isEnabled ? '🟢' : '🔴';
      const testing = setting.testingMode ? ' [TESTING]' : '';
      const recipients = [
        setting.enabledForPlayers ? 'Players' : null,
        setting.enabledForAdmins ? 'Admins' : null,
        setting.enabledForTeamOwners ? 'Owners' : null
      ].filter(Boolean).join(', ');
      
      console.log(`   ${status} ${setting.alertName}${testing}`);
      console.log(`      Recipients: ${recipients || 'None'}`);
    });

    console.log('\n✅ Essential email alerts enabled successfully!');
    console.log('\n💡 Note: Make sure SMTP settings are configured in Admin → Settings → Email');
    
  } catch (error) {
    console.error('❌ Failed to enable email alerts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enableEssentialEmailAlerts()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
