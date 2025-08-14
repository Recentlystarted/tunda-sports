import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface QRGenerationRequest {
  upiId: string;
  mobile: string;
  amount: number;
  tournamentName: string;
  paymentType: string;
  organizationName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: QRGenerationRequest = await request.json();
    
    if (!data.upiId || !data.mobile || !data.amount) {
      return NextResponse.json(
        { error: 'UPI ID, mobile number, and amount are required' },
        { status: 400 }
      );
    }

    // Create UPI payment string
    const merchantName = data.organizationName || 'Tunda Sports Club';
    const transactionNote = `${data.tournamentName} - ${data.paymentType}`;
    const upiString = `upi://pay?pa=${data.upiId}&pn=${encodeURIComponent(merchantName)}&mc=0000&tid=${Date.now()}&tr=${encodeURIComponent(transactionNote)}&tn=${encodeURIComponent(transactionNote)}&am=${data.amount}&cu=INR`;
    
    // Generate QR code as PNG buffer (without canvas - serverless friendly)
    const qrBuffer = await QRCode.toBuffer(upiString, {
      type: 'png',
      width: 512,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Save file
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'qr-codes');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const safeTournamentName = data.tournamentName.replace(/[^a-zA-Z0-9]/g, '-');
    const safePaymentType = data.paymentType.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `qr-${safeTournamentName}-${safePaymentType}-${timestamp}.png`;
    const filePath = join(uploadsDir, fileName);
    
    await writeFile(filePath, qrBuffer);
    
    const fileUrl = `/uploads/qr-codes/${fileName}`;
    
    return NextResponse.json({
      success: true,
      qrCodeUrl: fileUrl,
      upiString,
      paymentDetails: {
        merchantName,
        amount: data.amount,
        currency: 'INR',
        note: transactionNote
      },
      message: 'QR code generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
