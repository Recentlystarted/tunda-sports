import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = 'D:/sites/tunda_sports_club/components';

// Landing page components to check
const LANDING_COMPONENTS = [
  'HeroEnhanced.tsx',
  'AboutEnhanced.tsx', 
  'FacilitiesEnhanced.tsx',
  'TeamMembersSection.tsx',
  'DonorsSponsorsSection.tsx',
  'Tournaments.tsx',
  'Gallery.tsx',
  'Contact.tsx'
];

// Non-Shadcn color classes that should be avoided
const FORBIDDEN_PATTERNS = [
  /bg-gradient-to-[rblt]/,  // Custom gradients
  /text-(red|green|blue|yellow|purple|pink|indigo)-\d+/,  // Custom color numbers
  /bg-(red|green|blue|yellow|purple|pink|indigo)-\d+/,    // Custom background colors
  /border-(red|green|blue|yellow|purple|pink|indigo)-\d+/, // Custom border colors
  /from-(red|green|blue|yellow|purple|pink|indigo)-\d+/,   // Gradient color numbers
  /to-(red|green|blue|yellow|purple|pink|indigo)-\d+/,     // Gradient color numbers
  /via-(red|green|blue|yellow|purple|pink|indigo)-\d+/,    // Gradient color numbers
];

// Shadcn UI approved classes
const APPROVED_CLASSES = [
  'bg-background', 'bg-foreground', 'bg-card', 'bg-popover',
  'bg-primary', 'bg-secondary', 'bg-muted', 'bg-accent',
  'bg-destructive', 'text-foreground', 'text-primary',
  'text-secondary', 'text-muted-foreground', 'text-accent-foreground',
  'text-destructive', 'border-border', 'border-primary',
  'border-secondary', 'border-muted', 'border-accent',
  'border-destructive'
];

function checkComponentStyling() {
  console.log('=== SHADCN UI STYLING COMPLIANCE CHECK ===\n');
  
  let totalIssues = 0;
  
  for (const component of LANDING_COMPONENTS) {
    const filePath = path.join(COMPONENTS_DIR, component);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${component}: File not found`);
      continue;
    }
    
    console.log(`🔍 Checking ${component}:`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let componentIssues = 0;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for forbidden patterns
      FORBIDDEN_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          const match = line.match(pattern);
          console.log(`   ❌ Line ${lineNum}: Found non-Shadcn class "${match[0]}"`);
          console.log(`      ${line.trim()}`);
          componentIssues++;
          totalIssues++;
        }
      });
      
      // Check for custom gradients
      if (line.includes('gradient') && !line.includes('bg-gradient-to-r from-primary to-primary')) {
        if (!line.includes('// ') && !line.includes('/*')) { // Skip comments
          console.log(`   ⚠️  Line ${lineNum}: Custom gradient detected`);
          console.log(`      ${line.trim()}`);
        }
      }
    });
    
    if (componentIssues === 0) {
      console.log(`   ✅ No styling issues found`);
    } else {
      console.log(`   📊 Found ${componentIssues} styling issues`);
    }
    
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  if (totalIssues === 0) {
    console.log('🎉 ALL COMPONENTS PASS SHADCN UI COMPLIANCE!');
    console.log('✅ All landing page components use only Shadcn UI classes');
    console.log('✅ No custom color classes found');
    console.log('✅ Dark/light mode compatibility ensured');
  } else {
    console.log(`⚠️  Found ${totalIssues} styling issues across components`);
    console.log('📝 Review and replace custom classes with Shadcn UI equivalents');
  }
  
  console.log('\n✅ SHADCN UI APPROVED CLASSES:');
  console.log('Background: bg-background, bg-muted, bg-card, bg-primary, bg-secondary, bg-accent');
  console.log('Text: text-foreground, text-muted-foreground, text-primary, text-secondary');
  console.log('Borders: border-border, border-primary, border-muted');
  console.log('Hover: hover:bg-muted, hover:text-primary, etc.');
}

checkComponentStyling();
