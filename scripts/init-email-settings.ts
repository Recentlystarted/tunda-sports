import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeEmailAlertSettings() {
  console.log('🔧 Initializing Email Alert Settings...');

  const emailAlertSettings = [
    // Player Registration Alerts
    {
      alertType: 'player_registration',
      alertName: 'Player Registration',
      description: 'Sent when a player registers for a tournament',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'player_approval',
      alertName: 'Player Approval',
      description: 'Sent when a player registration is approved',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'player_rejection',
      alertName: 'Player Rejection',
      description: 'Sent when a player registration is rejected',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },

    // Team Registration Alerts  
    {
      alertType: 'team_registration',
      alertName: 'Team Registration',
      description: 'Sent when a team registers for a tournament',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'team_approval',
      alertName: 'Team Approval',
      description: 'Sent when a team registration is approved',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'team_rejection',
      alertName: 'Team Rejection',
      description: 'Sent when a team registration is rejected',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },

    // Team Owner Alerts (for auction tournaments)
    {
      alertType: 'team_owner_registration',
      alertName: 'Team Owner Registration',
      description: 'Sent when a team owner registers for auction tournament',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },
    {
      alertType: 'team_owner_approval',
      alertName: 'Team Owner Approval',
      description: 'Sent when a team owner is approved for auction with access link',
      isEnabled: true,
      enabledForPlayers: false,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },
    {
      alertType: 'team_owner_rejection',
      alertName: 'Team Owner Rejection',
      description: 'Sent when a team owner registration is rejected',
      isEnabled: true,
      enabledForPlayers: false,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },

    // Auction Alerts
    {
      alertType: 'auction_player_sold',
      alertName: 'Player Sold in Auction',
      description: 'Sent when a player is sold in auction',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },
    {
      alertType: 'auction_player_unsold',
      alertName: 'Player Unsold in Auction',
      description: 'Sent when a player goes unsold in auction',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'auction_team_complete',
      alertName: 'Team Roster Complete',
      description: 'Sent when a team completes their roster in auction',
      isEnabled: true,
      enabledForPlayers: false,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },

    // System Notifications
    {
      alertType: 'system_alert',
      alertName: 'System Alert',
      description: 'Critical system notifications and alerts',
      isEnabled: true,
      enabledForPlayers: false,
      enabledForAdmins: true,
      enabledForTeamOwners: false,
      testingMode: false
    },
    {
      alertType: 'general_notification',
      alertName: 'General Notification',
      description: 'General announcements and updates',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },

    // Tournament Updates
    {
      alertType: 'tournament_announcement',
      alertName: 'Tournament Announcement',
      description: 'Tournament-related announcements',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },
    {
      alertType: 'match_result',
      alertName: 'Match Result',
      description: 'Match result notifications',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },

    // Payment Notifications  
    {
      alertType: 'payment_received',
      alertName: 'Payment Received',
      description: 'Payment confirmation notifications',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    },
    {
      alertType: 'payment_reminder',
      alertName: 'Payment Reminder',
      description: 'Payment reminder notifications',
      isEnabled: true,
      enabledForPlayers: true,
      enabledForAdmins: true,
      enabledForTeamOwners: true,
      testingMode: false
    }
  ];

  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const setting of emailAlertSettings) {
      const existing = await prisma.emailAlertSettings.findUnique({
        where: { alertType: setting.alertType }
      });

      if (existing) {
        // Update existing setting if needed
        await prisma.emailAlertSettings.update({
          where: { alertType: setting.alertType },
          data: {
            alertName: setting.alertName,
            description: setting.description,
            // Keep existing enabled/testing settings to preserve user choices
            updatedAt: new Date()
          }
        });
        updatedCount++;
        console.log(`✅ Updated: ${setting.alertName}`);
      } else {
        // Create new setting
        await prisma.emailAlertSettings.create({
          data: setting
        });
        createdCount++;
        console.log(`🆕 Created: ${setting.alertName}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${createdCount} new settings`);
    console.log(`   Updated: ${updatedCount} existing settings`);
    console.log(`   Total: ${emailAlertSettings.length} email alert types`);

    // Display current settings
    console.log('\n📧 Current Email Alert Settings:');
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

    console.log('\n✅ Email alert settings initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize email alert settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeEmailAlertSettings()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
