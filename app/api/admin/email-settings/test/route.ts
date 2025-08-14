import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateAdminSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// POST - Test email configuration
export async function POST(request: NextRequest) {
  let sessionValidation: any;
  let testEmail: string | undefined;
  
  try {
    // Validate admin session
    sessionValidation = await validateAdminSession(request);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can test email settings
    if (sessionValidation.admin?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { configuration, testEmail: emailToTest } = body;
    testEmail = emailToTest;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }// Create transporter with provided configuration
    const transporter = nodemailer.createTransport({
      host: configuration.smtpHost,
      port: configuration.smtpPort,
      secure: configuration.smtpSecure,
      auth: {
        user: configuration.smtpUser,
        pass: configuration.smtpPassword,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    // Send test email
    const testEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: #2563eb; margin: 0;">🏏 Tunda Sports Club</h1>
          <h2 style="color: #059669; margin: 10px 0;">Email Configuration Test</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">✅ Test Successful!</h3>
            <p style="color: #374151;">
              Your email configuration is working correctly. This test email was sent from your Tunda Sports Club admin panel.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h4 style="color: #1f2937; margin-top: 0;">Configuration Details:</h4>
              <ul style="color: #374151; text-align: left; margin: 0;">
                <li><strong>From:</strong> ${configuration.fromName} &lt;${configuration.fromEmail}&gt;</li>
                <li><strong>SMTP Host:</strong> ${configuration.smtpHost}</li>
                <li><strong>SMTP Port:</strong> ${configuration.smtpPort}</li>
                <li><strong>Secure:</strong> ${configuration.smtpSecure ? 'Yes (SSL/TLS)' : 'No'}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              You can now be confident that email notifications will be delivered successfully.
            </p>
          </div>
          
          ${configuration.includeFooter ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ${configuration.footerText || '© 2025 Tunda Sports Club. All rights reserved.'}
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const mailOptions = {
      from: `${configuration.fromName} <${configuration.fromEmail}>`,
      to: testEmail,
      subject: 'Tunda Sports Club - Email Configuration Test',
      html: testEmailContent,
      replyTo: configuration.replyTo,
    };

    await transporter.sendMail(mailOptions);

    // Log the test email
    await prisma.emailLog.create({
      data: {
        to: testEmail,
        subject: 'Tunda Sports Club - Email Configuration Test',
        content: testEmailContent,
        emailType: 'SYSTEM_ALERT',
        status: 'SENT',
        sentAt: new Date(),
        adminId: sessionValidation.admin?.id,      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Email test error:', error);
    
    // Log the failed test email
    try {
      await prisma.emailLog.create({
        data: {
          to: testEmail || 'unknown',
          subject: 'Tunda Sports Club - Email Configuration Test',
          content: 'Test email failed',
          emailType: 'SYSTEM_ALERT',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          adminId: sessionValidation.admin?.id,
        }
      });
    } catch (logError) {
      console.error('Failed to log test email error:', logError);
    }

    return NextResponse.json(
      { error: `Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
