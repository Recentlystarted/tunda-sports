import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get email settings from database or environment variables
    const emailSettings = {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS ? '********' : '', // Hide password
      fromEmail: process.env.FROM_EMAIL || '',
      fromName: process.env.FROM_NAME || 'Tunda Sports Club',
      isConfigured: !!(
        process.env.SMTP_HOST && 
        process.env.SMTP_USER && 
        process.env.SMTP_PASS && 
        process.env.FROM_EMAIL
      )
    };

    return NextResponse.json(emailSettings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      fromEmail,
      fromName
    } = await request.json();

    // In a real application, you would want to store these in a secure way
    // For now, we'll just validate and return success
    // Note: Environment variables can't be changed at runtime in production
    
    const requiredFields = {
      smtpHost,
      smtpUser,
      fromEmail
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate SMTP port
    const port = parseInt(smtpPort);
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Invalid SMTP port' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings validated successfully',
      note: 'To persist these settings, update your environment variables and restart the application'
    });

  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}

// Test email endpoint
export async function PUT(request: NextRequest) {
  try {
    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    // Import sendEmail dynamically to avoid module loading issues
    const { sendEmail } = await import('@/lib/emailService');

    await sendEmail({
      to: testEmail,
      subject: 'Test Email from Tunda Sports Club',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this email, your email settings are working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <hr/>
        <p>Best regards,<br/>Tunda Sports Club System</p>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
