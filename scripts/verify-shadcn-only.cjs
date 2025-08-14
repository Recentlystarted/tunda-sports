#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read globals.css
const globalsPath = path.join(__dirname, '../app/globals.css');
const globalsContent = fs.readFileSync(globalsPath, 'utf8');

// Check for non-Shadcn colors
const nonShadcnPatterns = [
  /#[0-9a-fA-F]{3,6}/, // Hex colors
  /rgb\(/, // RGB colors
  /rgba\(/, // RGBA colors
  /hsl\([^v]/, // HSL colors that don't use CSS variables
  /hsla\(/, // HSLA colors
  /color:\s*[a-z]+(?:\s|;|$)/, // Named colors like 'blue', 'red', etc.
  /background:\s*[a-z]+(?:\s|;|$)/, // Background with named colors
  /border-color:\s*[a-z]+(?:\s|;|$)/, // Border color with named colors
];

const errors = [];
const lines = globalsContent.split('\n');

lines.forEach((line, index) => {
  const lineNumber = index + 1;
  
  // Skip lines that are comments or contain CSS variables
  if (line.trim().startsWith('/*') || line.includes('--') || line.trim().startsWith('//')) {
    return;
  }
  
  nonShadcnPatterns.forEach(pattern => {
    if (pattern.test(line)) {
      // Check if it's actually using hsl(var(...)) which is allowed
      if (line.includes('hsl(var(--') || line.includes('transparent') || line.includes('inherit') || line.includes('currentColor')) {
        return;
      }
      
      errors.push({
        line: lineNumber,
        content: line.trim(),
        issue: 'Contains non-Shadcn color'
      });
    }
  });
});

console.log('🎨 Shadcn UI Color Compliance Check');
console.log('================================\n');

if (errors.length === 0) {
  console.log('✅ All CSS uses only Shadcn UI colors!');
  console.log('✅ No custom colors detected.');
} else {
  console.log(`❌ Found ${errors.length} potential issues:\n`);
  
  errors.forEach(error => {
    console.log(`Line ${error.line}: ${error.issue}`);
    console.log(`   ${error.content}\n`);
  });
  
  console.log('Please ensure all colors use hsl(var(--color-name)) format.');
}

// Check for external CSS imports
const layoutPath = path.join(__dirname, '../app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('mobile-fixes.css')) {
    console.log('❌ Found mobile-fixes.css import in layout.tsx');
  } else {
    console.log('✅ No external CSS imports found in layout.tsx');
  }
}

console.log('\n🎯 Summary:');
console.log(`- Checked ${lines.length} lines in globals.css`);
console.log(`- Found ${errors.length} potential color issues`);
console.log('- Only Shadcn UI color variables should be used');
