#!/bin/bash

echo "🚨 VPS Email Quick Fix Script"
echo "============================="
echo ""

# Check if running on VPS
if [ -z "$SSH_CLIENT" ] && [ -z "$SSH_TTY" ]; then
    echo "⚠️  This script is designed for VPS environments"
    echo "💡 Run this on your VPS server, not locally"
    echo ""
fi

echo "🔍 Step 1: Checking VPS IP and connectivity..."

# Get VPS public IP
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")
echo "📍 Your VPS IP: $VPS_IP"

# Test SMTP connectivity
echo ""
echo "🔌 Testing SMTP connectivity..."

# Test Gmail SMTP
timeout 5 bash -c "</dev/tcp/smtp.gmail.com/587" && echo "✅ Gmail SMTP (587) - Reachable" || echo "❌ Gmail SMTP (587) - Blocked"

# Test alternative ports
timeout 5 bash -c "</dev/tcp/smtp.gmail.com/465" && echo "✅ Gmail SMTP (465) - Reachable" || echo "❌ Gmail SMTP (465) - Blocked"

# Test Outlook
timeout 5 bash -c "</dev/tcp/smtp-mail.outlook.com/587" && echo "✅ Outlook SMTP (587) - Reachable" || echo "❌ Outlook SMTP (587) - Blocked"

echo ""
echo "🔍 Step 2: Checking current email configuration..."

CONFIG_FILE="/var/www/tunda-sports-club/temp/smtp-settings.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Found email config file"
    echo "📋 Current settings:"
    cat "$CONFIG_FILE" | jq -r '"Host: " + .host + ", Port: " + (.port|tostring) + ", Username: " + .username'
else
    echo "❌ No email config file found at $CONFIG_FILE"
fi

echo ""
echo "🔍 Step 3: Checking firewall and ports..."

# Check if ufw is active
if command -v ufw &> /dev/null; then
    echo "🛡️  UFW Status:"
    ufw status
    echo ""
fi

# Check if iptables has rules
if command -v iptables &> /dev/null; then
    echo "🛡️  Checking outbound SMTP rules..."
    iptables -L OUTPUT | grep -E "(587|465|25)" || echo "No specific SMTP rules found"
    echo ""
fi

echo "🔍 Step 4: IP Reputation Check..."

# Simple IP reputation check
echo "🌐 Checking if your IP is on any major blacklists..."
echo "   (This is a basic check - some services may still block VPS IPs)"

# Check Spamhaus (simplified)
SPAMHAUS_CHECK=$(dig +short $VPS_IP.zen.spamhaus.org 2>/dev/null)
if [ -n "$SPAMHAUS_CHECK" ]; then
    echo "⚠️  Your IP might be listed on Spamhaus: $SPAMHAUS_CHECK"
else
    echo "✅ IP not found on Spamhaus blacklist"
fi

echo ""
echo "🎯 RECOMMENDED SOLUTIONS:"
echo "========================"
echo ""

echo "🥇 SOLUTION 1: Switch to SendGrid (Recommended)"
echo "   • VPS-friendly SMTP service"
echo "   • 100 free emails per day"
echo "   • No IP restrictions"
echo "   • Command: cd /var/www/tunda-sports-club && node scripts/setup-vps-email.js sendgrid"
echo ""

echo "🥈 SOLUTION 2: Generate Fresh Gmail App Password"
echo "   • Go to Google Account → Security → 2-Step Verification"
echo "   • Delete existing app password"
echo "   • Create NEW app password specifically for VPS"
echo "   • Update config file immediately"
echo ""

echo "🥉 SOLUTION 3: Configure Firewall"
echo "   • Allow outbound SMTP: sudo ufw allow out 587"
echo "   • Allow outbound SMTPS: sudo ufw allow out 465"
echo "   • Reload firewall: sudo ufw reload"
echo ""

echo "🔧 QUICK ACTIONS:"
echo "=================="
echo ""

echo "1. 📧 Test current email config:"
echo "   cd /var/www/tunda-sports-club && node scripts/diagnose-vps-email.js"
echo ""

echo "2. 🚀 Setup SendGrid (best option):"
echo "   cd /var/www/tunda-sports-club && node scripts/setup-vps-email.js sendgrid"
echo ""

echo "3. 🔄 Restart your app after config changes:"
echo "   pm2 restart tunda-sports-club"
echo ""

echo "4. 📊 Check logs after testing:"
echo "   pm2 logs tunda-sports-club --lines 50"
echo ""

echo "✅ Quick Fix Complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Choose and implement one of the solutions above"
echo "   2. Test email functionality"
echo "   3. Monitor logs for any remaining issues"
echo ""
echo "🆘 If you need help: The most reliable solution is switching to SendGrid"
