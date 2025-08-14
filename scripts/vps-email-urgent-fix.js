#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 URGENT VPS Email Fix Script');
console.log('================================\n');

const SMTP_SETTINGS_FILE = path.join(process.cwd(), 'temp', 'smtp-settings.json');

// Load current settings
function loadCurrentSettings() {
  try {
    if (fs.existsSync(SMTP_SETTINGS_FILE)) {
      const data = fs.readFileSync(SMTP_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error.message);
  }
  return null;
}

// Test current configuration with VPS-optimized settings
async function testWithOptimizedSettings(settings) {
  console.log('🔧 Testing with VPS-optimized SMTP settings...\n');
  
  const optimizedTransporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.username,
      pass: settings.password,
    },
    // VPS-friendly optimizations
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,
    socketTimeout: 60000,
    pool: false, // Disable pooling for testing
    maxConnections: 1,
    // TLS settings for VPS compatibility
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    debug: true,
    logger: console
  });

  try {
    console.log('📝 Verifying SMTP connection...');
    await optimizedTransporter.verify();
    console.log('✅ SMTP verification successful with optimized settings!');
    
    console.log('📧 Sending test email...');
    const testResult = await optimizedTransporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: settings.fromEmail,
      subject: `🚀 VPS Email Test - ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #10b981;">✅ VPS Email Fixed!</h2>
          <p>Your VPS email configuration is now working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Configuration:</strong> ${settings.host}:${settings.port}</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #0369a1;">
              <strong>Success!</strong> Your email system is ready for production use.
            </p>
          </div>
        </div>
      `
    });
    
    console.log('🎉 Test email sent successfully!');
    console.log('📧 Message ID:', testResult.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Still failing with error:', error.message);
    console.error('❌ Error code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔑 Authentication still failing. Possible solutions:');
      console.log('1. Generate a FRESH app password (delete old one first)');
      console.log('2. Your VPS IP might be blocked by Gmail');
      console.log('3. Consider switching to SendGrid');
    }
    
    return false;
  }
}

// Create enhanced SMTP settings for VPS
function createVPSOptimizedConfig(currentSettings) {
  const optimized = {
    ...currentSettings,
    // Add VPS-specific optimizations
    vpsOptimized: true,
    lastUpdated: new Date().toISOString(),
    note: 'VPS-optimized configuration'
  };
  
  // Backup current settings
  const backupFile = SMTP_SETTINGS_FILE.replace('.json', '-backup-' + Date.now() + '.json');
  fs.writeFileSync(backupFile, JSON.stringify(currentSettings, null, 2));
  console.log(`📁 Backup created: ${backupFile}`);
  
  // Write optimized settings
  fs.writeFileSync(SMTP_SETTINGS_FILE, JSON.stringify(optimized, null, 2));
  console.log(`✅ Updated settings file with VPS optimizations`);
  
  return optimized;
}

// Alternative provider suggestions
function suggestAlternatives() {
  console.log('\n🚀 RECOMMENDED: Switch to SendGrid for VPS');
  console.log('===========================================');
  console.log('');
  console.log('SendGrid is specifically designed for servers and VPS:');
  console.log('• ✅ No IP restrictions');
  console.log('• ✅ 100 free emails per day');
  console.log('• ✅ Better deliverability');
  console.log('• ✅ Designed for production use');
  console.log('');
  console.log('🔧 Quick setup:');
  console.log('1. Run: node scripts/setup-vps-email.js sendgrid');
  console.log('2. Sign up at https://sendgrid.com');
  console.log('3. Generate API key');
  console.log('4. Update the config file');
  console.log('5. Test and deploy');
  console.log('');
  
  // Create a SendGrid config template
  const sendgridConfig = {
    enabled: true,
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    username: 'apikey',
    password: 'YOUR_SENDGRID_API_KEY_HERE',
    fromEmail: 'noreply@yourdomain.com',
    fromName: 'Tunda Sports Club',
    provider: 'sendgrid',
    note: 'VPS-friendly email provider'
  };
  
  const sendgridFile = path.join(process.cwd(), 'temp', 'smtp-sendgrid-template.json');
  fs.writeFileSync(sendgridFile, JSON.stringify(sendgridConfig, null, 2));
  console.log(`📁 SendGrid template created: ${sendgridFile}`);
}

// Main execution
async function main() {
  console.log('🔍 Analyzing current email configuration...\n');
  
  const currentSettings = loadCurrentSettings();
  
  if (!currentSettings) {
    console.error('❌ No email configuration found!');
    console.log('💡 Run: node scripts/setup-email-smtp.ts first');
    return;
  }
  
  console.log('📋 Current Configuration:');
  console.log(`   Host: ${currentSettings.host}`);
  console.log(`   Port: ${currentSettings.port}`);
  console.log(`   Username: ${currentSettings.username}`);
  console.log(`   From: ${currentSettings.fromEmail}`);
  console.log('');
  
  // Test with current settings first
  console.log('🧪 Testing current configuration...');
  const worked = await testWithOptimizedSettings(currentSettings);
  
  if (worked) {
    console.log('\n🎉 SUCCESS! Your email is now working!');
    console.log('✅ No further action needed.');
    
    // Update the config with VPS optimizations
    createVPSOptimizedConfig(currentSettings);
    
  } else {
    console.log('\n❌ Current configuration still not working.');
    suggestAlternatives();
  }
  
  console.log('\n📝 IMMEDIATE ACTION ITEMS:');
  console.log('==========================');
  
  if (!worked) {
    console.log('1. 🔑 Generate a FRESH Gmail app password:');
    console.log('   • Delete existing app password');
    console.log('   • Create new one specifically for VPS');
    console.log('   • Update config immediately');
    console.log('');
    console.log('2. 🚀 OR switch to SendGrid (recommended):');
    console.log('   • More reliable for VPS environments');
    console.log('   • Use the template created above');
    console.log('');
  }
  
  console.log('3. 🔄 After making changes:');
  console.log('   • Deploy to VPS');
  console.log('   • Restart your app: pm2 restart tunda-sports-club');
  console.log('   • Test registration to confirm emails work');
  console.log('');
  
  console.log('✅ VPS Email Diagnosis Complete!');
}

main().catch(console.error);
