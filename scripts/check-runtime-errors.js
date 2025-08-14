// Script to check for runtime errors in development
const puppeteer = require('puppeteer');

async function checkRuntimeErrors() {
  console.log('🔍 Checking for runtime errors...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️ Console Warning:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('💥 Page Error:', error.message);
    });
    
    console.log('🚀 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    // Check for specific error patterns
    const hydrationErrors = errors.filter(err => 
      err.includes('hydration') || 
      err.includes('Hydration') ||
      err.includes('rendered more hooks') ||
      err.includes('Cannot update a component while rendering')
    );
    
    console.log('\n📊 Summary:');
    console.log(`Total errors: ${errors.length}`);
    console.log(`Hydration errors: ${hydrationErrors.length}`);
    
    if (hydrationErrors.length > 0) {
      console.log('\n🔥 Hydration/Hook Errors:');
      hydrationErrors.forEach(err => console.log('  -', err));
    }
    
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('Error during runtime check:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  checkRuntimeErrors();
}

module.exports = { checkRuntimeErrors };
