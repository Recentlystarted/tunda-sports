import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAdminSession } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch email settings
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

    // Fetch email configuration
    const configuration = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    // Fetch email recipients
    const recipients = await prisma.adminEmailRecipient.findMany({
      where: { isActive: true },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      configuration,
      recipients
    });

  } catch (error) {
    console.error('Email settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}
