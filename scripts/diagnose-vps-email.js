#!/usr/bin/env node

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

console.log('🔧 VPS Email Diagnostic Tool\n');

// Function to load SMTP settings
function loadSMTPSettings() {
  const settingsPath = path.join(process.cwd(), 'temp', 'smtp-settings.json');
  
  if (fs.existsSync(settingsPath)) {
    console.log('✅ Found SMTP settings file:', settingsPath);
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      console.log('📋 SMTP Configuration:');
      console.log('   Host:', settings.host);
      console.log('   Port:', settings.port);
      console.log('   Secure:', settings.secure);
      console.log('   Username:', settings.username ? '***masked***' : 'NOT SET');
      console.log('   Password:', settings.password ? '***masked***' : 'NOT SET');
      console.log('   From Email:', settings.fromEmail);
      return settings;
    } catch (error) {
      console.error('❌ Error parsing SMTP settings:', error.message);
      return null;
    }
  } else {
    console.error('❌ SMTP settings file not found:', settingsPath);
    return null;
  }
}

// Function to test SMTP connection
async function testSMTPConnection(settings) {
  console.log('\n🔌 Testing SMTP Connection...\n');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: settings.password,
      },
      debug: true, // Enable debug logging
      logger: true, // Enable detailed logging
    });

    console.log('📝 Verifying SMTP connection...');
    
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test sending email
    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: settings.fromEmail, // Send to yourself for testing
      subject: 'VPS Email Test - ' + new Date().toISOString(),
      text: 'This is a test email from your VPS to verify email configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 VPS Email Test Successful!</h2>
          <p>This email confirms that your VPS email configuration is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>From VPS:</strong> ${process.env.HOSTNAME || 'Unknown'}</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('❌ Error Code:', error.code);
    console.error('❌ Error Response:', error.response);
    
    // Provide specific troubleshooting advice
    if (error.code === 'EAUTH') {
      console.log('\n🚨 AUTHENTICATION FAILED - Possible Causes:');
      console.log('1. 🔑 Incorrect username/password');
      console.log('2. 🔐 App password not generated (for Gmail/Outlook)');
      console.log('3. 🌍 IP address blocked by email provider');
      console.log('4. 🔒 Two-factor authentication not properly configured');
      console.log('5. 📧 "Less secure app access" disabled (Gmail legacy)');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🚨 CONNECTION FAILED - Possible Causes:');
      console.log('1. 🚪 Port blocked by firewall');
      console.log('2. 🌐 Network connectivity issues');
      console.log('3. 🏠 Wrong SMTP host/port combination');
    }
  }
}

// Function to check environment differences
function checkEnvironment() {
  console.log('\n🖥️ Environment Information:');
  console.log('   Node.js Version:', process.version);
  console.log('   Platform:', process.platform);
  console.log('   Hostname:', process.env.HOSTNAME || 'Unknown');
  console.log('   Working Directory:', process.cwd());
  
  // Check if we're in production
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  // Check network connectivity
  console.log('\n🌐 Testing Network Connectivity...');
  
  const dns = require('dns');
  const hosts = ['smtp.gmail.com', 'smtp-mail.outlook.com', 'smtp.mail.yahoo.com'];
  
  hosts.forEach(host => {
    dns.lookup(host, (err, address) => {
      if (err) {
        console.log(`❌ ${host}: ${err.message}`);
      } else {
        console.log(`✅ ${host}: ${address}`);
      }
    });
  });
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🔍 Starting VPS Email Diagnostics...\n');
  
  // Check environment
  checkEnvironment();
  
  // Load and test SMTP settings
  const settings = loadSMTPSettings();
  if (settings && settings.enabled) {
    await testSMTPConnection(settings);
  } else {
    console.log('❌ SMTP not enabled or settings not found');
  }
  
  console.log('\n📋 Diagnostic Complete!');
  console.log('\n💡 If issues persist, try:');
  console.log('1. Regenerate app password');
  console.log('2. Check VPS firewall settings');
  console.log('3. Verify email provider allows connections from your VPS IP');
  console.log('4. Test with a different email provider');
}

// Run diagnostics
runDiagnostics().catch(console.error);
