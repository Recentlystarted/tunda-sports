import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';

// Email sending function (placeholder - in real app you'd use nodemailer)
async function sendTestEmail(smtpSettings: any, testEmail: string) {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, you would use nodemailer:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.secure,
    auth: {
      user: smtpSettings.username,
      pass: smtpSettings.password
    }
  });

  await transporter.sendMail({
    from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
    to: testEmail,
    subject: 'SMTP Test Email - Tunda Sports Club',
    text: 'This is a test email to verify your SMTP configuration is working correctly.',
    html: `
      <h2>SMTP Test Successful</h2>
      <p>This is a test email to verify your SMTP configuration is working correctly.</p>
      <p>If you receive this email, your email settings are properly configured.</p>
      <hr>
      <p><small>Sent from Tunda Sports Club Admin Panel</small></p>
    `
  });
  */
  
  return true;
}

async function readSMTPSettings() {
  try {
    const SMTP_SETTINGS_FILE = join(process.cwd(), 'temp', 'smtp-settings.json');
    
    if (!existsSync(SMTP_SETTINGS_FILE)) {
      throw new Error('SMTP settings not configured');
    }

    const fs = await import('fs');
    const data = await fs.promises.readFile(SMTP_SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Failed to read SMTP settings');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Read SMTP settings
    const smtpSettings = await readSMTPSettings();
    
    if (!smtpSettings.enabled) {
      return NextResponse.json(
        { error: 'Email notifications are disabled' },
        { status: 400 }
      );
    }

    // Validate SMTP settings
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      return NextResponse.json(
        { error: 'SMTP settings are incomplete' },
        { status: 400 }
      );
    }

    // Send test email
    await sendTestEmail(smtpSettings, testEmail);
    
    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    );
  }
}
