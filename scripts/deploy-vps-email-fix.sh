#!/bin/bash

# VPS Email Fix Deployment Script
# This script helps you deploy the working Hostinger SMTP configuration to your VPS

echo "🚀 VPS EMAIL FIX DEPLOYMENT"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 PROBLEM IDENTIFIED:${NC}"
echo "   ❌ Your VPS is using Gmail SMTP (failing with 535 auth error)"
echo "   ✅ Your local environment uses Hostinger SMTP (working perfectly)"
echo ""

echo -e "${GREEN}💡 SOLUTION:${NC}"
echo "   Use the same Hostinger SMTP configuration on your VPS!"
echo ""

echo -e "${YELLOW}🔧 WHAT YOU NEED TO DO:${NC}"
echo ""

echo "1. 📤 Upload the SMTP configuration to your VPS:"
echo "   scp temp/smtp-settings.json your-user@your-vps-ip:/var/www/tunda-sports-club/temp/"
echo ""

echo "2. 🔐 Update your VPS environment variables:"
echo "   SSH into your VPS and edit .env.local:"
echo ""
echo "   SMTP_HOST=smtp.hostinger.com"
echo "   SMTP_PORT=465"
echo "   SMTP_SECURE=true"
echo "   SMTP_USER=info@tundasportsclub.com"
echo "   SMTP_PASS=your-actual-hostinger-password"
echo "   SMTP_FROM_EMAIL=info@tundasportsclub.com"
echo "   SMTP_FROM_NAME=Tunda Sports Club"
echo ""

echo "3. 🔄 Restart your VPS application:"
echo "   pm2 restart tunda-sports-club"
echo "   pm2 logs tunda-sports-club --lines 20"
echo ""

echo "4. 🧪 Test the email functionality:"
echo "   node scripts/test-hostinger-vps.js"
echo ""

echo -e "${GREEN}✅ WHY THIS WILL WORK:${NC}"
echo "   • Hostinger SMTP already works on your local machine"
echo "   • Hostinger is VPS-friendly (unlike Gmail)"
echo "   • You already have valid Hostinger credentials"
echo "   • No additional setup or API keys needed"
echo ""

echo -e "${BLUE}📧 EXPECTED RESULT:${NC}"
echo "   Your VPS will send emails successfully using Hostinger SMTP,"
echo "   exactly like your local environment does now."
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   Make sure to use your actual Hostinger email password"
echo "   (not 'your-hostinger-email-password' placeholder)"
echo ""

echo "📁 Files created:"
echo "   ✓ temp/smtp-settings.json (Hostinger config)"
echo "   ✓ VPS_EMAIL_DEPLOYMENT_INSTRUCTIONS.md (detailed guide)"
echo "   ✓ scripts/test-hostinger-vps.js (VPS test script)"
echo ""

echo -e "${GREEN}🎯 Ready to deploy? Follow the steps above!${NC}"
