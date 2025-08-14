import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail, sendTeamOwnerApprovalWithAuctionLink } from '@/lib/emailService';

const prisma = new PrismaClient();

// Update team owner status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ownerId: string }> }
) {
  try {
    const { id: tournamentId, ownerId } = await params;
    const body = await request.json();
    const { action } = body;

    let updateData: any = {};

    switch (action) {
      case 'VERIFY':
        updateData.verified = true;
        // Generate auction token if not exists
        const existingOwner = await prisma.teamOwner.findUnique({
          where: { id: ownerId },
          select: { auctionToken: true }
        });
        if (!existingOwner?.auctionToken) {
          updateData.auctionToken = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        break;
      
      case 'MARK_PAID':
        updateData.entryFeePaid = true;
        break;
      
      case 'UNMARK_PAID':
        updateData.entryFeePaid = false;
        break;
      
      case 'REJECT':
        updateData.verified = false;
        updateData.entryFeePaid = false;
        updateData.auctionToken = null; // Remove auction token when rejecting
        break;
      
      case 'REGENERATE_TOKEN':
        // Generate new auction token
        updateData.auctionToken = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedOwner = await prisma.teamOwner.update({
      where: {
        id: ownerId,
        tournamentId
      },
      data: updateData,
      include: {
        tournament: {
          select: {
            name: true,
            teamEntryFee: true
          }
        }
      }
    });

    // Send email notification based on action
    try {
      if (action === 'VERIFY' && updatedOwner.auctionToken) {
        await sendOwnerVerificationEmail(updatedOwner);
      } else if (action === 'REJECT') {
        await sendOwnerRejectionEmail(updatedOwner);
      } else if (action === 'MARK_PAID') {
        await sendOwnerPaymentConfirmationEmail(updatedOwner);
      } else if (action === 'REGENERATE_TOKEN' && updatedOwner.auctionToken) {
        await sendOwnerVerificationEmail(updatedOwner);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Team owner ${action.toLowerCase()} successfully`,
      owner: updatedOwner
    });

  } catch (error) {
    console.error('Error updating team owner:', error);
    return NextResponse.json(
      { error: 'Failed to update team owner' },
      { status: 500 }
    );
  }
}

// Email notification functions
async function sendOwnerVerificationEmail(owner: any) {
  console.log(`Sending verification email to ${owner.ownerEmail}`);
  
  try {
    // Use the existing email service function
    const emailSent = await sendTeamOwnerApprovalWithAuctionLink(
      owner, 
      {
        id: owner.tournamentId,
        name: owner.tournament.name,
        teamEntryFee: owner.tournament.teamEntryFee
      },
      owner.auctionToken
    );
    
    if (!emailSent) {
      console.error('Failed to send verification email');
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

async function sendOwnerRejectionEmail(owner: any) {
  console.log(`Sending rejection email to ${owner.ownerEmail}`);
  
  try {
    const emailSent = await sendEmail({
      to: owner.ownerEmail,
      subject: `Registration Status Update - ${owner.tournament.name}`,
      html: `
        <h2>Registration Status Update</h2>
        <p>Dear ${owner.ownerName},</p>
        <p>Thank you for your interest in participating as a team owner in ${owner.tournament.name}.</p>
        <p>Unfortunately, we are unable to proceed with your registration at this time.</p>
        <p>This could be due to:</p>
        <ul>
          <li>Tournament capacity reached</li>
          <li>Incomplete documentation</li>
          <li>Other administrative reasons</li>
        </ul>
        <p>If you have any questions, please contact the tournament organizers.</p>
        <p>We appreciate your interest and hope to see you in future tournaments!</p>
      `
    });
    
    if (!emailSent) {
      console.error('Failed to send rejection email');
    }
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
}

async function sendOwnerPaymentConfirmationEmail(owner: any) {
  console.log(`Sending payment confirmation email to ${owner.ownerEmail}`);
  
  try {
    const emailSent = await sendEmail({
      to: owner.ownerEmail,
      subject: `💰 Payment Confirmed - ${owner.tournament.name}`,
      html: `
        <h2>Payment Confirmed!</h2>
        <p>Dear ${owner.ownerName},</p>
        <p>Your payment has been successfully confirmed for:</p>
        <ul>
          <li><strong>Tournament:</strong> ${owner.tournament.name}</li>
          <li><strong>Team Name:</strong> ${owner.teamName}</li>
          <li><strong>Amount:</strong> ₹${owner.tournament.teamEntryFee || 0}</li>
        </ul>
        <p>You are now eligible to participate in the auction process.</p>
        <p>Auction details and schedule will be shared soon.</p>
        <p>Thank you for your participation!</p>
      `
    });
    
    if (!emailSent) {
      console.error('Failed to send payment confirmation email');
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}
