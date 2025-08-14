import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET tournament payment methods
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tournamentId } = await params

    // Get tournament-specific payment methods
    const paymentMethods = await prisma.tournamentPaymentMethod.findMany({
      where: {
        tournamentId,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    })

    // If no tournament-specific methods, fall back to global settings
    if (paymentMethods.length === 0) {
      const globalSettings = await prisma.paymentSettings.findFirst({
        where: { isActive: true }
      })

      if (globalSettings) {
        return NextResponse.json([{
          id: 'global',
          methodName: 'General Registration',
          methodType: 'GENERAL_REGISTRATION',
          upiId: globalSettings.upiId,
          upiMobile: globalSettings.upiMobile,
          qrCodeUrl: globalSettings.qrCodeUrl,
          bankAccountName: globalSettings.bankAccountName,
          bankAccountNumber: globalSettings.bankAccountNumber,
          bankName: globalSettings.bankName,
          ifscCode: globalSettings.ifscCode,
          branchName: globalSettings.branchName,
          amount: 0,
          currency: 'INR',
          isActive: true
        }])
      }
    }

    return NextResponse.json(paymentMethods)
  } catch (err) {
    console.error('Error fetching tournament payment methods:', err)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create tournament payment method
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()

    const paymentMethod = await prisma.tournamentPaymentMethod.create({
      data: {
        tournamentId,
        methodName: body.methodName,
        methodType: body.methodType,
        upiId: body.upiId,
        upiMobile: body.upiMobile,
        qrCodeUrl: body.qrCodeUrl,
        bankAccountName: body.bankAccountName,
        bankAccountNumber: body.bankAccountNumber,
        bankName: body.bankName,
        ifscCode: body.ifscCode,
        branchName: body.branchName,
        amount: body.amount || 0,
        currency: body.currency || 'INR',
        displayOrder: body.displayOrder || 0,
        description: body.description,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      paymentMethod
    })
  } catch (err) {
    console.error('Error creating payment method:', err)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}