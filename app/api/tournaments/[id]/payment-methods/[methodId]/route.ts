import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - Update tournament payment method
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; methodId: string }> }
) {
  try {
    const { id: tournamentId, methodId } = await params
    const body = await request.json()

    console.log('PUT payment method - Tournament ID:', tournamentId, 'Method ID:', methodId)
    console.log('PUT payment method - Body:', JSON.stringify(body, null, 2))

    const paymentMethod = await prisma.tournamentPaymentMethod.update({
      where: {
        id: methodId,
        tournamentId: tournamentId
      },
      data: {
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
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    console.log('PUT payment method - Success:', paymentMethod.id)

    return NextResponse.json({
      success: true,
      paymentMethod
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete tournament payment method
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; methodId: string }> }
) {
  try {
    const { id: tournamentId, methodId } = await params

    await prisma.tournamentPaymentMethod.delete({
      where: {
        id: methodId,
        tournamentId: tournamentId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
