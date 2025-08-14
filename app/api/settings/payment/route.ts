import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // First try to get from database
    const paymentSettings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    })
    
    if (paymentSettings) {
      return NextResponse.json({
        upiId: paymentSettings.upiId,
        upiMobile: paymentSettings.upiMobile,
        bankAccountName: paymentSettings.bankAccountName,
        bankAccountNumber: paymentSettings.bankAccountNumber,
        bankName: paymentSettings.bankName,
        ifscCode: paymentSettings.ifscCode,
        branchName: paymentSettings.branchName,
        qrCodeUrl: paymentSettings.qrCodeUrl
      })
    }

    // Fallback to temp file if no database settings
    const tempFilePath = join(process.cwd(), 'temp', 'payment-settings.json')
    if (existsSync(tempFilePath)) {
      try {
        const tempData = readFileSync(tempFilePath, 'utf-8')
        const settings = JSON.parse(tempData)
        return NextResponse.json(settings)
      } catch (error) {
        console.error('Error reading temp payment settings:', error)
      }
    }
    
    // Return empty if no settings exist anywhere
    return NextResponse.json({
      upiId: "",
      upiMobile: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
      qrCodeUrl: null
    })
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Deactivate existing settings
    await prisma.paymentSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })
    
    // Create new active settings
    const updatedSettings = await prisma.paymentSettings.create({
      data: {
        upiId: body.upiId || "tundacricket@paytm",
        upiMobile: body.upiMobile || "+91 9876543210",
        bankAccountName: body.bankAccountName || "Tunda Sports Club",
        bankAccountNumber: body.bankAccountNumber || "123456789012",
        bankName: body.bankName || "State Bank of India",
        ifscCode: body.ifscCode || "SBIN0001234",
        branchName: body.branchName || "Tunda Branch",
        qrCodeUrl: body.qrCodeUrl,
        isActive: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: {
        upiId: updatedSettings.upiId,
        upiMobile: updatedSettings.upiMobile,
        bankAccountName: updatedSettings.bankAccountName,
        bankAccountNumber: updatedSettings.bankAccountNumber,
        bankName: updatedSettings.bankName,
        ifscCode: updatedSettings.ifscCode,
        branchName: updatedSettings.branchName,
        qrCodeUrl: updatedSettings.qrCodeUrl
      }
    })
  } catch (error) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
