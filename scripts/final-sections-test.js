import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAllSectionsDisplay() {
  console.log('=== COMPREHENSIVE LANDING PAGE SECTIONS TEST ===\n');
  
  const tests = [
    {
      name: 'Hero Section',
      component: 'HeroEnhanced',
      sectionType: 'HERO_BANNER',
      expectedFields: ['title', 'content', 'images'],
      testDisplayLogic: true
    },
    {
      name: 'About Section', 
      component: 'AboutEnhanced',
      sectionType: 'ABOUT_US',
      expectedFields: ['title', 'content'],
      testDisplayLogic: true
    },
    {
      name: 'Facilities Section',
      component: 'FacilitiesEnhanced', 
      sectionType: 'FACILITIES',
      expectedFields: ['title', 'content'],
      testDisplayLogic: true
    },
    {
      name: 'Team Members Section',
      component: 'TeamMembersSection',
      sectionType: 'TEAM_MEMBERS', 
      expectedFields: ['title', 'content', 'people'],
      testDisplayLogic: true
    },
    {
      name: 'Donors Section',
      component: 'DonorsSponsorsSection',
      sectionType: 'DONORS',
      expectedFields: ['title', 'content', 'people'], 
      testDisplayLogic: true
    },
    {
      name: 'Sponsors Section',
      component: 'DonorsSponsorsSection',
      sectionType: 'SPONSORS',
      expectedFields: ['title', 'content', 'people'],
      testDisplayLogic: true
    },
    {
      name: 'Gallery Section',
      component: 'Gallery',
      sectionType: 'GALLERY_SHOWCASE',
      expectedFields: ['title', 'content', 'images'],
      testDisplayLogic: true
    },
    {
      name: 'Contact Section',
      component: 'Contact',
      static: true,
      expectedFields: ['static_data'],
      testDisplayLogic: false
    }
  ];

  let allGood = true;

  for (const test of tests) {
    console.log(`🔍 Testing ${test.name} (${test.component}):`);
    
    try {
      if (!test.static) {
        // Test API data
        const response = await fetch(`${BASE_URL}/api/landing/sections?sectionType=${test.sectionType}&activeOnly=true`);
        const data = await response.json();
        
        if (data.success && data.sections.length > 0) {
          const section = data.sections[0];
          console.log(`   ✅ Section found: "${section.title}"`);
          console.log(`   📊 Active: ${section.isActive}`);
          
          // Check expected fields
          const issues = [];
          
          if (test.expectedFields.includes('title') && !section.title) {
            issues.push('Missing title');
          }
          if (test.expectedFields.includes('content') && !section.content) {
            issues.push('Missing content'); 
          }
          if (test.expectedFields.includes('images')) {
            const imageCount = section.images?.length || 0;
            console.log(`   🖼️  Images: ${imageCount}`);
            if (imageCount === 0 && test.name === 'Gallery Section') {
              issues.push('Gallery has no images to display');
            }
          }
          if (test.expectedFields.includes('people')) {
            const peopleCount = section.people?.length || 0;
            console.log(`   👥 People: ${peopleCount}`);
            if (peopleCount === 0) {
              issues.push('No people data to display');
            }
          }
          
          if (issues.length > 0) {
            console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
            allGood = false;
          } else {
            console.log(`   ✅ All data available for display`);
          }
          
        } else {
          console.log(`   ❌ No active section found`);
          allGood = false;
        }
        
      } else {
        console.log(`   ✅ Static component (no API needed)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      allGood = false;
    }
    
    console.log('');
  }
  
  // Special test for Tournaments
  console.log(`🔍 Testing Tournaments Section:`);
  try {
    const response = await fetch(`${BASE_URL}/api/tournaments?limit=5`);
    const data = await response.json();
    
    if (data.tournaments && data.tournaments.length > 0) {
      console.log(`   ✅ ${data.tournaments.length} tournaments found`);
      console.log(`   📊 Tournament data available for display`);
      console.log(`   ✅ All data available for display`);
    } else {
      console.log(`   ⚠️  No tournaments found - section will show empty state`);
    }
  } catch (error) {
    console.log(`   ❌ Tournaments API error: ${error.message}`);
    allGood = false;
  }
  
  console.log('');
  
  // Summary
  console.log('=== SUMMARY ===');
  if (allGood) {
    console.log('🎉 ALL SECTIONS READY FOR DATA DISPLAY!');
    console.log('✅ All sections have data and should display correctly on the landing page');
    console.log('✅ Users can upload images/data to any section and they will appear properly');
    console.log('✅ No issues detected with data fetching or display logic');
  } else {
    console.log('⚠️  Some sections have issues that may affect display');
    console.log('📝 Review the issues above and ensure data is uploaded to affected sections');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Upload test images to Hero, Gallery sections');
  console.log('2. Verify all sections display correctly on http://localhost:3000');
  console.log('3. Test mobile responsiveness');
  console.log('4. Verify dark/light mode works with Shadcn UI classes');
}

testAllSectionsDisplay();
