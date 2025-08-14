import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipientEmail, tournamentName, data } = body;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'auction_player_registered':
        subject = `Player Registration Confirmed - ${tournamentName}`;
        htmlContent = `
          <h2>Player Registration Confirmed</h2>
          <p>Dear ${data.playerName},</p>
          <p>Your registration for <strong>${tournamentName}</strong> has been confirmed!</p>
          
          <h3>Registration Details:</h3>
          <ul>
            <li><strong>Player Name:</strong> ${data.playerName}</li>
            <li><strong>Age:</strong> ${data.age}</li>
            <li><strong>Position:</strong> ${data.position}</li>
            <li><strong>Base Price:</strong> ₹${data.basePrice}</li>
            <li><strong>Category:</strong> ${data.category}</li>
          </ul>
          
          <h3>What's Next?</h3>
          <p>Your player profile will be available for team owners to bid during the auction. You'll receive updates about:</p>
          <ul>
            <li>Auction date and time</li>
            <li>Bidding results</li>
            <li>Team assignment (if selected)</li>
            <li>Tournament schedule</li>
          </ul>
          
          <p>Good luck with the auction!</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'team_owner_registered':
        subject = `Team Owner Registration Confirmed - ${tournamentName}`;
        htmlContent = `
          <h2>Team Owner Registration Confirmed</h2>
          <p>Dear ${data.ownerName},</p>
          <p>Your team owner registration for <strong>${tournamentName}</strong> has been confirmed!</p>
          
          <h3>Registration Details:</h3>
          <ul>
            <li><strong>Team Name:</strong> ${data.teamName}</li>
            <li><strong>Owner Name:</strong> ${data.ownerName}</li>
            <li><strong>Contact:</strong> ${data.contactNumber}</li>
            <li><strong>Auction Budget:</strong> ₹${data.auctionBudget}</li>
          </ul>
          
          <h3>Important Information:</h3>
          <p>Please remember the following for the auction:</p>
          <ul>
            <li>Your total budget is ₹${data.auctionBudget}</li>
            <li>Minimum bid amount: ₹${data.minBidAmount || 100}</li>
            <li>You must select exactly ${data.maxPlayersPerTeam || 11} players</li>
            <li>Keep track of your spending during the auction</li>
          </ul>
          
          <h3>What's Next?</h3>
          <p>You'll receive:</p>
          <ul>
            <li>Player list and profiles before the auction</li>
            <li>Auction date, time, and venue details</li>
            <li>Instructions for the bidding process</li>
            <li>Tournament schedule after player selection</li>
          </ul>
          
          <p>Get ready for an exciting auction!</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'auction_reminder':
        subject = `Auction Reminder - ${tournamentName}`;
        htmlContent = `
          <h2>Auction Reminder</h2>
          <p>Dear Participant,</p>
          <p>This is a reminder about the upcoming auction for <strong>${tournamentName}</strong>.</p>
          
          <h3>Auction Details:</h3>
          <ul>
            <li><strong>Date:</strong> ${data.auctionDate}</li>
            <li><strong>Time:</strong> ${data.auctionTime}</li>
            <li><strong>Venue:</strong> ${data.venue}</li>
          </ul>
          
          <h3>Important Reminders:</h3>
          <ul>
            <li>Please arrive 15 minutes before the start time</li>
            <li>Bring a valid ID for verification</li>
            <li>Team owners: Bring your budget summary</li>
            <li>Players: Be prepared for skill assessments if required</li>
          </ul>
          
          <p>Looking forward to seeing you at the auction!</p>
          <p>Best regards,<br/>Tunda Sports Club</p>
        `;
        break;

      case 'bidding_result':
        subject = `Bidding Result - ${tournamentName}`;
        htmlContent = `
          <h2>Bidding Result</h2>
          <p>Dear ${data.playerName},</p>
          
          ${data.isSelected ? `
            <h3>🎉 Congratulations! You've been selected!</h3>
            <p>You have been successfully bid for and selected by <strong>${data.teamName}</strong>!</p>
            
            <h3>Selection Details:</h3>
            <ul>
              <li><strong>Team:</strong> ${data.teamName}</li>
              <li><strong>Final Bid Amount:</strong> ₹${data.finalBidAmount}</li>
              <li><strong>Team Owner:</strong> ${data.teamOwner}</li>
              <li><strong>Team Owner Contact:</strong> ${data.teamOwnerContact}</li>
            </ul>
            
            <h3>What's Next?</h3>
            <p>Your team owner will contact you soon with:</p>
            <ul>
              <li>Team WhatsApp group details</li>
              <li>Practice schedule</li>
              <li>Match fixtures</li>
              <li>Team jersey and kit information</li>
            </ul>
          ` : `
            <h3>Auction Update</h3>
            <p>Unfortunately, you were not selected in this auction round.</p>
            <p>However, you may still be considered if:</p>
            <ul>
              <li>A team has remaining budget and open slots</li>
              <li>There are additional auction rounds</li>
              <li>A player withdraws and replacement is needed</li>
            </ul>
            <p>We'll keep you updated on any additional opportunities.</p>
          `}
          
          <p>Thank you for participating in the auction!</p>
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
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
