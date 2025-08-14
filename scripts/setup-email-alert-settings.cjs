const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeEmailAlertSettings() {
  console.log('🔧 Initializing email alert settings...');

  try {
    // Check if any settings already exist
    const existingCount = await prisma.emailAlertSettings.count();
    
    if (existingCount > 0) {
      console.log(`📧 Found ${existingCount} existing email alert settings. Skipping initialization.`);
      return;
    }

    // Get SUPERADMIN for lastModifiedBy field
    const superAdmin = await prisma.admin.findFirst({
      where: { role: 'SUPERADMIN' }
    });

    if (!superAdmin) {
      console.error('❌ No SUPERADMIN found. Please create a SUPERADMIN first.');
      return;
    }

    const defaultSettings = [
      {
        alertType: 'player_registration',
        alertName: 'Player Registration',
        description: 'Triggered when a new player registers for a tournament',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: true,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_registration',
        alertName: 'Team Registration',
        description: 'Triggered when a new team registers for a tournament',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: true,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'player_approval',
        alertName: 'Player Approval',
        description: 'Triggered when a player registration is approved',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'player_rejection',
        alertName: 'Player Rejection',
        description: 'Triggered when a player registration is rejected',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_approval',
        alertName: 'Team Approval',
        description: 'Triggered when a team registration is approved',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_rejection',
        alertName: 'Team Rejection',
        description: 'Triggered when a team registration is rejected',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_owner_registration',
        alertName: 'Team Owner Registration',
        description: 'Triggered when a team owner registers for auction tournament',
        isEnabled: true,
        enabledForPlayers: false,
        enabledForAdmins: true,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_owner_approval',
        alertName: 'Team Owner Approval',
        description: 'Triggered when a team owner registration is approved',
        isEnabled: true,
        enabledForPlayers: false,
        enabledForAdmins: false,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'team_owner_rejection',
        alertName: 'Team Owner Rejection',
        description: 'Triggered when a team owner registration is rejected',
        isEnabled: true,
        enabledForPlayers: false,
        enabledForAdmins: false,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'auction_player_sold',
        alertName: 'Auction - Player Sold',
        description: 'Triggered when a player is sold in auction',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'auction_player_unsold',
        alertName: 'Auction - Player Unsold',
        description: 'Triggered when a player goes unsold in auction',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'payment_received',
        alertName: 'Payment Received',
        description: 'Triggered when team/player payment is received',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: true,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'payment_pending',
        alertName: 'Payment Pending Reminder',
        description: 'Triggered to remind about pending payments',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: true,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'tournament_reminder',
        alertName: 'Tournament Reminder',
        description: 'Triggered to send tournament reminders',
        isEnabled: true,
        enabledForPlayers: true,
        enabledForAdmins: false,
        enabledForTeamOwners: true,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      },
      {
        alertType: 'system_alert',
        alertName: 'System Alerts',
        description: 'Important system notifications and announcements',
        isEnabled: true,
        enabledForPlayers: false,
        enabledForAdmins: true,
        enabledForTeamOwners: false,
        testingMode: false,
        lastModifiedBy: superAdmin.id
      }
    ];

    console.log('📧 Creating default email alert settings...');
    
    for (const setting of defaultSettings) {
      await prisma.emailAlertSettings.create({
        data: setting
      });
      console.log(`✅ Created: ${setting.alertName}`);
    }

    console.log(`\n🎉 Successfully initialized ${defaultSettings.length} email alert settings!`);
    console.log('\n📋 Summary:');
    console.log('- All alerts are ENABLED by default');
    console.log('- Testing mode is DISABLED by default (emails will be sent)');
    console.log('- Settings can be managed by SUPERADMIN users only');
    console.log('- Access: /admin/settings/email-alerts');

  } catch (error) {
    console.error('❌ Error initializing email alert settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  initializeEmailAlertSettings()
    .then(() => {
      console.log('\n✅ Email alert settings initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to initialize email alert settings:', error);
      process.exit(1);
    });
}

module.exports = { initializeEmailAlertSettings };
