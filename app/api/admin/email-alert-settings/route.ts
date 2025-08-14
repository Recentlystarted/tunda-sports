import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAdminSession } from '@/lib/auth';

const prisma = new PrismaClient();

// Default email alert settings
const defaultEmailAlerts = [
  {
    alertType: 'player_registration',
    alertName: 'Player Registration',
    description: 'Triggered when a new player registers for a tournament',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: true,
    enabledForTeamOwners: false
  },
  {
    alertType: 'team_registration',
    alertName: 'Team Registration',
    description: 'Triggered when a new team registers for a tournament',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: true,
    enabledForTeamOwners: false
  },
  {
    alertType: 'player_approval',
    alertName: 'Player Approval',
    description: 'Triggered when a player registration is approved',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: false
  },
  {
    alertType: 'player_rejection',
    alertName: 'Player Rejection',
    description: 'Triggered when a player registration is rejected',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: false
  },
  {
    alertType: 'team_approval',
    alertName: 'Team Approval',
    description: 'Triggered when a team registration is approved',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: false
  },
  {
    alertType: 'team_rejection',
    alertName: 'Team Rejection',
    description: 'Triggered when a team registration is rejected',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: false
  },
  {
    alertType: 'team_owner_registration',
    alertName: 'Team Owner Registration',
    description: 'Triggered when a team owner registers for auction tournament',
    isEnabled: true,
    enabledForPlayers: false,
    enabledForAdmins: true,
    enabledForTeamOwners: true
  },
  {
    alertType: 'team_owner_approval',
    alertName: 'Team Owner Approval',
    description: 'Triggered when a team owner registration is approved',
    isEnabled: true,
    enabledForPlayers: false,
    enabledForAdmins: false,
    enabledForTeamOwners: true
  },
  {
    alertType: 'team_owner_rejection',
    alertName: 'Team Owner Rejection',
    description: 'Triggered when a team owner registration is rejected',
    isEnabled: true,
    enabledForPlayers: false,
    enabledForAdmins: false,
    enabledForTeamOwners: true
  },
  {
    alertType: 'auction_player_sold',
    alertName: 'Auction - Player Sold',
    description: 'Triggered when a player is sold in auction',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: true
  },
  {
    alertType: 'auction_player_unsold',
    alertName: 'Auction - Player Unsold',
    description: 'Triggered when a player goes unsold in auction',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: false
  },
  {
    alertType: 'payment_received',
    alertName: 'Payment Received',
    description: 'Triggered when team/player payment is received',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: true,
    enabledForTeamOwners: true
  },
  {
    alertType: 'payment_pending',
    alertName: 'Payment Pending Reminder',
    description: 'Triggered to remind about pending payments',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: true,
    enabledForTeamOwners: true
  },
  {
    alertType: 'tournament_reminder',
    alertName: 'Tournament Reminder',
    description: 'Triggered to send tournament reminders',
    isEnabled: true,
    enabledForPlayers: true,
    enabledForAdmins: false,
    enabledForTeamOwners: true
  },
  {
    alertType: 'system_alert',
    alertName: 'System Alerts',
    description: 'Important system notifications and announcements',
    isEnabled: true,
    enabledForPlayers: false,
    enabledForAdmins: true,
    enabledForTeamOwners: false
  }
];

// GET - Fetch all email alert settings
export async function GET(request: NextRequest) {
  try {
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can access email alert settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    // Get all alert settings
    let alertSettings = await prisma.emailAlertSettings.findMany({
      orderBy: { alertName: 'asc' }
    });

    // If no settings exist, create default ones
    if (alertSettings.length === 0) {
      console.log('No email alert settings found, creating defaults...');
      
      for (const alert of defaultEmailAlerts) {
        await prisma.emailAlertSettings.create({
          data: {
            ...alert,
            lastModifiedBy: sessionValidation.admin!.id
          }
        });
      }

      // Fetch the newly created settings
      alertSettings = await prisma.emailAlertSettings.findMany({
        orderBy: { alertName: 'asc' }
      });
    }

    return NextResponse.json({
      success: true,
      alertSettings
    });

  } catch (error) {
    console.error('Error fetching email alert settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email alert settings' },
      { status: 500 }
    );
  }
}

// PUT - Update email alert settings
export async function PUT(request: NextRequest) {
  try {
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can modify email alert settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alertType, updates } = body;

    if (!alertType || !updates) {
      return NextResponse.json(
        { error: 'Alert type and updates are required' },
        { status: 400 }
      );
    }

    // Update the alert setting
    const updatedSetting = await prisma.emailAlertSettings.update({
      where: { alertType },
      data: {
        ...updates,
        lastModifiedBy: sessionValidation.admin!.id,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      alertSetting: updatedSetting,
      message: `Alert setting for "${updatedSetting.alertName}" updated successfully`
    });

  } catch (error) {
    console.error('Error updating email alert setting:', error);
    return NextResponse.json(
      { error: 'Failed to update email alert setting' },
      { status: 500 }
    );
  }
}

// POST - Bulk update alert settings
export async function POST(request: NextRequest) {
  try {
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can perform bulk operations
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, alertTypes } = body;

    if (action === 'bulk_enable' || action === 'bulk_disable') {
      const isEnabled = action === 'bulk_enable';
      
      if (!alertTypes || !Array.isArray(alertTypes)) {
        return NextResponse.json(
          { error: 'Alert types array is required for bulk operations' },
          { status: 400 }
        );
      }

      // Update multiple alert settings
      await prisma.emailAlertSettings.updateMany({
        where: {
          alertType: { in: alertTypes }
        },
        data: {
          isEnabled,
          lastModifiedBy: sessionValidation.admin!.id,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `${alertTypes.length} alert settings ${isEnabled ? 'enabled' : 'disabled'} successfully`
      });
    }

    if (action === 'enable_testing_mode' || action === 'disable_testing_mode') {
      const testingMode = action === 'enable_testing_mode';
      
      // Update all settings to testing mode
      await prisma.emailAlertSettings.updateMany({
        data: {
          testingMode,
          lastModifiedBy: sessionValidation.admin!.id,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Testing mode ${testingMode ? 'enabled' : 'disabled'} for all email alerts`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in bulk email alert operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
