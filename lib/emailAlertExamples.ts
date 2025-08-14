// Example of how to use the Email Alert Management System
// This file shows how to integrate email alert checking into your existing registration functions

import { sendEmail } from '@/lib/emailService';
import { checkEmailAlertSettings, logEmailActivity } from '@/lib/emailAlertManager';

// Example: Player Registration with Email Alert Checking
export async function handlePlayerRegistrationWithAlerts(playerData: any, tournamentData: any) {
  try {
    // Your existing registration logic here
    console.log('Processing player registration...');
    
    // Check email alert settings before sending confirmation email to player
    const playerAlertCheck = await checkEmailAlertSettings('player_registration', 'players');
    
    if (playerAlertCheck.shouldSend) {
      // Send confirmation email to player
      await sendEmail({
        to: playerData.email,
        subject: `Registration Confirmation - ${tournamentData.name}`,
        html: `Your registration has been received...`,
        alertType: 'player_registration',
        notificationType: 'player-confirmation'
      });
      console.log('✅ Player confirmation email sent');
    } else {
      console.log(`🚫 Player confirmation email not sent: ${playerAlertCheck.reason}`);
    }

    // Check email alert settings before sending admin notification
    const adminAlertCheck = await checkEmailAlertSettings('player_registration', 'admins');
    
    if (adminAlertCheck.shouldSend) {
      // Send notification to admins
      await sendEmail({
        to: ['admin@tundasportsclub.com'],
        subject: `New Player Registration - ${playerData.name}`,
        html: `New player ${playerData.name} registered for ${tournamentData.name}`,
        alertType: 'player_registration',
        notificationType: 'admin-notification'
      });
      console.log('✅ Admin notification email sent');
    } else {
      console.log(`🚫 Admin notification email not sent: ${adminAlertCheck.reason}`);
    }

    return { success: true, message: 'Player registered successfully' };

  } catch (error) {
    console.error('Error in player registration:', error);
    return { success: false, message: 'Registration failed' };
  }
}

// Example: Team Approval with Email Alert Checking
export async function handleTeamApprovalWithAlerts(teamId: string, adminId: string) {
  try {
    // Your existing approval logic here
    console.log('Processing team approval...');
    
    // Get team and tournament data
    const teamData = {
      captainEmail: 'captain@example.com',
      captainName: 'John Doe',
      teamName: 'Team Alpha'
    };
    const tournamentData = { name: 'Cricket Championship 2025' };

    // Check email alert settings before sending approval email
    const approvalAlertCheck = await checkEmailAlertSettings('team_approval', 'players');
    
    if (approvalAlertCheck.shouldSend) {
      // Send approval email to team captain
      await sendEmail({
        to: teamData.captainEmail,
        subject: `Team Approved - ${tournamentData.name}`,
        html: `Congratulations! Your team ${teamData.teamName} has been approved...`,
        alertType: 'team_approval',
        notificationType: 'team-approval'
      });
      console.log('✅ Team approval email sent');
    } else {
      console.log(`🚫 Team approval email not sent: ${approvalAlertCheck.reason}`);
    }

    return { success: true, message: 'Team approved successfully' };

  } catch (error) {
    console.error('Error in team approval:', error);
    return { success: false, message: 'Approval failed' };
  }
}

// Example: Auction Player Sold with Email Alert Checking
export async function handleAuctionPlayerSoldWithAlerts(playerData: any, teamOwnerData: any, tournamentData: any, soldPrice: number) {
  try {
    console.log('Processing auction player sold...');

    // Check if player notification is enabled
    const playerAlertCheck = await checkEmailAlertSettings('auction_player_sold', 'players');
    
    if (playerAlertCheck.shouldSend) {
      await sendEmail({
        to: playerData.email,
        subject: `🎉 Congratulations! You've been selected - ${tournamentData.name}`,
        html: `Great news! You've been purchased by ${teamOwnerData.teamName} for ₹${soldPrice}...`,
        alertType: 'auction_player_sold',
        notificationType: 'player-sold'
      });
      console.log('✅ Player sold notification sent');
    } else {
      console.log(`🚫 Player sold notification not sent: ${playerAlertCheck.reason}`);
    }

    // Check if team owner notification is enabled
    const ownerAlertCheck = await checkEmailAlertSettings('auction_player_sold', 'teamOwners');
    
    if (ownerAlertCheck.shouldSend) {
      await sendEmail({
        to: teamOwnerData.ownerEmail,
        subject: `Player Acquired - ${playerData.name}`,
        html: `You have successfully acquired ${playerData.name} for ₹${soldPrice}...`,
        alertType: 'auction_player_sold',
        notificationType: 'team-owner-update'
      });
      console.log('✅ Team owner notification sent');
    } else {
      console.log(`🚫 Team owner notification not sent: ${ownerAlertCheck.reason}`);
    }

    return { success: true, message: 'Player sold notifications processed' };

  } catch (error) {
    console.error('Error in auction player sold notifications:', error);
    return { success: false, message: 'Notification failed' };
  }
}

// Example: Payment Received with Email Alert Checking
export async function handlePaymentReceivedWithAlerts(paymentData: any, teamData: any, tournamentData: any) {
  try {
    console.log('Processing payment received notification...');

    // Check if payment notifications are enabled for players
    const paymentAlertCheck = await checkEmailAlertSettings('payment_received', 'players');
    
    if (paymentAlertCheck.shouldSend) {
      await sendEmail({
        to: teamData.captainEmail,
        subject: `Payment Received - ${tournamentData.name}`,
        html: `Your payment of ₹${paymentData.amount} has been received and confirmed...`,
        alertType: 'payment_received',
        notificationType: 'payment-confirmation'
      });
      console.log('✅ Payment confirmation sent to team');
    } else {
      console.log(`🚫 Payment confirmation not sent: ${paymentAlertCheck.reason}`);
    }

    // Check if admin notification is enabled
    const adminAlertCheck = await checkEmailAlertSettings('payment_received', 'admins');
    
    if (adminAlertCheck.shouldSend) {
      await sendEmail({
        to: ['admin@tundasportsclub.com'],
        subject: `Payment Received - ${teamData.teamName}`,
        html: `Payment of ₹${paymentData.amount} received from ${teamData.teamName}...`,
        alertType: 'payment_received',
        notificationType: 'admin-payment-notification'
      });
      console.log('✅ Payment notification sent to admin');
    } else {
      console.log(`🚫 Admin payment notification not sent: ${adminAlertCheck.reason}`);
    }

    return { success: true, message: 'Payment notifications processed' };

  } catch (error) {
    console.error('Error in payment notification:', error);
    return { success: false, message: 'Payment notification failed' };
  }
}

// Example: Testing Mode Usage
export async function testEmailAlertSystem() {
  console.log('🧪 Testing Email Alert System...');

  // This will respect the testing mode settings
  // If testing mode is enabled, emails will be logged but not sent
  await sendEmail({
    to: 'test@example.com',
    subject: 'Test Email Alert',
    html: 'This is a test email for the alert system',
    alertType: 'system_alert',
    notificationType: 'system-test'
  });

  // You can also check settings programmatically
  const testCheck = await checkEmailAlertSettings('system_alert', 'admins');
  console.log('System alert settings:', testCheck);

  // For critical emails that should always be sent (like password resets), use skipAlertCheck
  await sendEmail({
    to: 'admin@tundasportsclub.com',
    subject: 'Critical System Alert',
    html: 'This critical email bypasses alert settings',
    skipAlertCheck: true // This will always send regardless of settings
  });
}

// Usage in your existing API routes:
/*
// In /api/tournaments/[id]/register route:
export async function POST(request: NextRequest) {
  try {
    const { playerData, tournamentData } = await request.json();
    
    // Your existing registration logic...
    
    // Use the new alert-aware registration function
    const result = await handlePlayerRegistrationWithAlerts(playerData, tournamentData);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// In admin approval routes:
export async function PUT(request: NextRequest) {
  try {
    const { teamId, action, adminId } = await request.json();
    
    if (action === 'approve') {
      const result = await handleTeamApprovalWithAlerts(teamId, adminId);
      return NextResponse.json(result);
    }
    
    // ... other logic
  } catch (error) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
*/
