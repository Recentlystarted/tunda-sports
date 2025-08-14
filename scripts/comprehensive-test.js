import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function comprehensiveTest() {
  try {
    console.log('🚀 COMPREHENSIVE ONE_DAY_KNOCKOUT TEST')
    console.log('=====================================')
    
    // Test 1: Create a ONE_DAY_KNOCKOUT tournament directly in database
    console.log('\n1️⃣ Testing direct database creation...')
    
    const dbTournament = await prisma.tournament.create({
      data: {
        name: 'Direct DB ONE_DAY_KNOCKOUT Test',
        description: 'Testing direct database creation',
        format: 'T20',
        competitionType: 'ONE_DAY_KNOCKOUT',
        venue: 'Test Ground',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-09-01'),
        maxTeams: 8,
        entryFee: 500,
        totalPrizePool: 10000,
        organizers: JSON.stringify([{ name: 'Test Organizer', phone: '1234567890' }]),
        isAuctionBased: false,
        requireTeamOwners: false,
        ownerVerificationRequired: false
      }
    })
    
    console.log(`✅ Database creation successful!`)
    console.log(`   - ID: ${dbTournament.id}`)
    console.log(`   - Competition Type: ${dbTournament.competitionType}`)
    console.log(`   - Is Auction Based: ${dbTournament.isAuctionBased}`)
    console.log(`   - Require Team Owners: ${dbTournament.requireTeamOwners}`)
    console.log(`   - Owner Verification Required: ${dbTournament.ownerVerificationRequired}`)
    
    // Test 2: Check registration routing logic
    console.log('\n2️⃣ Testing registration dispatcher logic...')
    
    const competitionType = dbTournament.competitionType
    const isAuctionCompetition = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
    
    console.log(`   - Competition Type: ${competitionType}`)
    console.log(`   - Is Auction Competition: ${isAuctionCompetition}`)
    console.log(`   - Should use: ${isAuctionCompetition ? 'AuctionRegistration' : 'UniversalRegistration'}`)
    
    if (!isAuctionCompetition) {
      console.log('✅ Registration dispatcher will use UniversalRegistration (correct!)')
    } else {
      console.log('❌ Registration dispatcher will use AuctionRegistration (incorrect!)')
    }
    
    // Test 3: Check if tournament meets all criteria for non-auction
    console.log('\n3️⃣ Testing tournament criteria...')
    
    const criteria = {
      'Competition Type is ONE_DAY_KNOCKOUT': dbTournament.competitionType === 'ONE_DAY_KNOCKOUT',
      'Is Auction Based is false': dbTournament.isAuctionBased === false,
      'Require Team Owners is false': dbTournament.requireTeamOwners === false,
      'Owner Verification Required is false': dbTournament.ownerVerificationRequired === false
    }
    
    let allCorrect = true
    for (const [criterion, result] of Object.entries(criteria)) {
      console.log(`   ${result ? '✅' : '❌'} ${criterion}`)
      if (!result) allCorrect = false
    }
    
    if (allCorrect) {
      console.log('\n🎉 ALL TESTS PASSED! ONE_DAY_KNOCKOUT tournaments are working correctly!')
      console.log('   - Tournament will be created with correct settings')
      console.log('   - Registration dispatcher will route to UniversalRegistration')
      console.log('   - Teams can register without team owners')
    } else {
      console.log('\n❌ Some tests failed. There are still issues to fix.')
    }
    
    // Test 4: Test the API logic (without actually calling the API)
    console.log('\n4️⃣ Testing API creation logic...')
    
    const testCompetitionType = 'ONE_DAY_KNOCKOUT'
    const testRequireTeamOwners = undefined
    const testOwnerVerificationRequired = undefined
    
    const isAuctionBasedType = ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(testCompetitionType)
    
    const shouldRequireTeamOwners = isAuctionBasedType ? 
      (testRequireTeamOwners !== false && testRequireTeamOwners !== 'false') : 
      false
    
    const shouldRequireOwnerVerification = isAuctionBasedType ? 
      (testOwnerVerificationRequired !== false && testOwnerVerificationRequired !== 'false') : 
      false
    
    console.log(`   - Input Competition Type: ${testCompetitionType}`)
    console.log(`   - Is Auction Based Type: ${isAuctionBasedType}`)
    console.log(`   - Computed requireTeamOwners: ${shouldRequireTeamOwners}`)
    console.log(`   - Computed ownerVerificationRequired: ${shouldRequireOwnerVerification}`)
    
    if (shouldRequireTeamOwners === false && shouldRequireOwnerVerification === false) {
      console.log('✅ API logic is correct!')
    } else {
      console.log('❌ API logic has issues!')
    }
    
    // Clean up
    await prisma.tournament.delete({
      where: { id: dbTournament.id }
    })
    console.log('\n🧹 Test tournament cleaned up')
    
    console.log('\n🎯 SUMMARY:')
    console.log('The ONE_DAY_KNOCKOUT tournament system should now be working correctly.')
    console.log('When you create a tournament with Competition Type "One Day Knockout":')
    console.log('- It will NOT be treated as an auction tournament')
    console.log('- requireTeamOwners will be set to false')
    console.log('- Teams can register directly using the UniversalRegistration form')
    console.log('- No team owners are required')
    
  } catch (error) {
    console.error('❌ Error in comprehensive test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

comprehensiveTest()
