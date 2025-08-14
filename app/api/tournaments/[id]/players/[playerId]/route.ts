import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update auction player status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const tournamentId = params.id;
    const playerId = params.playerId;
    const body = await request.json();
    const { action, soldPrice, auctionTeamId } = body;

    let updateData: any = {};

    switch (action) {
      case 'MARK_SOLD':
        updateData.auctionStatus = 'SOLD';
        if (soldPrice) updateData.soldPrice = soldPrice;
        if (auctionTeamId) updateData.auctionTeamId = auctionTeamId;
        break;
      
      case 'MARK_UNSOLD':
        updateData.auctionStatus = 'UNSOLD';
        updateData.auctionTeamId = null;
        break;
      
      case 'MARK_AVAILABLE':
        updateData.auctionStatus = 'AVAILABLE';
        updateData.soldPrice = null;
        updateData.auctionTeamId = null;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedPlayer = await prisma.auctionPlayer.update({
      where: {
        id: playerId,
        tournamentId
      },
      data: updateData,
      include: {
        tournament: {
          select: {
            name: true
          }
        },
        auctionTeam: {
          select: {
            name: true,
            ownerName: true
          }
        }
      }
    });

    // Send email notification based on action
    try {
      if (action === 'MARK_SOLD' && updatedPlayer.auctionTeam) {
        // Send email to player about being selected
        await sendPlayerAssignmentEmail(updatedPlayer);
      } else if (action === 'MARK_UNSOLD') {
        // Send email to player about being unsold
        await sendPlayerUnsoldEmail(updatedPlayer);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Player ${action.toLowerCase()} successfully`,
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating auction player:', error);
    return NextResponse.json(
      { error: 'Failed to update auction player' },
      { status: 500 }
    );
  }
}

// Email notification functions
async function sendPlayerAssignmentEmail(player: any) {
  // This would integrate with your email service
  console.log(`Sending assignment email to ${player.email} for team ${player.auctionTeam.name}`);
  
  // Example email content:
  const emailContent = {
    to: player.email,
    subject: `🎉 Congratulations! You've been selected for ${player.auctionTeam.name}`,
    html: `
      <h2>Congratulations ${player.name}!</h2>
      <p>We're excited to inform you that you have been selected in the auction for:</p>
      <ul>
        <li><strong>Team:</strong> ${player.auctionTeam.name}</li>
        <li><strong>Team Owner:</strong> ${player.auctionTeam.ownerName}</li>
        <li><strong>Tournament:</strong> ${player.tournament.name}</li>
        ${player.soldPrice ? `<li><strong>Auction Price:</strong> ₹${player.soldPrice}</li>` : ''}
      </ul>
      <p>Further details about practice sessions and match schedules will be shared soon.</p>
      <p>Best of luck for the tournament!</p>
    `
  };
  
  // Implement actual email sending here
}

async function sendPlayerUnsoldEmail(player: any) {
  console.log(`Sending unsold notification email to ${player.email}`);
  
  const emailContent = {
    to: player.email,
    subject: `Thank you for registering - ${player.tournament.name}`,
    html: `
      <h2>Thank you for registering, ${player.name}</h2>
      <p>We appreciate your interest in participating in ${player.tournament.name}.</p>
      <p>Unfortunately, you were not selected in this auction round. However, there might be opportunities for:</p>
      <ul>
        <li>Last-minute team additions</li>
        <li>Replacement players if needed</li>
        <li>Future tournaments</li>
      </ul>
      <p>We'll keep you informed about any future opportunities.</p>
      <p>Thank you for your understanding and continued support!</p>
    `
  };
  
  // Implement actual email sending here
}
