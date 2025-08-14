import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAdminSession } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for email configuration
const ConfigurationSchema = z.object({
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Valid email is required'),
  replyTo: z.string().email('Valid reply-to email is required'),
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1).max(65535, 'Invalid port number'),
  smtpUser: z.string().min(1, 'SMTP username is required'),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean(),
  includeFooter: z.boolean(),
  footerText: z.string().optional(),
  logoUrl: z.string().optional(),
});

// POST - Save email configuration
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
    
    // ALWAYS ensure only one active configuration exists
    // First, find any existing active configuration
    const existingConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });
    
    // If password is not provided, preserve the existing one
    if (!body.smtpPassword) {
      if (existingConfig?.smtpPassword) {
        body.smtpPassword = existingConfig.smtpPassword;
      } else {
        // No existing password and none provided - this is an error
        return NextResponse.json(
          { error: 'SMTP password is required for new configuration' },
          { status: 400 }
        );
      }
    }
    
    const validatedData = ConfigurationSchema.parse(body);

    let configuration;
    let operationType;

    // Use database transaction to ensure atomicity
    configuration = await prisma.$transaction(async (tx) => {
      if (existingConfig) {
        // UPDATE the existing single configuration
        operationType = 'updated';
        return await tx.emailConfiguration.update({
          where: { id: existingConfig.id },
          data: {
            ...validatedData,
            isActive: true,
            updatedAt: new Date()
          }
        });
      } else {
        // CREATE the first configuration
        operationType = 'created';
        
        // Ensure no orphaned active configs exist before creating
        await tx.emailConfiguration.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
        
        return await tx.emailConfiguration.create({
          data: {
            ...validatedData,
            isActive: true
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Email configuration ${operationType} successfully. Only one active configuration exists.`,
      configuration,
      operationType
    });

  } catch (error: unknown) {
    console.error('Email configuration save error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          type: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Handle Prisma database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message?: string };
      
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { 
            error: 'Database constraint violation',
            details: 'Unique constraint failed',
            type: 'DATABASE_ERROR'
          },
          { status: 409 }
        );
      }

      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { 
            error: 'Record not found',
            details: 'Configuration record not found',
            type: 'DATABASE_ERROR'
          },
          { status: 404 }
        );
      }
    }

    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to save email configuration',
        details: errorMessage,
        type: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
