import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailAlertSetting {
  id: string;
  alertType: string;
  alertName: string;
  description: string | null;
  isEnabled: boolean;
  enabledForPlayers: boolean;
  enabledForAdmins: boolean;
  enabledForTeamOwners: boolean;
  testingMode: boolean;
  lastModifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailCheckResult {
  shouldSend: boolean;
  testingMode: boolean;
  enabledRecipients: {
    players: boolean;
    admins: boolean;
    teamOwners: boolean;
  };
  reason?: string;
}

/**
 * Check if an email alert should be sent based on current settings
 * @param alertType - The type of alert to check (e.g., 'player_registration', 'team_approval', etc.)
 * @param recipientType - The type of recipient ('players', 'admins', 'teamOwners')
 * @returns EmailCheckResult object with sending decision and settings
 */
export async function checkEmailAlertSettings(
  alertType: string, 
  recipientType: 'players' | 'admins' | 'teamOwners'
): Promise<EmailCheckResult> {
  try {
    // Get the alert setting from database
    const alertSetting = await prisma.emailAlertSettings.findUnique({
      where: { alertType }
    });

    // If no setting found, default to enabled (backward compatibility)
    if (!alertSetting) {
      console.warn(`No email alert setting found for type: ${alertType}. Defaulting to enabled.`);
      return {
        shouldSend: true,
        testingMode: false,
        enabledRecipients: {
          players: true,
          admins: true,
          teamOwners: true
        }
      };
    }

    // Check if the alert type is enabled globally
    if (!alertSetting.isEnabled) {
      return {
        shouldSend: false,
        testingMode: alertSetting.testingMode,
        enabledRecipients: {
          players: alertSetting.enabledForPlayers,
          admins: alertSetting.enabledForAdmins,
          teamOwners: alertSetting.enabledForTeamOwners
        },
        reason: `Alert type '${alertSetting.alertName}' is globally disabled`
      };
    }

    // Check if the specific recipient type is enabled
    let recipientEnabled = false;
    switch (recipientType) {
      case 'players':
        recipientEnabled = alertSetting.enabledForPlayers;
        break;
      case 'admins':
        recipientEnabled = alertSetting.enabledForAdmins;
        break;
      case 'teamOwners':
        recipientEnabled = alertSetting.enabledForTeamOwners;
        break;
    }

    if (!recipientEnabled) {
      return {
        shouldSend: false,
        testingMode: alertSetting.testingMode,
        enabledRecipients: {
          players: alertSetting.enabledForPlayers,
          admins: alertSetting.enabledForAdmins,
          teamOwners: alertSetting.enabledForTeamOwners
        },
        reason: `Alert type '${alertSetting.alertName}' is disabled for ${recipientType}`
      };
    }

    // If in testing mode, log but don't send
    if (alertSetting.testingMode) {
      console.log(`[TESTING MODE] Would send ${alertType} email to ${recipientType}`);
      return {
        shouldSend: false,
        testingMode: true,
        enabledRecipients: {
          players: alertSetting.enabledForPlayers,
          admins: alertSetting.enabledForAdmins,
          teamOwners: alertSetting.enabledForTeamOwners
        },
        reason: `Testing mode is enabled for '${alertSetting.alertName}'`
      };
    }

    // All checks passed - should send email
    return {
      shouldSend: true,
      testingMode: false,
      enabledRecipients: {
        players: alertSetting.enabledForPlayers,
        admins: alertSetting.enabledForAdmins,
        teamOwners: alertSetting.enabledForTeamOwners
      }
    };

  } catch (error) {
    console.error('Error checking email alert settings:', error);
    
    // On error, default to sending (fail-safe approach)
    // But log the error for debugging
    console.error(`Failed to check email alert settings for ${alertType}. Defaulting to enabled.`);
    
    return {
      shouldSend: true,
      testingMode: false,
      enabledRecipients: {
        players: true,
        admins: true,
        teamOwners: true
      },
      reason: 'Error occurred while checking settings, defaulting to enabled'
    };
  }
}

/**
 * Convenience function to check multiple recipient types at once
 * @param alertType - The type of alert to check
 * @returns Object with checks for all recipient types
 */
export async function checkAllEmailAlertSettings(alertType: string) {
  const [playersCheck, adminsCheck, teamOwnersCheck] = await Promise.all([
    checkEmailAlertSettings(alertType, 'players'),
    checkEmailAlertSettings(alertType, 'admins'),
    checkEmailAlertSettings(alertType, 'teamOwners')
  ]);

  return {
    players: playersCheck,
    admins: adminsCheck,
    teamOwners: teamOwnersCheck,
    anyEnabled: playersCheck.shouldSend || adminsCheck.shouldSend || teamOwnersCheck.shouldSend
  };
}

/**
 * Log email activity for testing purposes
 * @param alertType - The type of alert
 * @param recipientType - The recipient type
 * @param recipients - Array of email addresses
 * @param subject - Email subject
 * @param sent - Whether email was actually sent
 */
export async function logEmailActivity(
  alertType: string,
  recipientType: string,
  recipients: string[],
  subject: string,
  sent: boolean = true
): Promise<void> {
  try {
    const logEntry = {
      alertType,
      recipientType,
      recipients: recipients.join(', '),
      subject,
      sent,
      timestamp: new Date().toISOString()
    };

    // Log to console for now - could be extended to database logging
    console.log('📧 Email Activity Log:', logEntry);

    // Could also write to a log file or database table if needed
    
  } catch (error) {
    console.error('Error logging email activity:', error);
  }
}

/**
 * Get all email alert settings for admin interface
 * @returns Array of all email alert settings
 */
export async function getAllEmailAlertSettings(): Promise<EmailAlertSetting[]> {
  try {
    const settings = await prisma.emailAlertSettings.findMany({
      orderBy: { alertName: 'asc' }
    });
    return settings;
  } catch (error) {
    console.error('Error fetching email alert settings:', error);
    return [];
  }
}

/**
 * Initialize default email alert settings if none exist
 * @param adminId - ID of the admin creating the settings
 */
export async function initializeDefaultEmailAlertSettings(adminId: string): Promise<void> {
  try {
    const existingCount = await prisma.emailAlertSettings.count();
    
    if (existingCount > 0) {
      console.log('Email alert settings already exist, skipping initialization');
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
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
        lastModifiedBy: adminId
      }
    ];

    // Create all default settings
    for (const setting of defaultSettings) {
      await prisma.emailAlertSettings.create({
        data: setting
      });
    }

    console.log(`✅ Initialized ${defaultSettings.length} default email alert settings`);

  } catch (error) {
    console.error('Error initializing default email alert settings:', error);
    throw error;
  }
}
