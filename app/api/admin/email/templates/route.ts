import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'registration' | 'approval' | 'rejection' | 'notification';
  enabled: boolean;
}

const TEMPLATES_FILE = join(process.cwd(), 'temp', 'email-templates.json');

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'reg-confirmation',
    name: 'Registration Confirmation',
    subject: 'Team Registration Received - {{tournamentName}}',
    content: `Dear {{captainName}},

Thank you for registering your team "{{teamName}}" for {{tournamentName}}.

Your registration has been received and is currently under review. You will receive another email once your registration is approved.

Registration Details:
- Team Name: {{teamName}}
- Captain: {{captainName}}
- Tournament: {{tournamentName}}
- Entry Fee: ₹{{entryFee}}
- Players: {{playerCount}}

If you have any questions, please contact us at the tournament office.

Best regards,
Tunda Sports Club`,
    type: 'registration',
    enabled: true
  },
  {
    id: 'reg-approval',
    name: 'Registration Approved',
    subject: 'Registration Approved - {{tournamentName}}',
    content: `Dear {{captainName}},

Congratulations! Your team "{{teamName}}" has been approved for {{tournamentName}}.

Tournament Details:
- Start Date: {{startDate}}
- Venue: {{venue}}
- Team Name: {{teamName}}

Please ensure all your players are available for the tournament dates. More details about match schedules will be shared soon.

Best regards,
Tunda Sports Club`,
    type: 'approval',
    enabled: true
  },
  {
    id: 'admin-notification',
    name: 'New Registration Alert',
    subject: 'New Team Registration - {{tournamentName}}',
    content: `A new team has registered for {{tournamentName}}.

Team Details:
- Team Name: {{teamName}}
- Captain: {{captainName}}
- Email: {{captainEmail}}
- Phone: {{captainPhone}}
- Players: {{playerCount}}
- Registration Date: {{registrationDate}}

Please review and approve/reject the registration in the admin panel.

Admin Panel: {{adminUrl}}`,
    type: 'notification',
    enabled: true
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

async function readTemplates(): Promise<EmailTemplate[]> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    
    if (!existsSync(TEMPLATES_FILE)) {
      await writeFile(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2));
      return defaultTemplates;
    }

    const fs = await import('fs');
    const data = await fs.promises.readFile(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email templates:', error);
    return defaultTemplates;
  }
}

async function saveTemplates(templates: EmailTemplate[]): Promise<void> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    await writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error saving email templates:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const templates = await readTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newTemplate = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'subject', 'content', 'type'];
    const missingFields = requiredFields.filter(field => !newTemplate[field]?.trim());
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const templates = await readTemplates();
    const template: EmailTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      subject: newTemplate.subject,
      content: newTemplate.content,
      type: newTemplate.type,
      enabled: newTemplate.enabled ?? true
    };

    templates.push(template);
    await saveTemplates(templates);
    
    return NextResponse.json({ 
      success: true,
      template,
      message: 'Email template created successfully'
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedTemplate = await request.json();
    
    if (!updatedTemplate.id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templates = await readTemplates();
    const index = templates.findIndex(t => t.id === updatedTemplate.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    templates[index] = {
      ...templates[index],
      ...updatedTemplate
    };

    await saveTemplates(templates);
    
    return NextResponse.json({ 
      success: true,
      template: templates[index],
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}
