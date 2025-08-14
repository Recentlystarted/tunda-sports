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

// GET - Fetch email recipients
export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can access email settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const recipients = await prisma.adminEmailRecipient.findMany({
      where: { isActive: true },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      recipients
    });

  } catch (error) {
    console.error('Email recipients fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email recipients' },
      { status: 500 }
    );
  }
}

// POST - Add new email recipient
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = RecipientSchema.parse(body);

    // Check if email already exists
    const existingRecipient = await prisma.adminEmailRecipient.findFirst({
      where: {
        email: validatedData.email,
        isActive: true
      }
    });

    if (existingRecipient) {
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
          isActive: true 
        },
        data: { isPrimary: false }
      });
    }

    // Create new recipient
    const recipient = await prisma.adminEmailRecipient.create({
      data: {
        ...validatedData,
        addedBy: sessionValidation.admin?.id || 'system'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email recipient added successfully',
      recipient
    });

  } catch (error) {
    console.error('Email recipient add error:', error);
    
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
      { error: 'Failed to add email recipient' },
      { status: 500 }
    );
  }
}
