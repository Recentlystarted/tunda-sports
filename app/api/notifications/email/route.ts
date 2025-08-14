import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

interface EmailNotificationRequest {
  type: 'registration_approved' | 'registration_rejected' | 'tournament_reminder' | 'payment_reminder' | 'custom';
  recipientEmail: string;
  recipientName?: string;
  tournamentName?: string;
  data?: Record<string, any>;
  customSubject?: string;
  customMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationRequest = await request.json();
    const { 
      type, 
      recipientEmail, 
      recipientName = 'Participant',
      tournamentName = 'Tournament',
      data = {},
      customSubject,
      customMessage
    } = body;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'registration_approved':
        subject = `Registration Approved - ${tournamentName}`;
        htmlContent = `
          <h2>🎉 Registration Approved!</h2>
          <p>Dear ${recipientName},</p>
          <p>Great news! Your registration for <strong>${tournamentName}</strong> has been approved.</p>
          
          <h3>Registration Details:</h3>
          <ul>
            ${data.teamName ? `<li><strong>Team:</strong> ${data.teamName}</li>` : ''}
            ${data.captainName ? `<li><strong>Captain:</strong> ${data.captainName}</li>` : ''}
            ${data.playerCount ? `<li><strong>Players:</strong> ${data.playerCount}</li>` : ''}
            ${data.registrationFee ? `<li><strong>Registration Fee:</strong> ₹${data.registrationFee}</li>` : ''}
          </ul>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Check your email regularly for tournament updates</li>
            <li>Join the official WhatsApp group (link will be shared)</li>
            <li>Complete payment if not already done</li>
            <li>Prepare for the tournament dates</li>
          </ul>
          
          ${data.tournamentDate ? `<p><strong>Tournament Date:</strong> ${data.tournamentDate}</p>` : ''}
          ${data.venue ? `<p><strong>Venue:</strong> ${data.venue}</p>` : ''}
          
          <p>We look forward to seeing you at the tournament!</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'registration_rejected':
        subject = `Registration Update - ${tournamentName}`;
        htmlContent = `
          <h2>Registration Update</h2>
          <p>Dear ${recipientName},</p>
          <p>We regret to inform you that your registration for <strong>${tournamentName}</strong> could not be processed at this time.</p>
          
          ${data.reason ? `<h3>Reason:</h3><p>${data.reason}</p>` : ''}
          
          <h3>What You Can Do:</h3>
          <ul>
            <li>Check if you meet all eligibility criteria</li>
            <li>Ensure all required documents are submitted</li>
            <li>Contact us if you believe this is an error</li>
            <li>Watch for future tournament announcements</li>
          </ul>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'tournament_reminder':
        subject = `Tournament Reminder - ${tournamentName}`;
        htmlContent = `
          <h2>📅 Tournament Reminder</h2>
          <p>Dear ${recipientName},</p>
          <p>This is a friendly reminder about the upcoming <strong>${tournamentName}</strong>.</p>
          
          <h3>Tournament Details:</h3>
          <ul>
            ${data.date ? `<li><strong>Date:</strong> ${data.date}</li>` : ''}
            ${data.time ? `<li><strong>Time:</strong> ${data.time}</li>` : ''}
            ${data.venue ? `<li><strong>Venue:</strong> ${data.venue}</li>` : ''}
            ${data.reportingTime ? `<li><strong>Reporting Time:</strong> ${data.reportingTime}</li>` : ''}
          </ul>
          
          <h3>Important Reminders:</h3>
          <ul>
            <li>Arrive at the venue 30 minutes before your match</li>
            <li>Bring valid ID for verification</li>
            <li>Wear appropriate sports attire</li>
            <li>Bring your own water bottle</li>
            ${data.additionalItems ? `<li>${data.additionalItems}</li>` : ''}
          </ul>
          
          ${data.weather ? `<p><strong>Weather Update:</strong> ${data.weather}</p>` : ''}
          ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
          
          <p>Best of luck in the tournament!</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'payment_reminder':
        subject = `Payment Reminder - ${tournamentName}`;
        htmlContent = `
          <h2>💳 Payment Reminder</h2>
          <p>Dear ${recipientName},</p>
          <p>This is a reminder about the pending payment for <strong>${tournamentName}</strong>.</p>
          
          <h3>Payment Details:</h3>
          <ul>
            ${data.amount ? `<li><strong>Amount Due:</strong> ₹${data.amount}</li>` : ''}
            ${data.dueDate ? `<li><strong>Due Date:</strong> ${data.dueDate}</li>` : ''}
            ${data.paymentMethod ? `<li><strong>Payment Method:</strong> ${data.paymentMethod}</li>` : ''}
          </ul>
          
          ${data.upiId ? `
            <h3>UPI Payment:</h3>
            <p>UPI ID: <strong>${data.upiId}</strong></p>
            <p>Please include your team/player name in the payment reference.</p>
          ` : ''}
          
          ${data.bankDetails ? `
            <h3>Bank Transfer:</h3>
            <p>${data.bankDetails}</p>
          ` : ''}
          
          <h3>Important:</h3>
          <ul>
            <li>Complete payment before the due date to confirm your participation</li>
            <li>Send payment confirmation screenshot to this email</li>
            <li>Late payments may result in registration cancellation</li>
          </ul>
          
          <p>For any payment issues, please contact us immediately.</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'custom':
        subject = customSubject || `Notification - ${tournamentName}`;
        htmlContent = `
          <h2>Notification</h2>
          <p>Dear ${recipientName},</p>
          ${customMessage ? `
            <div>${customMessage}</div>
          ` : `
            <p>You have received a notification regarding <strong>${tournamentName}</strong>.</p>
          `}
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent
    });

    return NextResponse.json({ 
      success: true,
      message: 'Email notification sent successfully' 
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get notification templates
export async function GET() {
  try {
    const templates = [
      {
        type: 'registration_approved',
        name: 'Registration Approved',
        description: 'Sent when a team/player registration is approved'
      },
      {
        type: 'registration_rejected', 
        name: 'Registration Rejected',
        description: 'Sent when a team/player registration is rejected'
      },
      {
        type: 'tournament_reminder',
        name: 'Tournament Reminder',
        description: 'Sent as a reminder before tournament starts'
      },
      {
        type: 'payment_reminder',
        name: 'Payment Reminder', 
        description: 'Sent to remind about pending payments'
      },
      {
        type: 'custom',
        name: 'Custom Message',
        description: 'Send a custom message to participants'
      }
    ];

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}
