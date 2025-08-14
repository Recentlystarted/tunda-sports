import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer';
  notifications: string[];
}

const RECIPIENTS_FILE = join(process.cwd(), 'temp', 'email-recipients.json');

const defaultRecipients: EmailRecipient[] = [
  {
    id: 'default-admin',
    email: 'admin@tundasports.com',
    name: 'Tournament Admin',
    role: 'admin',
    notifications: ['registration', 'approval', 'rejection']
  }
];

async function ensureDirectoryExists(dir: string) {
  try {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

async function readRecipients(): Promise<EmailRecipient[]> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    
    if (!existsSync(RECIPIENTS_FILE)) {
      await writeFile(RECIPIENTS_FILE, JSON.stringify(defaultRecipients, null, 2));
      return defaultRecipients;
    }

    const fs = await import('fs');
    const data = await fs.promises.readFile(RECIPIENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email recipients:', error);
    return defaultRecipients;
  }
}

async function saveRecipients(recipients: EmailRecipient[]): Promise<void> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    await writeFile(RECIPIENTS_FILE, JSON.stringify(recipients, null, 2));
  } catch (error) {
    console.error('Error saving email recipients:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const recipients = await readRecipients();
    return NextResponse.json(recipients);
  } catch (error) {
    console.error('Error fetching email recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email recipients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newRecipient = await request.json();
    
    // Validate required fields
    const requiredFields = ['email', 'name', 'role'];
    const missingFields = requiredFields.filter(field => !newRecipient[field]?.trim());
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipient.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const recipients = await readRecipients();
    
    // Check for duplicate email
    if (recipients.some(r => r.email.toLowerCase() === newRecipient.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 400 }
      );
    }

    const recipient: EmailRecipient = {
      id: Date.now().toString(),
      email: newRecipient.email,
      name: newRecipient.name,
      role: newRecipient.role,
      notifications: newRecipient.notifications || ['registration']
    };

    recipients.push(recipient);
    await saveRecipients(recipients);
    
    return NextResponse.json({ 
      success: true,
      recipient,
      message: 'Email recipient added successfully'
    });
  } catch (error) {
    console.error('Error adding email recipient:', error);
    return NextResponse.json(
      { error: 'Failed to add email recipient' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedRecipient = await request.json();
    
    if (!updatedRecipient.id) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const recipients = await readRecipients();
    const index = recipients.findIndex(r => r.id === updatedRecipient.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check for duplicate email (excluding current recipient)
    if (recipients.some((r, i) => i !== index && r.email.toLowerCase() === updatedRecipient.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Email address already exists' },
        { status: 400 }
      );
    }

    recipients[index] = {
      ...recipients[index],
      ...updatedRecipient
    };

    await saveRecipients(recipients);
    
    return NextResponse.json({ 
      success: true,
      recipient: recipients[index],
      message: 'Email recipient updated successfully'
    });
  } catch (error) {
    console.error('Error updating email recipient:', error);
    return NextResponse.json(
      { error: 'Failed to update email recipient' },
      { status: 500 }
    );
  }
}
