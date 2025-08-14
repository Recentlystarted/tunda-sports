import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

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
    console.log('QR generation request received:', data);
    
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
    
    console.log('Generated UPI string:', upiString);

    // Generate QR code as base64 data URL (no file system needed)
    const qrDataURL = await QRCode.toDataURL(upiString, {
      type: 'image/png',
      width: 512,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for better scanning
    });

    console.log('QR code generated as data URL, length:', qrDataURL.length);
    
    return NextResponse.json({
      success: true,
      qrCodeUrl: qrDataURL, // Base64 data URL instead of file path
      upiString,
      paymentDetails: {
        merchantName,
        amount: data.amount,
        currency: 'INR',
        note: transactionNote,
        organizationName: merchantName
      },
      message: 'QR code generated successfully for Tunda Sports Club'
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
