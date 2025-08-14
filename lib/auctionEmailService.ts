// Email notification utilities for auction player registration
// This is a basic implementation - you can integrate with services like Nodemailer, SendGrid, etc.

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface Player {
  name: string;
  email: string;
  phone: string;
  position: string;
}

interface Tournament {
  name: string;
  auctionDate: string;
  venue: string;
  totalGroups: number;
  teamsPerGroup: number;
  auctionBudget: number;
}

export function generatePlayerRegistrationEmail(player: Player, tournament: Tournament): EmailTemplate {
  const subject = `🏏 Registration Confirmed - ${tournament.name}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
            .footer { background: #f9fafb; padding: 15px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏏 Tunda Sports Club</h1>
            <h2>Registration Successful!</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>${player.name}</strong>,</p>
            
            <p>Congratulations! You have successfully registered for the auction tournament:</p>
            
            <div class="highlight">
                <h3>🏆 ${tournament.name}</h3>
                <p><strong>🎯 Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>📍 Venue:</strong> ${tournament.venue}</p>
                <p><strong>👥 Format:</strong> ${tournament.totalGroups} groups with ${tournament.teamsPerGroup} teams each</p>
                <p><strong>💰 Team Budget:</strong> ₹${tournament.auctionBudget.toLocaleString()} per team</p>
            </div>
            
            <h3>Your Registration Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${player.name}</li>
                <li><strong>Position:</strong> ${player.position.replace('_', ' ')}</li>
                <li><strong>Phone:</strong> ${player.phone}</li>
                <li><strong>Email:</strong> ${player.email}</li>
            </ul>
            
            <h3>🎯 What's Next?</h3>
            <ol>
                <li><strong>Auction Preparation:</strong> You're now in the player pool for the auction</li>
                <li><strong>Team Selection:</strong> Team owners will bid for you during the auction</li>
                <li><strong>Tournament Matches:</strong> Once selected, you'll play in your team's group matches</li>
                <li><strong>Updates:</strong> We'll keep you informed about auction results and match schedules</li>
            </ol>
            
            <div class="highlight">
                <p><strong>📧 Important:</strong> Keep checking your email for auction updates and match schedules. Make sure to be available for the auction date!</p>
            </div>
            
            <p>Best of luck in the auction! We're excited to have you as part of this tournament.</p>
            
            <p>
                Regards,<br>
                <strong>Tunda Sports Club</strong><br>
                📞 Tournament Helpline: +91 98765 43210<br>
                📧 Email: tournaments@tundacricket.com
            </p>
        </div>
        
        <div class="footer">
            <p>🏏 Tunda Sports Club - Promoting Cricket Excellence in Gujarat</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
  `
  
  const text = `
🏏 TUNDA SPORTS CLUB - REGISTRATION CONFIRMED

Dear ${player.name},

Congratulations! You have successfully registered for the auction tournament:

🏆 TOURNAMENT: ${tournament.name}
🎯 Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
📍 Venue: ${tournament.venue}
👥 Format: ${tournament.totalGroups} groups with ${tournament.teamsPerGroup} teams each
💰 Team Budget: ₹${tournament.auctionBudget.toLocaleString()} per team

YOUR REGISTRATION DETAILS:
- Name: ${player.name}
- Position: ${player.position.replace('_', ' ')}
- Phone: ${player.phone}
- Email: ${player.email}

WHAT'S NEXT?
1. Auction Preparation: You're now in the player pool
2. Team Selection: Team owners will bid for you
3. Tournament Matches: Play in your team's group matches
4. Updates: Check email for auction results and schedules

📧 IMPORTANT: Keep checking your email for updates. Be available for the auction date!

Best of luck in the auction!

Regards,
Tunda Sports Club
📞 +91 98765 43210
📧 tournaments@tundacricket.com

🏏 Promoting Cricket Excellence in Gujarat
  `
  
  return { subject, html, text }
}

// Mock function to send email - replace with actual email service
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    // TODO: Integrate with actual email service (Nodemailer, SendGrid, etc.)
    console.log('📧 Sending email to:', to)
    console.log('📧 Subject:', template.subject)
    console.log('📧 Content preview:', template.text.substring(0, 200) + '...')
    
    // For now, just log the email - you can integrate with real email service
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransporter(config)
    // await transporter.sendMail({ to, subject: template.subject, html: template.html })
    
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// Function to queue email for later processing
export function queuePlayerRegistrationEmail(player: Player, tournament: Tournament) {
  try {
    const template = generatePlayerRegistrationEmail(player, tournament)
    
    // For development, just log the email
    console.log('🎯 PLAYER REGISTRATION EMAIL QUEUED:')
    console.log('TO:', player.email)
    console.log('SUBJECT:', template.subject)
    console.log('PREVIEW:', template.text.substring(0, 300) + '...')
    
    // TODO: Add to email queue or send immediately
    // sendEmail(player.email, template)
    
    return true
  } catch (error) {
    console.error('❌ Failed to queue email:', error)
    return false
  }
}
