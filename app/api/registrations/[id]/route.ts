import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RegistrationStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { sendTeamApprovalEmail, sendTeamRejectionEmail } from '@/lib/emailService';

const prisma = new PrismaClient();

// Validation schema for registration updates
const RegistrationUpdateSchema = z.object({
  action: z.enum(['approve', 'reject', 'updatePayment', 'updateNotes']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  adminId: z.string().min(1, 'Admin ID is required'),
  // Payment fields
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL']).optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE']).optional()
});

interface Params {
  id: string; // registration ID
}

// Approve, reject, or update registration details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const registrationId = params.id;
    console.log('🔍 Processing registration update for ID:', registrationId);
    
    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    // Validate input data
    const validatedData = RegistrationUpdateSchema.parse(body);
    console.log('✅ Validation passed:', validatedData);

    // Find the registration
    const registration = await prisma.teamRegistration.findUnique({
      where: { id: registrationId },
      include: {
        team: true,
        tournament: {
          select: {
            name: true,
            maxTeams: true
          }
        }
      }
    });

    console.log('🔍 Found registration:', registration ? 'Yes' : 'No');
    
    if (!registration) {
      console.error('❌ Registration not found for ID:', registrationId);
      return NextResponse.json(
        { error: 'Registration not found', id: registrationId },
        { status: 404 }
      );
    }

    // Handle different action types
    let updateData: any = {};

    if (validatedData.action === 'approve' || validatedData.action === 'reject') {
      // Check if registration is still pending for approval/rejection
      if (registration.status !== RegistrationStatus.PENDING) {
        return NextResponse.json(
          { error: `Registration is already ${registration.status.toLowerCase()}` },
          { status: 400 }
        );
      }

      // If approving, check tournament capacity
      if (validatedData.action === 'approve' && registration.tournament.maxTeams) {
        const approvedCount = await prisma.teamRegistration.count({
          where: {
            tournamentId: registration.tournamentId,
            status: { in: [RegistrationStatus.CONFIRMED] }
          }
        });

        if (approvedCount >= registration.tournament.maxTeams) {
          return NextResponse.json(
            { error: 'Tournament has reached maximum capacity' },
            { status: 400 }
          );
        }
      }

      // Update registration status
      updateData.notes = validatedData.notes;

      if (validatedData.action === 'approve') {
        updateData.status = RegistrationStatus.CONFIRMED;
        updateData.approvedBy = validatedData.adminId;
        updateData.approvedAt = new Date();
      } else {
        updateData.status = RegistrationStatus.REJECTED;
        updateData.rejectedBy = validatedData.adminId;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = validatedData.rejectionReason;
      }
    } else if (validatedData.action === 'updatePayment') {
      // Update payment information
      console.log('💳 Updating payment info...');
      
      if (validatedData.paymentStatus) {
        console.log('📊 Setting payment status to:', validatedData.paymentStatus);
        updateData.paymentStatus = validatedData.paymentStatus;
      }
      if (validatedData.paymentMethod) {
        console.log('💰 Setting payment method to:', validatedData.paymentMethod);
        updateData.paymentMethod = validatedData.paymentMethod;
      }
      
      console.log('📝 Payment update data:', updateData);
    } else if (validatedData.action === 'updateNotes') {
      // Update admin notes
      updateData.notes = validatedData.notes;
    }    // Perform the update
    console.log('🔄 Attempting database update with data:', updateData);
    
    const updatedRegistration = await prisma.teamRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        team: true,
        tournament: {
          select: {
            name: true,
            venue: true,
            startDate: true,
            entryFee: true
          }
        }
      }
    });

    console.log('✅ Database update successful');

    // Send email notification only for approval/rejection
    if (validatedData.action === 'approve' || validatedData.action === 'reject') {
      try {
        if (validatedData.action === 'approve') {
          await sendTeamApprovalEmail(
            updatedRegistration.contactEmail,
            updatedRegistration.team.captainName || 'Team Captain',
            updatedRegistration.team.name,
            updatedRegistration.tournament.name
          );
        } else {
          // Use the new template-based rejection email function
          await sendTeamRejectionEmail(
            updatedRegistration.contactEmail,
            updatedRegistration.team.captainName || 'Team Captain',
            updatedRegistration.team.name,
            updatedRegistration.tournament.name,
            validatedData.rejectionReason
          );
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the approval process if email fails
      }
    }

    // Determine success message based on action
    let successMessage;
    switch (validatedData.action) {
      case 'approve':
        successMessage = 'Registration approved successfully';
        break;
      case 'reject':
        successMessage = 'Registration rejected successfully';
        break;
      case 'updatePayment':
        successMessage = 'Payment information updated successfully';
        break;
      case 'updateNotes':
        successMessage = 'Admin notes updated successfully';
        break;
      default:
        successMessage = 'Registration updated successfully';
    }    return NextResponse.json({
      success: true,
      message: successMessage,
      registration: {
        id: updatedRegistration.id,
        teamName: updatedRegistration.team.name,
        tournamentName: updatedRegistration.tournament.name,
        status: updatedRegistration.status,
        contactEmail: updatedRegistration.contactEmail,
        paymentStatus: updatedRegistration.paymentStatus,
        paymentMethod: updatedRegistration.paymentMethod,
        notes: updatedRegistration.notes,
        approvedAt: updatedRegistration.approvedAt,
        rejectedAt: updatedRegistration.rejectedAt,
        rejectionReason: updatedRegistration.rejectionReason
      }
    });  } catch (error) {
    console.error('💥 Registration update error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          received: error.errors
        },
        { status: 400 }
      );
    }

    // Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🗄️ Database error code:', (error as any).code);
      
      if ((error as any).code === 'P2025') {
        return NextResponse.json(
          { error: 'Registration not found in database', code: 'P2025' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to update registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get registration details for approval
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const registrationId = params.id;

    const registration = await prisma.teamRegistration.findUnique({
      where: { id: registrationId },
      include: {
        team: {
          include: {
            players: true
          }
        },
        tournament: {
          select: {
            name: true,
            venue: true,
            startDate: true,
            entryFee: true,
            teamSize: true,
            maxTeams: true,
            ageLimit: true
          }
        }
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registration: {
        id: registration.id,
        status: registration.status,
        registrationDate: registration.registrationDate,
        contactEmail: registration.contactEmail,
        contactPhone: registration.contactPhone,
        paymentAmount: registration.paymentAmount,
        paymentMethod: registration.paymentMethod,
        paymentStatus: registration.paymentStatus,
        specialRequests: registration.specialRequests,
        notes: registration.notes,
        approvedAt: registration.approvedAt,
        rejectedAt: registration.rejectedAt,
        rejectionReason: registration.rejectionReason
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
        captainName: registration.team.captainName,
        captainPhone: registration.team.captainPhone,
        captainEmail: registration.team.captainEmail,
        homeGround: registration.team.homeGround,
        description: registration.team.description,
        players: registration.team.players
      },
      tournament: registration.tournament
    });

  } catch (error) {
    console.error('Error fetching registration details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration details' },
      { status: 500 }
    );
  }
}
