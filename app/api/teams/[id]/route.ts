import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    // Use a transaction to safely delete team and handle constraints
    await prisma.$transaction(async (tx) => {
      // First, check if team has any matches
      const matchesAsHome = await tx.match.findMany({
        where: { homeTeamId: teamId }
      });
      
      const matchesAsAway = await tx.match.findMany({
        where: { awayTeamId: teamId }
      });

      // If team has matches, prevent deletion
      if (matchesAsHome.length > 0 || matchesAsAway.length > 0) {
        throw new Error(`Cannot delete team. Team is scheduled in ${matchesAsHome.length + matchesAsAway.length} match(es). Please remove the team from all matches first.`);
      }

      // Delete team registrations first (if any)
      await tx.teamRegistration.deleteMany({
        where: { teamId: teamId }
      });

      // Delete all players associated with the team
      await tx.player.deleteMany({
        where: { teamId: teamId }
      });

      // Finally, delete the team
      await tx.team.delete({
        where: { id: teamId }
      });
    });

    return NextResponse.json({ 
      message: 'Team deleted successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    
    // Return specific error message if it's a constraint violation
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 400 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: true,
        tournaments: {
          include: {
            tournament: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.captainName) {
      return NextResponse.json(
        { error: 'Team name and captain name are required' },
        { status: 400 }
      );
    }

    // Use transaction to update team and players
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // Update the team
      const team = await tx.team.update({
        where: { id: teamId },
        data: {
          name: body.name,
          description: body.description || null,
          captainName: body.captainName,
          captainPhone: body.captainPhone || null,
          captainEmail: body.captainEmail || null,
          homeGround: body.homeGround || null,
          logoUrl: body.logoUrl || null,
        },
      });

      // If players are provided, update them
      if (body.players && Array.isArray(body.players)) {
        // Delete existing players
        await tx.player.deleteMany({
          where: { teamId: teamId }
        });

        // Add new/updated players
        if (body.players.length > 0) {
          await tx.player.createMany({
            data: body.players.map((player: any) => ({
              teamId: teamId,
              name: player.name,
              age: player.age || 18,
              position: player.position || 'Batsman',
              experience: player.experience || 'Beginner',
              phone: player.phone || null,
              email: player.email || null,
              isSubstitute: player.isSubstitute || false,
              jerseyNumber: player.jerseyNumber || null
            }))
          });
        }
      }

      // Return updated team with players
      return await tx.team.findUnique({
        where: { id: teamId },
        include: {
          players: true,
          tournaments: {
            include: {
              tournament: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      message: 'Team updated successfully',
      team: updatedTeam,
      success: true
    });
  } catch (error) {
    console.error('Error updating team:', error);
    
    // Return specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}
