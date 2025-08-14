import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - Get specific person
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        section: true
      }
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      person
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch person' },
      { status: 500 }
    )
  }
}

// PUT - Update person
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      role,
      designation,
      bio,
      email,
      phone,
      profileImage,
      linkedin,
      twitter,
      facebook,
      department,
      joinDate,
      isActive,
      sortOrder,
      showOnLanding,
      showContact,
      sectionId
    } = body

    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        name,
        role,
        designation,
        bio,
        email,
        phone,
        profileImage,
        linkedin,
        twitter,
        facebook,
        department,
        joinDate: joinDate ? new Date(joinDate) : null,
        isActive,
        sortOrder,
        showOnLanding,
        showContact,
        sectionId
      },
      include: {
        section: true
      }
    })

    return NextResponse.json({
      success: true,
      person
    })
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update person' },
      { status: 500 }
    )
  }
}

// DELETE - Delete person
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.person.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Person deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete person' },
      { status: 500 }
    )
  }
}
