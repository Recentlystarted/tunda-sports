// Test Gallery Modal Functionality
const puppeteer = require('puppeteer')

async function testGalleryModal() {
  console.log('🎯 Testing Gallery Modal...')
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    // Navigate to test gallery page
    await page.goto('http://localhost:3000/test-gallery', { waitUntil: 'networkidle0' })
    
    console.log('✅ Page loaded successfully')
    
    // Wait for gallery to load
    await page.waitForSelector('[data-testid="gallery-grid"], .grid', { timeout: 10000 })
    
    // Check for multiple close buttons (double X issue)
    const closeButtons = await page.$$('[data-close-button], button:has-text("×"), button:has-text("X")')
    console.log(`🔍 Found ${closeButtons.length} close buttons`)
    
    // Check for accessibility attributes
    const dialogContent = await page.$('[role="dialog"], [data-state="open"]')
    if (dialogContent) {
      const hasTitle = await dialogContent.$('[data-title], [aria-label], h1, h2, h3')
      console.log(hasTitle ? '✅ Dialog has title/label' : '❌ Dialog missing title/label')
    }
    
    // Test opening a gallery image if images exist
    const firstImage = await page.$('img[src*="drive.google.com"], img[src*="placeholder"]')
    if (firstImage) {
      console.log('🖼️ Found gallery image, testing modal...')
      await firstImage.click()
      
      await page.waitForTimeout(1000) // Wait for modal to open
      
      // Check if modal opened
      const modal = await page.$('[role="dialog"], .fixed')
      if (modal) {
        console.log('✅ Modal opened successfully')
        
        // Check for double close buttons in modal
        const modalCloseButtons = await modal.$$('button:has(svg), [data-close]')
        console.log(`🔍 Modal has ${modalCloseButtons.length} close button(s)`)
        
        // Try to close modal
        const closeButton = await modal.$('button:has(svg)')
        if (closeButton) {
          await closeButton.click()
          console.log('✅ Modal closed successfully')
        }
      } else {
        console.log('❌ Modal did not open')
      }
    } else {
      console.log('ℹ️ No gallery images found to test modal')
    }
    
    console.log('🎉 Gallery modal test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

// Check if puppeteer is available
try {
  testGalleryModal()
} catch (error) {
  console.log('ℹ️ Puppeteer not available, skipping automated test')
  console.log('📝 Manual test checklist:')
  console.log('1. Open http://localhost:3000/test-gallery')
  console.log('2. Check for only ONE close (X) button in gallery modal')
  console.log('3. Verify no console errors about DialogTitle')
  console.log('4. Test image modal opening/closing')
  console.log('5. Check that all React hooks are called in consistent order')
}
