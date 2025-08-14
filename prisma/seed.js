const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for Tunda Sports Club with MySQL & Enums...')

  // Create admin users with enum roles
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      email: 'admin@tundasportsclub.com',
      password: 'admin123', // In production, hash this password
      role: 'ADMIN', // Enum value
    },
  })

  const superAdmin = await prisma.admin.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      name: 'Mohammed Faruk',
      username: 'omar',
      email: 'info@tundasportsclub.com',
      password: 'Ahmed@312024', // In production, hash this password
      role: 'SUPERADMIN', // Enum value
    },
  })

  console.log('✅ Created admin users:', admin.username, 'and', superAdmin.username)
  // Create sample tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Tunda Cricket Championship 2024',
      description: 'Annual cricket tournament in Tunda village, Kutch district.',
      format: 'T20', // Enum value
      venue: 'Tunda Cricket Ground',
      venueAddress: 'Tunda Village, Kutch District, Gujarat',
      customMapsLink: 'https://maps.app.goo.gl/ZAS2CffMQdNqweqe6',
      multiVenue: false,
      autoArrangeMatches: false,
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-17'),
      registrationDeadline: new Date('2024-07-10'),
      maxTeams: 16,
      entryFee: 2500,
      totalPrizePool: 25000,
      ageLimit: 'Under 35',
      teamSize: 11,
      status: 'UPCOMING', // Enum value
      rules: 'Standard T20 rules apply. Each team must have at least 8 local players.',
      organizers: JSON.stringify([
        { name: 'Village Council', role: 'Tournament Director', contact: '+91-9876543210' },
        { name: 'Sports Committee', role: 'Event Manager', contact: '+91-9876543211' }
      ]),
      winners: JSON.stringify([]),
      otherPrizes: JSON.stringify([])
    },
  })
  console.log('✅ Created tournament:', tournament.name)

  // Create sample teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Tunda Lions',
      description: 'Local cricket team from Tunda village',
      captainName: 'Rajesh Patel',
      captainPhone: '+91 9876543210',
      captainEmail: 'rajesh@email.com',
      homeGround: 'Tunda Ground',
    },
  })

  const team2 = await prisma.team.create({
    data: {
      name: 'Kutch Warriors',
      description: 'District level cricket team',
      captainName: 'Kiran Shah',
      captainPhone: '+91 9876543211',
      captainEmail: 'kiran@email.com',
      homeGround: 'Kutch Stadium',
    },
  })
  console.log('✅ Created teams:', team1.name, 'and', team2.name)

  // Create sample players with enum values
  const players = await Promise.all([
    prisma.player.create({
      data: {
        name: 'Rahul Sharma',
        email: 'rahul@email.com',
        phone: '+91 9876543212',
        position: 'BATSMAN', // Enum value
        battingStyle: 'RIGHT_HANDED', // Enum value
        experience: 'INTERMEDIATE', // Enum value
        teamId: team1.id,
        jerseyNumber: 10,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Amit Singh',
        email: 'amit@email.com',
        phone: '+91 9876543213',
        position: 'BOWLER', // Enum value
        bowlingStyle: 'RIGHT_ARM_FAST', // Enum value
        experience: 'ADVANCED', // Enum value
        teamId: team1.id,
        jerseyNumber: 7,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Vikas Patel',
        email: 'vikas@email.com',
        phone: '+91 9876543214',
        position: 'ALL_ROUNDER', // Enum value
        battingStyle: 'LEFT_HANDED', // Enum value
        bowlingStyle: 'LEFT_ARM_SPIN', // Enum value
        experience: 'PROFESSIONAL', // Enum value
        teamId: team2.id,
        jerseyNumber: 8,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Deepak Kumar',
        email: 'deepak@email.com',
        phone: '+91 9876543215',
        position: 'WICKET_KEEPER', // Enum value
        battingStyle: 'RIGHT_HANDED', // Enum value
        experience: 'INTERMEDIATE', // Enum value
        teamId: team2.id,
        jerseyNumber: 1,
      },
    }),
  ])
  console.log('✅ Created', players.length, 'sample players with enum values')
  // Register teams for tournament with enum values
  const registration1 = await prisma.teamRegistration.create({
    data: {
      tournamentId: tournament.id,
      teamId: team1.id,
      status: 'CONFIRMED', // Enum value
      paymentStatus: 'COMPLETED', // Enum value
      paymentAmount: 2500,
      paymentMethod: 'UPI', // Enum value
      registrationType: 'ADMIN', // Required field
      contactEmail: 'lions@tunda.com',
      contactPhone: '+91-9876543210',
    },
  })
  const registration2 = await prisma.teamRegistration.create({
    data: {
      tournamentId: tournament.id,
      teamId: team2.id,
      status: 'CONFIRMED', // Enum value
      paymentStatus: 'COMPLETED', // Enum value
      paymentAmount: 2500,
      paymentMethod: 'CASH', // Enum value
      registrationType: 'ADMIN', // Required field
      contactEmail: 'warriors@kutch.com',
      contactPhone: '+91-9876543211',
    },
  })
  console.log('✅ Created team registrations with enum values')

  // Create a sample match with enum values
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      matchDate: new Date('2024-07-15T14:00:00'),
      venue: 'Tunda Cricket Ground',
      matchType: 'LEAGUE', // Enum value
      overs: 20,
      status: 'SCHEDULED', // Enum value
    },
  })
  console.log('✅ Created sample match with enum values:', `${team1.name} vs ${team2.name}`)

  console.log('\n🎉 Database seeded successfully with MySQL & Enums!')
  console.log('\n📋 Summary:')
  console.log('- Admin users: admin (ADMIN) / superadmin (SUPERADMIN)')
  console.log('- Tournament:', tournament.name, '- Format:', tournament.format)
  console.log('- Teams:', team1.name, 'and', team2.name)
  console.log('- Players:', players.length, 'with proper enum values')
  console.log('- Match:', `${team1.name} vs ${team2.name}`, '- Type:', match.matchType)
  console.log('\n✨ All data uses proper MySQL enums for type safety!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
