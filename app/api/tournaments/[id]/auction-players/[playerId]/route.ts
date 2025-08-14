import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getApprovalEmailTemplate } from '@/lib/emailTemplates'
import { sendEmail } from '@/lib/emailService'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const body = await request.json()
    const { auctionStatus, basePrice, soldPrice, auctionTeamId, auctionRound, entryFeePaid, specialSkills } = body

    const player = await prisma.auctionPlayer.findUnique({
      where: { 
        id: params.playerId,
        tournamentId: params.id
      }
    })

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (auctionStatus) {
      updateData.auctionStatus = auctionStatus
    }

    if (basePrice !== undefined) {
      updateData.basePrice = basePrice
    }

    if (soldPrice !== undefined) {
      updateData.soldPrice = soldPrice
    }

    if (auctionTeamId !== undefined) {
      updateData.auctionTeamId = auctionTeamId
    }

    if (auctionRound !== undefined) {
      updateData.auctionRound = auctionRound
    }

    // Handle payment status update
    if (entryFeePaid !== undefined) {
      updateData.entryFeePaid = entryFeePaid
    }

    // Still support specialSkills for backward compatibility
    if (specialSkills !== undefined) {
      updateData.specialSkills = specialSkills
    }

    const updatedPlayer = await prisma.auctionPlayer.update({
      where: { id: params.playerId },
      data: updateData,
      include: {
        auctionTeam: true,
        tournament: true
      }
    })

    // Send email if status changed to approved/rejected
    if (auctionStatus && ['APPROVED', 'AVAILABLE', 'REJECTED'].includes(auctionStatus) && updatedPlayer.email) {
      const isApproved = auctionStatus === 'APPROVED' || auctionStatus === 'AVAILABLE';
      
      const template = getApprovalEmailTemplate(
        'player',
        {
          name: updatedPlayer.name,
          email: updatedPlayer.email,
          phone: updatedPlayer.phone || undefined,
          position: updatedPlayer.position || undefined
        },
        {
          ...updatedPlayer.tournament,
          startDate: updatedPlayer.tournament.startDate.toISOString(),
          endDate: updatedPlayer.tournament.endDate?.toISOString(),
          auctionDate: updatedPlayer.tournament.auctionDate?.toISOString(),
          description: updatedPlayer.tournament.description || undefined
        },
        isApproved
      );

      await sendEmail({
        to: updatedPlayer.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    }

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    })

  } catch (error) {
    console.error('Error updating auction player:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update player' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    await prisma.auctionPlayer.delete({
      where: { 
        id: params.playerId,
        tournamentId: params.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Player removed successfully'
    })

  } catch (error) {
    console.error('Error deleting auction player:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete player' },
      { status: 500 }
    )
  }
}
