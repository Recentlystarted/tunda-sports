import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// In a real application, you would store this in a database
// For now, we'll use a simple JSON file storage
const SETTINGS_FILE = join(process.cwd(), 'temp', 'payment-settings.json');

interface PaymentSettings {
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
}

const defaultSettings: PaymentSettings = {
  upiId: '',
  upiMobile: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
  ifscCode: '',
  branchName: '',
  qrCodeUrl: null
};

async function ensureDirectoryExists(dir: string) {
  try {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

async function readSettings(): Promise<PaymentSettings> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    
    if (!existsSync(SETTINGS_FILE)) {
      await writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }

    const fs = await import('fs');
    const data = await fs.promises.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading payment settings:', error);
    return defaultSettings;
  }
}

async function saveSettings(settings: PaymentSettings): Promise<void> {
  try {
    await ensureDirectoryExists(join(process.cwd(), 'temp'));
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving payment settings:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // Make all fields optional - users can save partial information
    // Only validate that if UPI is provided, both upiId and upiMobile are provided
    // Only validate that if bank details are provided, all bank fields are provided
    
    const hasUpiData = settings.upiId?.trim() || settings.upiMobile?.trim();
    const hasBankData = settings.bankAccountName?.trim() || settings.bankAccountNumber?.trim() || 
                       settings.bankName?.trim() || settings.ifscCode?.trim() || settings.branchName?.trim();
    
    // Validate UPI fields if any UPI data is provided
    if (hasUpiData) {
      const upiFields = ['upiId', 'upiMobile'];
      const missingUpiFields = upiFields.filter(field => !settings[field]?.trim());
      
      if (missingUpiFields.length > 0) {
        return NextResponse.json(
          { error: `For UPI payments, please provide: ${missingUpiFields.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    // Validate bank fields if any bank data is provided
    if (hasBankData) {
      const bankFields = ['bankAccountName', 'bankAccountNumber', 'bankName', 'ifscCode', 'branchName'];
      const missingBankFields = bankFields.filter(field => !settings[field]?.trim());
      
      if (missingBankFields.length > 0) {
        return NextResponse.json(
          { error: `For bank transfers, please provide: ${missingBankFields.join(', ')}` },
          { status: 400 }
        );
      }
    }

    await saveSettings(settings);
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to save payment settings' },
      { status: 500 }
    );
  }
}
