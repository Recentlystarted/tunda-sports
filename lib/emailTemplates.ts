// Email Templates for Tournament Management System

export interface PlayerData {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  city: string;
  position: string;
  experience: string;
  basePrice: number;
  soldPrice?: number;
  auctionStatus: string;
  auctionTeam?: {
    name: string;
    ownerName: string;
    ownerPhone: string;
  };
}

export interface TeamOwnerData {
  id: string;
  teamName: string;
  teamIndex: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCity: string;
  sponsorName?: string;
  verified: boolean;
  entryFeePaid: boolean;
  auctionToken?: string;
}

export interface TournamentData {
  id: string;
  name: string;
  startDate: string;
  venue: string;
  auctionDate?: string;
  playerEntryFee: number;
  teamEntryFee: number;
}

// Player Registration Email Templates
export const playerRegistrationTemplates = {
  // Player registration confirmation
  playerRegistered: (player: PlayerData, tournament: TournamentData) => ({
    subject: `🏏 Registration Confirmed - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
            🏏 Registration Confirmed!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${player.name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Your registration for <strong>${tournament.name}</strong> has been successfully submitted!
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Your Registration Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Age:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.age} years</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Position:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.position}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Experience:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.experience}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Base Price:</td>
                <td style="padding: 8px 0; color: #6b7280;">₹${player.basePrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Entry Fee:</td>
                <td style="padding: 8px 0; color: #6b7280;">₹${tournament.playerEntryFee}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-bottom: 15px;">⏰ Important Auction Information:</h3>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Tournament:</strong> ${tournament.name}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Tournament Date:</strong> ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
            </p>
            ${tournament.auctionDate ? `
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
            </p>
            ` : ''}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">📌 Next Steps:</h3>
            <ol style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Admin will review your registration</li>
              <li style="margin-bottom: 8px;">Complete your entry fee payment of ₹${tournament.playerEntryFee}</li>
              <li style="margin-bottom: 8px;">Attend the auction on the specified date</li>
              <li style="margin-bottom: 8px;">Wait for team selection during auction</li>
            </ol>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            For any queries, please contact the tournament organizers.<br>
            Best of luck for the auction! 🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Registration Confirmed - ${tournament.name}
      
      Dear ${player.name},
      
      Your registration for ${tournament.name} has been successfully submitted!
      
      Registration Details:
      - Name: ${player.name}
      - Age: ${player.age} years
      - Position: ${player.position}
      - Experience: ${player.experience}
      - Base Price: ₹${player.basePrice}
      - Entry Fee: ₹${tournament.playerEntryFee}
      
      Tournament Information:
      - Tournament: ${tournament.name}
      - Venue: ${tournament.venue}
      - Tournament Date: ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
      ${tournament.auctionDate ? `- Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      
      Next Steps:
      1. Admin will review your registration
      2. Complete your entry fee payment of ₹${tournament.playerEntryFee}
      3. Attend the auction on the specified date
      4. Wait for team selection during auction
      
      For any queries, please contact the tournament organizers.
      Best of luck for the auction!
    `
  }),

  // Player approved for auction
  playerApproved: (player: PlayerData, tournament: TournamentData) => ({
    subject: `✅ Approved for Auction - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            ✅ Congratulations! You're Approved for Auction
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${player.name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Great news! Your registration has been approved and you're now eligible for the auction in <strong>${tournament.name}</strong>.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">🎯 Auction Details:</h3>
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Tournament:</strong> ${tournament.name}
            </p>
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Tournament Date:</strong> ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
            </p>
            ${tournament.auctionDate ? `
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
            </p>
            ` : ''}
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Your Base Price:</strong> ₹${player.basePrice}
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px;">⚠️ Important Reminders:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your entry fee payment of ₹${tournament.playerEntryFee} if not already done</li>
              <li style="margin-bottom: 8px;">Be present at the auction venue on time</li>
              <li style="margin-bottom: 8px;">Bring necessary documents for verification</li>
              <li style="margin-bottom: 8px;">You'll be notified about team selection results</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Best of luck for the auction! We're excited to see you play! 🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Approved for Auction - ${tournament.name}
      
      Dear ${player.name},
      
      Great news! Your registration has been approved and you're now eligible for the auction in ${tournament.name}.
      
      Auction Details:
      - Tournament: ${tournament.name}
      - Venue: ${tournament.venue}
      - Tournament Date: ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
      ${tournament.auctionDate ? `- Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      - Your Base Price: ₹${player.basePrice}
      
      Important Reminders:
      - Complete your entry fee payment of ₹${tournament.playerEntryFee} if not already done
      - Be present at the auction venue on time
      - Bring necessary documents for verification
      - You'll be notified about team selection results
      
      Best of luck for the auction!
    `
  }),

  // Player payment received
  playerPaymentReceived: (player: PlayerData, tournament: TournamentData) => ({
    subject: `💰 Payment Confirmed - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            💰 Payment Confirmed!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${player.name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Your entry fee payment of <strong>₹${tournament.playerEntryFee}</strong> has been confirmed for <strong>${tournament.name}</strong>.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">✅ You're All Set!</h3>
            <p style="color: #166534; margin-bottom: 10px;">
              Your registration is now complete and you're ready for the auction.
            </p>
            ${tournament.auctionDate ? `
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
            </p>
            ` : ''}
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            See you at the auction! Best of luck! 🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Payment Confirmed - ${tournament.name}
      
      Dear ${player.name},
      
      Your entry fee payment of ₹${tournament.playerEntryFee} has been confirmed for ${tournament.name}.
      
      You're All Set!
      Your registration is now complete and you're ready for the auction.
      
      ${tournament.auctionDate ? `Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      Venue: ${tournament.venue}
      
      See you at the auction! Best of luck!
    `
  }),

  // Player sold in auction
  playerSold: (player: PlayerData, tournament: TournamentData) => ({
    subject: `🎉 Congratulations! You've been Selected - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            🎉 CONGRATULATIONS! YOU'VE BEEN SELECTED!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${player.name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Fantastic news! You have been selected in the auction for <strong>${tournament.name}</strong>!
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">🏆 Your Team Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Team Name:</td>
                <td style="padding: 8px 0; color: #166534;">${player.auctionTeam?.name || 'TBD'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Team Owner:</td>
                <td style="padding: 8px 0; color: #166534;">${player.auctionTeam?.ownerName || 'TBD'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Owner Contact:</td>
                <td style="padding: 8px 0; color: #166534;">${player.auctionTeam?.ownerPhone || 'TBD'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Your Base Price:</td>
                <td style="padding: 8px 0; color: #166534;">₹${player.basePrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Sold Price:</td>
                <td style="padding: 8px 0; color: #16a34a; font-size: 18px; font-weight: bold;">₹${player.soldPrice || player.basePrice}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">📞 Contact Your Team Owner:</h3>
            <p style="color: #1e40af; margin-bottom: 10px;">
              Please get in touch with your team owner <strong>${player.auctionTeam?.ownerName}</strong> at <strong>${player.auctionTeam?.ownerPhone}</strong> for further instructions and team coordination.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px;">📅 Tournament Information:</h3>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Tournament:</strong> ${tournament.name}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Congratulations once again! Give your best for your team! 🏆🎯
          </p>
        </div>
      </div>
    `,
    text: `
      Congratulations! You've been Selected - ${tournament.name}
      
      Dear ${player.name},
      
      Fantastic news! You have been selected in the auction for ${tournament.name}!
      
      Your Team Details:
      - Team Name: ${player.auctionTeam?.name || 'TBD'}
      - Team Owner: ${player.auctionTeam?.ownerName || 'TBD'}
      - Owner Contact: ${player.auctionTeam?.ownerPhone || 'TBD'}
      - Your Base Price: ₹${player.basePrice}
      - Sold Price: ₹${player.soldPrice || player.basePrice}
      
      Contact Your Team Owner:
      Please get in touch with your team owner ${player.auctionTeam?.ownerName} at ${player.auctionTeam?.ownerPhone} for further instructions and team coordination.
      
      Tournament Information:
      - Tournament: ${tournament.name}
      - Start Date: ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
      - Venue: ${tournament.venue}
      
      Congratulations once again! Give your best for your team!
    `
  }),

  // Player unsold in auction
  playerUnsold: (player: PlayerData, tournament: TournamentData) => ({
    subject: `⚪ Auction Update - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #6b7280; text-align: center; margin-bottom: 30px;">
            ⚪ Auction Update
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${player.name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Thank you for participating in the auction for <strong>${tournament.name}</strong>. Unfortunately, you were not selected by any team in this auction round.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
            <h3 style="color: #4b5563; margin-bottom: 15px;">📊 Your Auction Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Position:</td>
                <td style="padding: 8px 0; color: #6b7280;">${player.position}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Base Price:</td>
                <td style="padding: 8px 0; color: #6b7280;">₹${player.basePrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Status:</td>
                <td style="padding: 8px 0; color: #6b7280;">Unsold</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">🔄 What's Next?</h3>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Don't be discouraged! This is part of the auction process</li>
              <li style="margin-bottom: 8px;">You may be considered if there are additional rounds</li>
              <li style="margin-bottom: 8px;">Teams might reach out directly if they need additional players</li>
              <li style="margin-bottom: 8px;">Keep practicing and stay ready for future tournaments</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px;">💡 Keep Playing!</h3>
            <p style="color: #92400e; margin-bottom: 10px;">
              We encourage you to continue participating in future tournaments. Your skills and dedication are valuable, and there will be more opportunities ahead.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Thank you for your participation. Keep practicing and stay motivated! 🏏💪
          </p>
        </div>
      </div>
    `,
    text: `
      Auction Update - ${tournament.name}
      
      Dear ${player.name},
      
      Thank you for participating in the auction for ${tournament.name}. Unfortunately, you were not selected by any team in this auction round.
      
      Your Auction Details:
      - Name: ${player.name}
      - Position: ${player.position}
      - Base Price: ₹${player.basePrice}
      - Status: Unsold
      
      What's Next?
      - Don't be discouraged! This is part of the auction process
      - You may be considered if there are additional rounds
      - Teams might reach out directly if they need additional players
      - Keep practicing and stay ready for future tournaments
      
      Keep Playing!
      We encourage you to continue participating in future tournaments. Your skills and dedication are valuable, and there will be more opportunities ahead.
      
      Thank you for your participation. Keep practicing and stay motivated!
    `
  })
};

// Team Owner Email Templates
export const teamOwnerTemplates = {
  // Team owner registration confirmation
  ownerRegistered: (owner: TeamOwnerData, tournament: TournamentData) => ({
    subject: `🏏 Team Owner Registration Confirmed - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #7c3aed; text-align: center; margin-bottom: 30px;">
            👑 Team Owner Registration Confirmed!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${owner.ownerName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Your team owner registration for <strong>${tournament.name}</strong> has been successfully submitted!
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">👑 Your Team Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${owner.teamName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team Index:</td>
                <td style="padding: 8px 0; color: #6b7280;">#${owner.teamIndex}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Owner Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${owner.ownerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">City:</td>
                <td style="padding: 8px 0; color: #6b7280;">${owner.ownerCity}</td>
              </tr>
              ${owner.sponsorName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Sponsor:</td>
                <td style="padding: 8px 0; color: #6b7280;">${owner.sponsorName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team Entry Fee:</td>
                <td style="padding: 8px 0; color: #6b7280;">₹${tournament.teamEntryFee}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-bottom: 15px;">⏰ Tournament Information:</h3>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Tournament:</strong> ${tournament.name}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Tournament Date:</strong> ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
            </p>
            ${tournament.auctionDate ? `
            <p style="color: #92400e; margin-bottom: 10px;">
              <strong>Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
            </p>
            ` : ''}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">📌 Next Steps:</h3>
            <ol style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Admin will verify your registration</li>
              <li style="margin-bottom: 8px;">Complete your team entry fee payment of ₹${tournament.teamEntryFee}</li>
              <li style="margin-bottom: 8px;">Attend the auction to select your players</li>
              <li style="margin-bottom: 8px;">Receive your team roster after auction completion</li>
            </ol>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Welcome to the tournament! Best of luck building your team! 👑🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Team Owner Registration Confirmed - ${tournament.name}
      
      Dear ${owner.ownerName},
      
      Your team owner registration for ${tournament.name} has been successfully submitted!
      
      Your Team Details:
      - Team Name: ${owner.teamName}
      - Team Index: #${owner.teamIndex}
      - Owner Name: ${owner.ownerName}
      - City: ${owner.ownerCity}
      ${owner.sponsorName ? `- Sponsor: ${owner.sponsorName}` : ''}
      - Team Entry Fee: ₹${tournament.teamEntryFee}
      
      Tournament Information:
      - Tournament: ${tournament.name}
      - Venue: ${tournament.venue}
      - Tournament Date: ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
      ${tournament.auctionDate ? `- Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      
      Next Steps:
      1. Admin will verify your registration
      2. Complete your team entry fee payment of ₹${tournament.teamEntryFee}
      3. Attend the auction to select your players
      4. Receive your team roster after auction completion
      
      Welcome to the tournament! Best of luck building your team!
    `
  }),

  // Team owner verified
  ownerVerified: (owner: TeamOwnerData, tournament: TournamentData) => ({
    subject: `✅ Team Owner Verified - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            ✅ Team Owner Verification Complete!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${owner.ownerName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Congratulations! Your team owner registration for <strong>${tournament.name}</strong> has been verified and approved.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">🎯 You're Ready for Auction!</h3>
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Team:</strong> ${owner.teamName} (Team #${owner.teamIndex})
            </p>
            ${tournament.auctionDate ? `
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Auction Date:</strong> ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}
            </p>
            ` : ''}
            <p style="color: #166534; margin-bottom: 10px;">
              <strong>Venue:</strong> ${tournament.venue}
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px;">⚠️ Important Reminders:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your team entry fee payment of ₹${tournament.teamEntryFee} if not already done</li>
              <li style="margin-bottom: 8px;">Attend the auction on the specified date and time</li>
              <li style="margin-bottom: 8px;">Bring necessary documents and payment confirmation</li>
              <li style="margin-bottom: 8px;">Be prepared to bid strategically for your desired players</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Best of luck building your dream team! 👑🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Team Owner Verified - ${tournament.name}
      
      Dear ${owner.ownerName},
      
      Congratulations! Your team owner registration for ${tournament.name} has been verified and approved.
      
      You're Ready for Auction!
      - Team: ${owner.teamName} (Team #${owner.teamIndex})
      ${tournament.auctionDate ? `- Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      - Venue: ${tournament.venue}
      
      Important Reminders:
      - Complete your team entry fee payment of ₹${tournament.teamEntryFee} if not already done
      - Attend the auction on the specified date and time
      - Bring necessary documents and payment confirmation
      - Be prepared to bid strategically for your desired players
      
      Best of luck building your dream team!
    `
  }),

  // Team owner verified with unique auction link
  ownerVerifiedWithAuctionLink: (owner: TeamOwnerData, tournament: TournamentData) => ({
    subject: `🎯 Auction Access Ready - ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            🎯 Your Auction Access is Ready!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${owner.ownerName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Great news! Your team owner registration has been verified and approved. You now have access to the auction portal for <strong>${tournament.name}</strong>.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">🔗 Your Unique Auction Link:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px; border: 2px dashed #16a34a;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auction/${tournament.id}/owner?token=${owner.auctionToken}" 
                 style="color: #16a34a; font-weight: bold; font-size: 14px; text-decoration: none; word-break: break-all;">
                🎯 Access Your Auction Portal
              </a>
            </div>
            <p style="color: #166534; font-size: 12px; margin-top: 10px; margin-bottom: 0;">
              ⚠️ This link is unique to your team and should not be shared with others.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-bottom: 15px;">📅 Auction Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #92400e;">Team:</td>
                <td style="padding: 6px 0; color: #92400e;">${owner.teamName} (Team #${owner.teamIndex})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #92400e;">Tournament:</td>
                <td style="padding: 6px 0; color: #92400e;">${tournament.name}</td>
              </tr>
              ${tournament.auctionDate ? `
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #92400e;">Auction Date:</td>
                <td style="padding: 6px 0; color: #92400e;">${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #92400e;">Venue:</td>
                <td style="padding: 6px 0; color: #92400e;">${tournament.venue}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">🎯 How to Use the Auction Portal:</h3>
            <ol style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Click the auction link above to access your team's portal</li>
              <li style="margin-bottom: 8px;">Browse available players and their details</li>
              <li style="margin-bottom: 8px;">Place bids on players you want for your team</li>
              <li style="margin-bottom: 8px;">Monitor auction progress and your team budget</li>
              <li style="margin-bottom: 8px;">Receive your final team roster after auction completion</li>
            </ol>
          </div>
          
          <div style="background-color: #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="color: #dc2626; margin: 0; font-size: 14px;">
              <strong>Important:</strong> Keep this email safe! If you lose access, contact the admin for assistance. Your auction link is valid only for this tournament.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Best of luck building your dream team! 👑🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Your Auction Access is Ready! - ${tournament.name}
      
      Dear ${owner.ownerName},
      
      Great news! Your team owner registration has been verified and approved. You now have access to the auction portal for ${tournament.name}.
      
      Your Unique Auction Link:
      ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auction/${tournament.id}/owner?token=${owner.auctionToken}
      
      ⚠️ This link is unique to your team and should not be shared with others.
      
      Auction Information:
      - Team: ${owner.teamName} (Team #${owner.teamIndex})
      - Tournament: ${tournament.name}
      ${tournament.auctionDate ? `- Auction Date: ${new Date(tournament.auctionDate).toLocaleDateString('en-IN')}` : ''}
      - Venue: ${tournament.venue}
      
      How to Use the Auction Portal:
      1. Click the auction link above to access your team's portal
      2. Browse available players and their details
      3. Place bids on players you want for your team
      4. Monitor auction progress and your team budget
      5. Receive your final team roster after auction completion
      
      Important: Keep this email safe! If you lose access, contact the admin for assistance. Your auction link is valid only for this tournament.
      
      Best of luck building your dream team!
    `
  }),

  // Team roster after auction (with all selected players)
  teamRosterComplete: (owner: TeamOwnerData, tournament: TournamentData, selectedPlayers: PlayerData[]) => ({
    subject: `🏆 Your Team Roster - ${owner.teamName} | ${tournament.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 30px;">
            🏆 Congratulations! Your Team is Complete!
          </h2>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Dear <strong>${owner.ownerName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            The auction for <strong>${tournament.name}</strong> is complete! Here's your final team roster for <strong>${owner.teamName}</strong>.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #166534; margin-bottom: 15px;">👑 Team Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Team Name:</td>
                <td style="padding: 8px 0; color: #166534;">${owner.teamName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Team Index:</td>
                <td style="padding: 8px 0; color: #166534;">#${owner.teamIndex}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Total Players:</td>
                <td style="padding: 8px 0; color: #166534;">${selectedPlayers.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #166534;">Total Investment:</td>
                <td style="padding: 8px 0; color: #166534; font-size: 18px; font-weight: bold;">₹${selectedPlayers.reduce((sum, player) => sum + (player.soldPrice || player.basePrice), 0)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">🏏 Your Team Roster:</h3>
            ${selectedPlayers.map((player, index) => `
              <div style="background-color: white; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #16a34a;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h4 style="color: #1f2937; margin: 0; font-size: 16px;">${index + 1}. ${player.name}</h4>
                  <span style="background-color: #16a34a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">₹${player.soldPrice || player.basePrice}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 2px 0; color: #6b7280; width: 30%;">Age:</td>
                    <td style="padding: 2px 0; color: #374151;">${player.age} years</td>
                    <td style="padding: 2px 0; color: #6b7280; width: 30%;">Position:</td>
                    <td style="padding: 2px 0; color: #374151;">${player.position}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #6b7280;">Phone:</td>
                    <td style="padding: 2px 0; color: #374151;">${player.phone}</td>
                    <td style="padding: 2px 0; color: #6b7280;">City:</td>
                    <td style="padding: 2px 0; color: #374151;">${player.city}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #6b7280;">Experience:</td>
                    <td style="padding: 2px 0; color: #374151;" colspan="3">${player.experience}</td>
                  </tr>
                </table>
              </div>
            `).join('')}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">📞 Next Steps:</h3>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Contact each player to introduce yourself as their team owner</li>
              <li style="margin-bottom: 8px;">Share tournament schedule and training plans</li>
              <li style="margin-bottom: 8px;">Coordinate team meetings and practice sessions</li>
              <li style="margin-bottom: 8px;">Prepare for the tournament starting ${new Date(tournament.startDate).toLocaleDateString('en-IN')}</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            Best of luck with your team! Lead them to victory! 👑🏆
          </p>
        </div>
      </div>
    `,
    text: `
      Your Team Roster - ${owner.teamName} | ${tournament.name}
      
      Dear ${owner.ownerName},
      
      The auction for ${tournament.name} is complete! Here's your final team roster for ${owner.teamName}.
      
      Team Information:
      - Team Name: ${owner.teamName}
      - Team Index: #${owner.teamIndex}
      - Total Players: ${selectedPlayers.length}
      - Total Investment: ₹${selectedPlayers.reduce((sum, player) => sum + (player.soldPrice || player.basePrice), 0)}
      
      Your Team Roster:
      ${selectedPlayers.map((player, index) => `
      ${index + 1}. ${player.name} - ₹${player.soldPrice || player.basePrice}
         Age: ${player.age} years, Position: ${player.position}
         Phone: ${player.phone}, City: ${player.city}
         Experience: ${player.experience}
      `).join('\n')}
      
      Next Steps:
      - Contact each player to introduce yourself as their team owner
      - Share tournament schedule and training plans
      - Coordinate team meetings and practice sessions
      - Prepare for the tournament starting ${new Date(tournament.startDate).toLocaleDateString('en-IN')}
      
      Best of luck with your team! Lead them to victory!
    `
  })
};

// Email sending utility functions
export const EmailService = {
  // Player emails
  sendPlayerRegistrationEmail: async (player: PlayerData, tournament: TournamentData) => {
    const template = playerRegistrationTemplates.playerRegistered(player, tournament);
    return await sendEmail(player.email, template.subject, template.html, template.text);
  },

  sendPlayerApprovedEmail: async (player: PlayerData, tournament: TournamentData) => {
    const template = playerRegistrationTemplates.playerApproved(player, tournament);
    return await sendEmail(player.email, template.subject, template.html, template.text);
  },

  sendPlayerPaymentReceivedEmail: async (player: PlayerData, tournament: TournamentData) => {
    const template = playerRegistrationTemplates.playerPaymentReceived(player, tournament);
    return await sendEmail(player.email, template.subject, template.html, template.text);
  },

  sendPlayerSoldEmail: async (player: PlayerData, tournament: TournamentData) => {
    const template = playerRegistrationTemplates.playerSold(player, tournament);
    return await sendEmail(player.email, template.subject, template.html, template.text);
  },

  sendPlayerUnsoldEmail: async (player: PlayerData, tournament: TournamentData) => {
    const template = playerRegistrationTemplates.playerUnsold(player, tournament);
    return await sendEmail(player.email, template.subject, template.html, template.text);
  },

  // Team owner emails
  sendOwnerRegistrationEmail: async (owner: TeamOwnerData, tournament: TournamentData) => {
    const template = teamOwnerTemplates.ownerRegistered(owner, tournament);
    return await sendEmail(owner.ownerEmail, template.subject, template.html, template.text);
  },

  sendOwnerVerifiedEmail: async (owner: TeamOwnerData, tournament: TournamentData) => {
    const template = teamOwnerTemplates.ownerVerified(owner, tournament);
    return await sendEmail(owner.ownerEmail, template.subject, template.html, template.text);
  },

  sendOwnerVerifiedWithAuctionLinkEmail: async (owner: TeamOwnerData, tournament: TournamentData) => {
    const template = teamOwnerTemplates.ownerVerifiedWithAuctionLink(owner, tournament);
    return await sendEmail(owner.ownerEmail, template.subject, template.html, template.text);
  },

  sendTeamRosterCompleteEmail: async (owner: TeamOwnerData, tournament: TournamentData, selectedPlayers: PlayerData[]) => {
    const template = teamOwnerTemplates.teamRosterComplete(owner, tournament, selectedPlayers);
    return await sendEmail(owner.ownerEmail, template.subject, template.html, template.text);
  },

  // Bulk notification for all selected players in a team
  sendAllSelectedPlayersEmail: async (selectedPlayers: PlayerData[], tournament: TournamentData) => {
    const emailPromises = selectedPlayers.map(async (player) => {
      const template = playerRegistrationTemplates.playerSold(player, tournament);
      return await sendEmail(player.email, template.subject, template.html, template.text);
    });
    return await Promise.all(emailPromises);
  },

  // Bulk notification for all unsold players
  sendAllUnsoldPlayersEmail: async (unsoldPlayers: PlayerData[], tournament: TournamentData) => {
    const emailPromises = unsoldPlayers.map(async (player) => {
      const template = playerRegistrationTemplates.playerUnsold(player, tournament);
      return await sendEmail(player.email, template.subject, template.html, template.text);
    });
    return await Promise.all(emailPromises);
  }
};

// Auction completion utilities
export const AuctionNotificationService = {
  // Send final roster to all team owners with their player details
  sendAllTeamRosterEmails: async (teamOwners: TeamOwnerData[], tournament: TournamentData, teamPlayersMap: Map<string, PlayerData[]>) => {
    const emailPromises = teamOwners.map(async (owner) => {
      const teamPlayers = teamPlayersMap.get(owner.id) || []
      return await EmailService.sendTeamRosterCompleteEmail(owner, tournament, teamPlayers)
    })
    
    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return { successful, failed, total: results.length }
  },

  // Send sold notifications to all selected players
  sendAllSoldPlayerEmails: async (soldPlayers: PlayerData[], tournament: TournamentData) => {
    const emailPromises = soldPlayers.map(player => 
      EmailService.sendPlayerSoldEmail(player, tournament)
    )
    
    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return { successful, failed, total: results.length }
  },

  // Send unsold notifications to all unsold players
  sendAllUnsoldPlayerEmails: async (unsoldPlayers: PlayerData[], tournament: TournamentData) => {
    const emailPromises = unsoldPlayers.map(player => 
      EmailService.sendPlayerUnsoldEmail(player, tournament)
    )
    
    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return { successful, failed, total: results.length }
  },

  // Complete auction notification workflow
  sendAuctionCompletionNotifications: async (
    tournament: TournamentData,
    teamOwners: TeamOwnerData[],
    soldPlayers: PlayerData[],
    unsoldPlayers: PlayerData[],
    teamPlayersMap: Map<string, PlayerData[]>
  ) => {
    console.log(`Starting auction completion notifications for tournament: ${tournament.name}`)
    
    // Send team rosters to owners
    const ownersResult = await AuctionNotificationService.sendAllTeamRosterEmails(teamOwners, tournament, teamPlayersMap)
    console.log(`Team owner notifications: ${ownersResult.successful}/${ownersResult.total} sent successfully`)
    
    // Send sold notifications to players
    const soldResult = await AuctionNotificationService.sendAllSoldPlayerEmails(soldPlayers, tournament)
    console.log(`Sold player notifications: ${soldResult.successful}/${soldResult.total} sent successfully`)
    
    // Send unsold notifications to players
    const unsoldResult = await AuctionNotificationService.sendAllUnsoldPlayerEmails(unsoldPlayers, tournament)
    console.log(`Unsold player notifications: ${unsoldResult.successful}/${unsoldResult.total} sent successfully`)
    
    return {
      owners: ownersResult,
      soldPlayers: soldResult,
      unsoldPlayers: unsoldResult,
      totalEmailsSent: ownersResult.successful + soldResult.successful + unsoldResult.successful,
      totalEmailsFailed: ownersResult.failed + soldResult.failed + unsoldResult.failed
    }
  }
}

// Mock email sending function - replace with actual email service
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  try {
    // TODO: Integrate with your actual email service (SendGrid, NodeMailer, etc.)
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Content Length: ${html.length} characters`);
    console.log(`Text Content Length: ${text.length} characters`);
    
    // For now, just log the email action
    // In production, replace this with actual email sending logic
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Legacy compatibility function for getApprovalEmailTemplate
export const getApprovalEmailTemplate = (
  type: 'player' | 'owner',
  data: any,
  tournament: any,
  isApproved: boolean
) => {
  if (type === 'player') {
    const template = isApproved 
      ? playerRegistrationTemplates.playerApproved(data, tournament)
      : playerRegistrationTemplates.playerUnsold(data, tournament);
    return template;
  } else {
    const template = isApproved 
      ? teamOwnerTemplates.ownerVerified(data, tournament)
      : teamOwnerTemplates.ownerRegistered(data, tournament);
    return template;
  }
};
