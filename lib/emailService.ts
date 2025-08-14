import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { playerRegistrationTemplates, teamOwnerTemplates } from './emailTemplates';
import { checkEmailAlertSettings, logEmailActivity } from './emailAlertManager';
import { PrismaClient } from '@prisma/client';

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

const SMTP_SETTINGS_FILE = join(process.cwd(), 'temp', 'smtp-settings.json');
const RECIPIENTS_FILE = join(process.cwd(), 'temp', 'email-recipients.json');

// Read SMTP settings from database first, then fallback to file
const getSMTPSettings = async (): Promise<SMTPSettings | null> => {
  try {
    // First, try to get settings from database
    const prisma = new PrismaClient();
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });
    
    if (emailConfig && emailConfig.smtpHost && emailConfig.smtpUser && emailConfig.smtpPassword) {
      await prisma.$disconnect();
      return {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort || 587,
        secure: emailConfig.smtpSecure || false,
        username: emailConfig.smtpUser,
        password: emailConfig.smtpPassword,
        fromEmail: emailConfig.fromEmail || emailConfig.smtpUser,
        fromName: emailConfig.fromName || 'Tunda Sports Club',
        enabled: true
      };
    }
    
    await prisma.$disconnect();
    
    // Fallback to JSON file
    if (!existsSync(SMTP_SETTINGS_FILE)) {
      return null;
    }
    
    const data = readFileSync(SMTP_SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    
    // Only return settings if enabled and has required fields
    if (settings.enabled && settings.host && settings.username && settings.password && settings.password !== '••••••••') {
      return settings;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading SMTP settings:', error);
    return null;
  }
};

// Get admin recipients from file
const getAdminRecipients = () => {
  try {
    if (!existsSync(RECIPIENTS_FILE)) {
      return ['admin@tundasportsclub.com']; // Default fallback
    }
    
    const data = readFileSync(RECIPIENTS_FILE, 'utf-8');
    const recipients = JSON.parse(data);
    return recipients.map((r: any) => r.email).filter(Boolean);
  } catch (error) {
    console.error('Error reading recipients:', error);
    return ['admin@tundasportsclub.com'];
  }
};

// Email service configuration
const createTransporter = async () => {
  const smtpSettings = await getSMTPSettings();
  
  if (!smtpSettings) {
    // Development email transporter - logs emails to console
    console.warn('SMTP not configured, using console transport');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Production email transporter using configured SMTP settings
  return nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.secure,
    auth: {
      user: smtpSettings.username,
      pass: smtpSettings.password,
    },
  });
};

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  notificationType?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  notificationType?: string;
  alertType?: string; // For email alert management
  skipAlertCheck?: boolean; // To bypass alert checking for critical emails
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Check email alert settings if alertType is provided
    if (options.alertType && !options.skipAlertCheck) {
      const recipientType = options.notificationType?.includes('admin') ? 'admins' : 'players';
      const alertCheck = await checkEmailAlertSettings(options.alertType, recipientType);
      
      if (!alertCheck.shouldSend) {
        console.log(`📧 Email not sent: ${alertCheck.reason}`);
        
        // Log the activity for tracking
        const recipients = Array.isArray(options.to) ? options.to : [options.to];
        await logEmailActivity(
          options.alertType,
          recipientType,
          recipients,
          options.subject,
          false
        );
        
        return false;
      }

      // If in testing mode, log but don't send
      if (alertCheck.testingMode) {
        console.log(`🧪 [TESTING MODE] Would send email: ${options.subject}`);
        const recipients = Array.isArray(options.to) ? options.to : [options.to];
        await logEmailActivity(
          options.alertType,
          `${recipientType} (TESTING)`,
          recipients,
          options.subject,
          false
        );
        return true; // Return true for testing mode to maintain flow
      }
    }

    const transporter = await createTransporter();
    const smtpSettings = await getSMTPSettings();
    
    const fromEmail = smtpSettings?.fromEmail || 'info@tundasportsclub.com';
    const fromName = smtpSettings?.fromName || 'Tunda Sports Club';
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Log successful email activity
    if (options.alertType) {
      const recipientType = options.notificationType?.includes('admin') ? 'admins' : 'players';
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      await logEmailActivity(
        options.alertType,
        recipientType,
        recipients,
        options.subject,
        true
      );
    }
    
    console.log('Email sent successfully:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    if (!smtpSettings) {
      console.log('(Using console transport - SMTP not configured)');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Send team registration confirmation email
export const sendTeamRegistrationEmail = async (
  captainEmail: string,
  captainName: string,
  teamName: string,
  tournamentName: string
): Promise<boolean> => {
  // Use professional template directly
  const fallbackSubject = `Team Registration Confirmation - ${tournamentName}`;
  const fallbackHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Tunda Sports Club</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Team Registration Confirmation</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin: 0 0 15px 0;">Registration Submitted Successfully!</h2>
        <p style="margin: 0; color: #374151;">
          Dear ${captainName},<br><br>
          Your team registration has been successfully submitted for the tournament <strong>${tournamentName}</strong>.
        </p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">Registration Details:</h3>
        <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
          <li><strong>Team Name:</strong> ${teamName}</li>
          <li><strong>Captain:</strong> ${captainName}</li>
          <li><strong>Captain Email:</strong> ${captainEmail}</li>
          <li><strong>Tournament:</strong> ${tournamentName}</li>
          <li><strong>Status:</strong> Pending Review</li>
        </ul>
      </div>
      
      <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
        <p style="margin: 0; color: #1e40af;">
          <strong>What's Next?</strong><br>
          Our team will review your registration and contact you within 2-3 business days with confirmation and further instructions.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          This is an automated message from Tunda Sports Club.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: captainEmail,
    subject: fallbackSubject,
    html: fallbackHtml,
    notificationType: 'registration',
    alertType: 'team_registration'
  });
};

// Send admin notification for new registration
export const sendAdminRegistrationNotification = async (
  captainName: string,
  teamName: string,
  tournamentName: string,
  registrationId?: string
): Promise<boolean> => {
  const adminEmails = getAdminRecipients();
  
  let success = true;
  for (const adminEmail of adminEmails) {
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Team Registration Alert</p>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">New Registration Received</h2>
          <p style="margin: 0; color: #374151;">
            A new team registration has been submitted and requires your review.
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">Registration Details:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li><strong>Team Name:</strong> ${teamName}</li>
            <li><strong>Captain:</strong> ${captainName}</li>
            <li><strong>Tournament:</strong> ${tournamentName}</li>
            ${registrationId ? `<li><strong>Registration ID:</strong> ${registrationId}</li>` : ''}
            <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Status:</strong> Pending Review</li>
          </ul>
        </div>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>Action Required:</strong><br>
            Please review this registration in the admin panel and approve or reject as appropriate.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated notification from Tunda Sports Club.<br>
            Please log in to the admin panel to take action.
          </p>
        </div>
      </div>
    `;
    
    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `New Team Registration - ${teamName} for ${tournamentName}`,
      html: adminNotificationHtml,
      notificationType: 'admin-notification',
      alertType: 'team_registration'
    });
    
    if (!emailSent) success = false;
  }

  return success;
};

// Send team approval notification
export const sendTeamApprovalEmail = async (
  captainEmail: string,
  captainName: string,
  teamName: string,
  tournamentName: string
): Promise<boolean> => {
  // Use professional template directly
  const approvalSubject = `Team Registration Approved - ${tournamentName}`;
  const approvalHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Tunda Sports Club</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Team Registration Approved</p>
      </div>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <h2 style="color: #047857; margin: 0 0 15px 0;">Congratulations! Your Team is Approved</h2>
        <p style="margin: 0; color: #374151;">
          Dear ${captainName},<br><br>
          We're excited to inform you that your team <strong>${teamName}</strong> has been approved for the tournament <strong>${tournamentName}</strong>.
        </p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">Approved Registration:</h3>
        <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
          <li><strong>Team Name:</strong> ${teamName}</li>
          <li><strong>Captain:</strong> ${captainName}</li>
          <li><strong>Tournament:</strong> ${tournamentName}</li>
          <li><strong>Status:</strong> ✅ Approved</li>
        </ul>
      </div>
      
      <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
        <p style="margin: 0; color: #1e40af;">
          <strong>What's Next?</strong><br>
          You will receive further communications regarding tournament schedule, venue details, and any additional requirements closer to the event date.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          Good luck with your preparation! We look forward to seeing your team in action.<br>
          - Tunda Sports Club Team
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: captainEmail,
    subject: approvalSubject,
    html: approvalHtml,
    notificationType: 'approval',
    alertType: 'team_approval'
  });
};

// Send team rejection email using template system
export const sendTeamRejectionEmail = async (
  recipientEmail: string,
  captainName: string,
  teamName: string,
  tournamentName: string,
  rejectionReason?: string
): Promise<boolean> => {
  try {
    // Use professional template directly
    const fallbackSubject = `Registration Update - ${tournamentName}`;
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Registration Update</p>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">Registration Not Approved</h2>
          <p style="margin: 0; color: #374151;">
            Dear ${captainName},<br><br>
            We regret to inform you that your team <strong>${teamName}</strong> registration for <strong>${tournamentName}</strong> has not been approved.
          </p>
        </div>
        
        ${rejectionReason ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">Reason:</h3>
          <p style="color: #6b7280; background: #f9fafb; padding: 15px; border-radius: 6px; margin: 0;">
            ${rejectionReason}
          </p>
        </div>
        ` : ''}
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Next Steps:</strong><br>
            If you have any questions about this decision, please contact us for more information.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated message from Tunda Sports Club.<br>
            Please contact us if you have any questions.
          </p>
        </div>
      </div>
    `;
    
    return await sendEmail({
      to: recipientEmail,
      subject: fallbackSubject,
      html: fallbackHtml,
      alertType: 'team_rejection'
    });
    
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return false;
  }
};

// Send player registration email using professional template
export const sendPlayerRegistrationEmail = async (
  playerData: any,
  tournamentData: any
): Promise<boolean> => {
  try {
    const template = playerRegistrationTemplates.playerRegistered(playerData, tournamentData);
    
    return await sendEmail({
      to: playerData.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      notificationType: 'player-registration',
      alertType: 'player_registration'
    });
  } catch (error) {
    console.error('Failed to send player registration email:', error);
    return false;
  }
};

// Send team owner registration email using professional template  
export const sendTeamOwnerRegistrationEmail = async (
  ownerData: any,
  tournamentData: any
): Promise<boolean> => {
  try {
    const template = teamOwnerTemplates.ownerRegistered(ownerData, tournamentData);
    
    return await sendEmail({
      to: ownerData.ownerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      notificationType: 'owner-registration',
      alertType: 'team_owner_registration'
    });
  } catch (error) {
    console.error('Failed to send team owner registration email:', error);
    return false;
  }
};

// Send team owner approval email with auction link
export const sendTeamOwnerApprovalWithAuctionLink = async (
  ownerData: any,
  tournamentData: any,
  auctionToken: string
): Promise<boolean> => {
  try {
    const template = teamOwnerTemplates.ownerVerifiedWithAuctionLink(
      { ...ownerData, auctionToken },
      tournamentData
    );
    
    return await sendEmail({
      to: ownerData.ownerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      notificationType: 'owner-approval',
      alertType: 'team_owner_approval'
    });
  } catch (error) {
    console.error('Failed to send team owner approval email:', error);
    return false;
  }
};
export const sendTeamRegistrationEmails = async (registration: any, tournament: any) => {
  try {
    // Send confirmation email to team captain
    const captainEmail = registration.team.captainEmail;
    const teamName = registration.team.name;
    
    const playerConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Team Registration Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Registration Details</h3>
          <p><strong>Team Name:</strong> ${teamName}</p>
          <p><strong>Captain:</strong> ${registration.team.captainName}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Venue:</strong> ${tournament.venue}</p>
          <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString()}</p>
          <p><strong>Entry Fee:</strong> ₹${tournament.entryFee}</p>
          <p><strong>Registration Status:</strong> ${registration.status}</p>
        </div>
        <p>Your team registration has been submitted successfully. You will receive further updates about approval and payment instructions.</p>
        <p>Please keep this email for your records.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated message from Tunda Sports Club.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: captainEmail,
      subject: `Team Registration Received - ${tournament.name}`,
      html: playerConfirmationHtml
    });

    // Send notification to admins
    const adminEmails = getAdminRecipients();
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Team Registration</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">New Team Registration</h3>
          <p><strong>Team Name:</strong> ${teamName}</p>
          <p><strong>Captain:</strong> ${registration.team.captainName}</p>
          <p><strong>Phone:</strong> ${registration.team.captainPhone}</p>
          <p><strong>Email:</strong> ${registration.team.captainEmail}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Registration ID:</strong> ${registration.id}</p>
        </div>
        <p>Please review and approve/reject this registration through the admin panel.</p>
      </div>
    `;

    for (const adminEmail of adminEmails) {
      await sendEmail({
        to: adminEmail,
        subject: `New Team Registration - ${teamName}`,
        html: adminNotificationHtml
      });
    }
  } catch (error) {
    console.error('Error sending team registration emails:', error);
    throw error;
  }
};

export const sendPlayerRegistrationEmails = async (registration: any, tournament: any) => {
  try {
    // Send confirmation email to player
    const playerEmail = registration.email;
    const playerName = registration.name;
    
    const playerConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Player Registration Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Registration Details</h3>
          <p><strong>Player Name:</strong> ${playerName}</p>
          <p><strong>Position:</strong> ${registration.position}</p>
          <p><strong>Experience:</strong> ${registration.experience}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Venue:</strong> ${tournament.venue}</p>
          <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString()}</p>
          <p><strong>Entry Fee:</strong> ₹${tournament.playerEntryFee}</p>
          <p><strong>Registration Status:</strong> Available for Auction</p>
        </div>
        <p>Your player registration has been submitted successfully. You are now in the player pool for the auction.</p>
        <p>Please keep this email for your records.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated message from Tunda Sports Club.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: playerEmail,
      subject: `Player Registration Received - ${tournament.name}`,
      html: playerConfirmationHtml
    });

    // Send notification to admins
    const adminEmails = getAdminRecipients();
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Player Registration</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">New Player Registration</h3>
          <p><strong>Player Name:</strong> ${playerName}</p>
          <p><strong>Phone:</strong> ${registration.phone}</p>
          <p><strong>Email:</strong> ${registration.email}</p>
          <p><strong>Position:</strong> ${registration.position}</p>
          <p><strong>Experience:</strong> ${registration.experience}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Registration ID:</strong> ${registration.id}</p>
        </div>
        <p>New player added to the auction pool.</p>
      </div>
    `;

    for (const adminEmail of adminEmails) {
      await sendEmail({
        to: adminEmail,
        subject: `New Player Registration - ${playerName}`,
        html: adminNotificationHtml
      });
    }
  } catch (error) {
    console.error('Error sending player registration emails:', error);
    throw error;
  }
};

export const sendTeamOwnerRegistrationEmails = async (registration: any, tournament: any) => {
  try {
    // Send confirmation email to team owner
    const ownerEmail = registration.ownerEmail;
    const ownerName = registration.ownerName;
    
    const ownerConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Team Owner Registration Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Registration Details</h3>
          <p><strong>Owner Name:</strong> ${ownerName}</p>
          <p><strong>Team Name:</strong> ${registration.teamName}</p>
          <p><strong>Team Index:</strong> Team ${registration.teamIndex}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Venue:</strong> ${tournament.venue}</p>
          <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString()}</p>
          <p><strong>Entry Fee:</strong> ₹${tournament.teamEntryFee}</p>
          <p><strong>Registration Status:</strong> Pending Verification</p>
        </div>
        <p>Your team owner registration has been submitted successfully. You will receive further updates about verification and auction details.</p>
        <p>Please keep this email for your records.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated message from Tunda Sports Club.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: ownerEmail,
      subject: `Team Owner Registration Received - ${tournament.name}`,
      html: ownerConfirmationHtml
    });

    // Send notification to admins
    const adminEmails = getAdminRecipients();
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Team Owner Registration</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">New Team Owner Registration</h3>
          <p><strong>Owner Name:</strong> ${ownerName}</p>
          <p><strong>Phone:</strong> ${registration.ownerPhone}</p>
          <p><strong>Email:</strong> ${registration.ownerEmail}</p>
          <p><strong>Team Name:</strong> ${registration.teamName}</p>
          <p><strong>Team Index:</strong> ${registration.teamIndex}</p>
          <p><strong>Tournament:</strong> ${tournament.name}</p>
          <p><strong>Registration ID:</strong> ${registration.id}</p>
        </div>
        <p>Please verify this team owner registration through the admin panel.</p>
      </div>
    `;

    for (const adminEmail of adminEmails) {
      await sendEmail({
        to: adminEmail,
        subject: `New Team Owner Registration - ${ownerName}`,
        html: adminNotificationHtml
      });
    }
  } catch (error) {
    console.error('Error sending team owner registration emails:', error);
    throw error;
  }
};

// Send admin notification for player registration
export const sendAdminPlayerRegistrationNotification = async (
  playerName: string,
  playerEmail: string,
  playerPhone: string,
  position: string,
  experience: string,
  tournamentName: string,
  registrationId?: string
): Promise<boolean> => {
  const adminEmails = getAdminRecipients();
  
  const templateVariables = {
    playerName,
    playerEmail,
    playerPhone,
    position,
    experience,
    tournamentName,
    registrationId: registrationId || 'N/A',
    registrationDate: new Date().toLocaleDateString(),
    adminUrl: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/admin` : 'Admin Panel'
  };

  let success = true;
  for (const adminEmail of adminEmails) {
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Player Registration Alert</p>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">New Player Registration Received</h2>
          <p style="margin: 0; color: #374151;">
            A new player registration has been submitted and requires your review.
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">Player Details:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li><strong>Player Name:</strong> ${playerName}</li>
            <li><strong>Email:</strong> ${playerEmail}</li>
            <li><strong>Phone:</strong> ${playerPhone}</li>
            <li><strong>Position:</strong> ${position}</li>
            <li><strong>Experience:</strong> ${experience}</li>
            <li><strong>Tournament:</strong> ${tournamentName}</li>
            ${registrationId ? `<li><strong>Registration ID:</strong> ${registrationId}</li>` : ''}
            <li><strong>Registration Date:</strong> ${templateVariables.registrationDate}</li>
            <li><strong>Status:</strong> Pending Review</li>
          </ul>
        </div>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>Action Required:</strong><br>
            Please review this player registration in the admin panel and approve or reject as appropriate.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated notification from Tunda Sports Club.<br>
            Please log in to the admin panel to take action.
          </p>
        </div>
      </div>
    `;
    
    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `New Player Registration - ${playerName} for ${tournamentName}`,
      html: adminNotificationHtml,
      notificationType: 'admin-notification'
    });
    
    if (!emailSent) success = false;
  }

  return success;
};

// Send admin notification for team owner registration
export const sendAdminTeamOwnerRegistrationNotification = async (
  ownerName: string,
  ownerEmail: string,
  ownerPhone: string,
  teamName: string,
  teamIndex: number,
  tournamentName: string,
  registrationId?: string
): Promise<boolean> => {
  const adminEmails = getAdminRecipients();
  
  let success = true;
  for (const adminEmail of adminEmails) {
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Tunda Sports Club</h1>
          <p style="color: #666; margin: 5px 0 0 0;">New Team Owner Registration Alert</p>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">New Team Owner Registration Received</h2>
          <p style="margin: 0; color: #374151;">
            A new team owner registration has been submitted and requires your review.
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">Team Owner Details:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li><strong>Owner Name:</strong> ${ownerName}</li>
            <li><strong>Email:</strong> ${ownerEmail}</li>
            <li><strong>Phone:</strong> ${ownerPhone}</li>
            <li><strong>Team Name:</strong> ${teamName}</li>
            <li><strong>Team Index:</strong> Team #${teamIndex}</li>
            <li><strong>Tournament:</strong> ${tournamentName}</li>
            ${registrationId ? `<li><strong>Registration ID:</strong> ${registrationId}</li>` : ''}
            <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Status:</strong> Pending Verification</li>
          </ul>
        </div>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>Action Required:</strong><br>
            Please review this team owner registration in the admin panel and verify or reject as appropriate.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This is an automated notification from Tunda Sports Club.<br>
            Please log in to the admin panel to take action.
          </p>
        </div>
      </div>
    `;
    
    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `New Team Owner Registration - ${ownerName} for ${tournamentName}`,
      html: adminNotificationHtml,
      notificationType: 'admin-notification'
    });
    
    if (!emailSent) success = false;
  }

  return success;
};
