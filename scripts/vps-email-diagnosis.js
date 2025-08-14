#!/usr/bin/env node

// VPS Email Quick Diagnostic and Fix Script
// This script diagnoses and fixes common VPS email issues

const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 VPS EMAIL EMERGENCY DIAGNOSTIC & FIX TOOL 🚨\n');
console.log('Diagnosing why Gmail SMTP works locally but fails on VPS...\n');

// Load environment variables
require('dotenv').config();

async function runDiagnostic() {
  const results = {
    environment: {},
    network: {},
    smtp: {},
    recommendations: []
  };

  // 1. Environment Check
  console.log('🔍 STEP 1: Environment Analysis');
  console.log('=' .repeat(50));
  
  results.environment = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    isVPS: await checkIfVPS(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  console.log(`📊 Node.js: ${results.environment.nodeVersion}`);
  console.log(`🖥️  Platform: ${results.environment.platform} (${results.environment.arch})`);
  console.log(`🌐 VPS Detected: ${results.environment.isVPS ? 'YES' : 'NO'}`);
  console.log(`⏰ Timezone: ${results.environment.timezone}\n`);

  // 2. Network Connectivity Tests
  console.log('🌐 STEP 2: Network Connectivity Tests');
  console.log('=' .repeat(50));
  
  results.network = await testNetworkConnectivity();
  
  // 3. SMTP Configuration Tests
  console.log('\n📧 STEP 3: SMTP Configuration Tests');
  console.log('=' .repeat(50));
  
  results.smtp = await testSMTPConfigurations();
  
  // 4. Generate Recommendations
  console.log('\n💡 STEP 4: Analysis & Recommendations');
  console.log('=' .repeat(50));
  
  results.recommendations = generateRecommendations(results);
  
  // 5. Auto-Fix Common Issues
  console.log('\n🔧 STEP 5: Auto-Fix Attempts');
  console.log('=' .repeat(50));
  
  await attemptAutoFix(results);
  
  // Save diagnostic report
  const reportPath = path.join(process.cwd(), 'vps-email-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Diagnostic report saved: ${reportPath}`);
  
  return results;
}

async function checkIfVPS() {
  try {
    // Check common VPS indicators
    const indicators = [
      '/proc/vz', // OpenVZ
      '/proc/bc', // Virtuozzo
      '/sys/class/dmi/id/product_name' // System info
    ];
    
    for (const indicator of indicators) {
      if (fs.existsSync(indicator)) return true;
    }
    
    // Check hostname patterns
    const hostname = require('os').hostname();
    const vpsPatterns = ['vps', 'server', 'cloud', 'digital', 'linode', 'vultr'];
    return vpsPatterns.some(pattern => hostname.toLowerCase().includes(pattern));
  } catch {
    return false;
  }
}

async function testNetworkConnectivity() {
  const results = {};
  
  console.log('🔌 Testing network connectivity...');
  
  // Test DNS resolution
  try {
    require('dns').lookup('smtp.gmail.com', (err, address) => {
      if (err) {
        results.dns = { status: 'FAILED', error: err.message };
      } else {
        results.dns = { status: 'OK', ip: address };
      }
    });
  } catch (error) {
    results.dns = { status: 'FAILED', error: error.message };
  }
  
  // Test port connectivity
  const ports = [25, 465, 587, 2525];
  results.ports = {};
  
  for (const port of ports) {
    try {
      console.log(`  📡 Testing port ${port}...`);
      
      // Use netcat equivalent in Node.js
      const net = require('net');
      const socket = new net.Socket();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('Timeout'));
        }, 5000);
        
        socket.connect(port, 'smtp.gmail.com', () => {
          clearTimeout(timeout);
          socket.destroy();
          results.ports[port] = 'OPEN';
          console.log(`    ✅ Port ${port}: OPEN`);
          resolve();
        });
        
        socket.on('error', (err) => {
          clearTimeout(timeout);
          results.ports[port] = `BLOCKED: ${err.message}`;
          console.log(`    ❌ Port ${port}: BLOCKED`);
          resolve();
        });
      });
    } catch (error) {
      results.ports[port] = `ERROR: ${error.message}`;
      console.log(`    ⚠️  Port ${port}: ERROR`);
    }
  }
  
  return results;
}

async function testSMTPConfigurations() {
  const results = {};
  
  console.log('📨 Testing SMTP configurations...');
  
  // Test current environment variables
  const currentConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
  
  console.log(`  📋 Current config: ${currentConfig.user}@${currentConfig.host}:${currentConfig.port}`);
  
  // Test various SMTP configurations
  const testConfigs = [
    {
      name: 'Current Config',
      ...currentConfig
    },
    {
      name: 'VPS Optimized - Port 587',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: currentConfig.user,
      pass: currentConfig.pass,
      tls: { rejectUnauthorized: false }
    },
    {
      name: 'VPS Optimized - Port 465',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: currentConfig.user,
      pass: currentConfig.pass,
      tls: { rejectUnauthorized: false }
    },
    {
      name: 'VPS Optimized - Alternative',
      host: 'smtp.gmail.com',
      port: 2587, // Some VPS providers use alternative ports
      secure: false,
      user: currentConfig.user,
      pass: currentConfig.pass,
      tls: { rejectUnauthorized: false }
    }
  ];
  
  for (const config of testConfigs) {
    try {
      console.log(`  🧪 Testing: ${config.name}...`);
      
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        ...(config.tls && { tls: config.tls })
      });
      
      await transporter.verify();
      results[config.name] = { status: 'SUCCESS' };
      console.log(`    ✅ ${config.name}: SUCCESS`);
      
    } catch (error) {
      results[config.name] = { 
        status: 'FAILED', 
        error: error.message,
        code: error.code 
      };
      console.log(`    ❌ ${config.name}: ${error.message}`);
    }
  }
  
  return results;
}

function generateRecommendations(results) {
  const recommendations = [];
  
  // Analyze results and generate specific recommendations
  
  // Check if any SMTP config worked
  const smtpSuccess = Object.values(results.smtp).some(r => r.status === 'SUCCESS');
  
  if (!smtpSuccess) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'All Gmail SMTP configurations failed',
      solution: 'Switch to VPS-friendly email provider (SendGrid, Mailgun, or Brevo)',
      action: 'Run: node scripts/setup-vps-email.js'
    });
  }
  
  // Check port issues
  const blockedPorts = Object.entries(results.network.ports || {})
    .filter(([port, status]) => status.includes('BLOCKED'))
    .map(([port]) => port);
  
  if (blockedPorts.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: `SMTP ports blocked: ${blockedPorts.join(', ')}`,
      solution: 'Contact VPS provider to unblock SMTP ports or use email API',
      action: 'Switch to SendGrid/Mailgun API instead of SMTP'
    });
  }
  
  // VPS-specific recommendations
  if (results.environment.isVPS) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Running on VPS - Gmail SMTP often restricted',
      solution: 'Use dedicated email service for better deliverability',
      action: 'Consider SendGrid, Mailgun, or domain-based SMTP'
    });
  }
  
  // Authentication recommendations
  const authFailures = Object.values(results.smtp)
    .filter(r => r.error && r.error.includes('authentication failed'));
  
  if (authFailures.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Gmail authentication failed',
      solution: 'Verify App Password setup and 2FA configuration',
      action: 'Generate new Gmail App Password and update environment variables'
    });
  }
  
  return recommendations;
}

async function attemptAutoFix(results) {
  console.log('🔧 Attempting automatic fixes...');
  
  // Fix 1: Update environment variables with VPS-optimized settings
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add VPS-optimized SMTP settings
    const vpsOptimizations = `
# VPS-Optimized Email Settings (Auto-generated)
SMTP_CONNECTION_TIMEOUT=60000
SMTP_SOCKET_TIMEOUT=60000
SMTP_POOL=false
SMTP_MAX_CONNECTIONS=1
SMTP_TLS_REJECT_UNAUTHORIZED=false
`;
    
    if (!envContent.includes('VPS-Optimized Email Settings')) {
      fs.writeFileSync(envPath, envContent + vpsOptimizations);
      console.log('  ✅ Added VPS-optimized SMTP settings to .env.local');
    }
    
  } catch (error) {
    console.log('  ⚠️  Could not update environment file:', error.message);
  }
  
  // Fix 2: Create SendGrid migration script if Gmail fails
  const smtpFailures = Object.values(results.smtp).filter(r => r.status === 'FAILED');
  
  if (smtpFailures.length === Object.keys(results.smtp).length) {
    console.log('  🔄 All Gmail SMTP tests failed - preparing SendGrid migration...');
    
    try {
      const migrationScript = `
// Auto-generated SendGrid migration script
const sgMail = require('@sendgrid/mail');

// Setup instructions:
// 1. Sign up at https://sendgrid.com
// 2. Create API key
// 3. Add to .env.local: SENDGRID_API_KEY=your_api_key
// 4. Run: npm install @sendgrid/mail

console.log('📧 SendGrid setup ready - follow instructions in comments');
`;
      
      fs.writeFileSync(path.join(process.cwd(), 'setup-sendgrid-migration.js'), migrationScript);
      console.log('  ✅ Created SendGrid migration script');
      
    } catch (error) {
      console.log('  ⚠️  Could not create migration script:', error.message);
    }
  }
}

// Main execution
async function main() {
  try {
    const results = await runDiagnostic();
    
    console.log('\n🎯 SUMMARY & NEXT STEPS');
    console.log('=' .repeat(50));
    
    if (results.recommendations.length === 0) {
      console.log('✅ No major issues found! Email should be working.');
    } else {
      console.log('⚠️  Issues found. Recommendations:');
      results.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   💡 Solution: ${rec.solution}`);
        console.log(`   🔧 Action: ${rec.action}`);
      });
    }
    
    console.log('\n🚀 QUICK FIXES TO TRY:');
    console.log('1. Switch to SendGrid: node scripts/setup-vps-email.js');
    console.log('2. Test current setup: node scripts/test-email.js');
    console.log('3. Check VPS firewall: sudo ufw status');
    console.log('4. Contact VPS support about SMTP ports');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runDiagnostic };
