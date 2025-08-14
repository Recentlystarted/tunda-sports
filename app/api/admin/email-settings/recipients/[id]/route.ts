import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAdminSession } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for email recipients
const RecipientSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  receiveRegistrations: z.boolean().default(true),
  receiveApprovals: z.boolean().default(true),
  receiveRejections: z.boolean().default(true),
  receiveSystemAlerts: z.boolean().default(true),
  isCC: z.boolean().default(false),
  isBCC: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface Params {
  id: string;
}

// PUT - Update email recipient
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Validate admin session
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can modify email settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const recipientId = params.id;
    const body = await request.json();
    const validatedData = RecipientSchema.parse(body);

    // Check if recipient exists
    const existingRecipient = await prisma.adminEmailRecipient.findUnique({
      where: { id: recipientId }
    });

    if (!existingRecipient) {
      return NextResponse.json(
        { error: 'Email recipient not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (excluding current recipient)
    const duplicateRecipient = await prisma.adminEmailRecipient.findFirst({
      where: {
        email: validatedData.email,
        isActive: true,
        id: { not: recipientId }
      }
    });

    if (duplicateRecipient) {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 400 }
      );
    }

    // If setting as primary, remove primary status from others
    if (validatedData.isPrimary) {
      await prisma.adminEmailRecipient.updateMany({
        where: { 
          isPrimary: true,
          isActive: true,
          id: { not: recipientId }
        },
        data: { isPrimary: false }
      });
    }

    // Update recipient
    const recipient = await prisma.adminEmailRecipient.update({
      where: { id: recipientId },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      message: 'Email recipient updated successfully',
      recipient
    });

  } catch (error) {
    console.error('Email recipient update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update email recipient' },
      { status: 500 }
    );
  }
}

// DELETE - Delete email recipient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Validate admin session
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can modify email settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const recipientId = params.id;

    // Check if recipient exists
    const existingRecipient = await prisma.adminEmailRecipient.findUnique({
      where: { id: recipientId }
    });

    if (!existingRecipient) {
      return NextResponse.json(
        { error: 'Email recipient not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.adminEmailRecipient.update({
      where: { id: recipientId },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Email recipient deleted successfully'
    });

  } catch (error) {
    console.error('Email recipient delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email recipient' },
      { status: 500 }
    );
  }
}
