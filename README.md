# Tunda Sports Club

A comprehensive sports club management system built with Next.js, featuring tournament management, player registration, image galleries, and admin controls.

## 🚀 Quick Start

### Development
```bash
pnpm install
pnpm run dev
```

### Production Build
```bash
pnpm run build
pnpm start
```

## ✨ Features

- **Landing Page**: Responsive design with dynamic content sections
- **Tournament Management**: Create and manage cricket tournaments
- **Player Registration**: Universal registration system for players
- **Image Gallery**: Upload and manage tournament photos via Google Drive
- **Admin Panel**: Complete admin interface for content management
- **Real-time Updates**: Dynamic content loading with caching
- **Dark/Light Mode**: Full theme support using shadcn/ui

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL (SQLite for development)
- **Authentication**: NextAuth.js with role-based access
- **Email**: Nodemailer with SMTP
- **Storage**: Google Drive API integration
- **UI Components**: shadcn/ui (no custom colors, full theme compliance)

## 📱 Mobile Optimized

- Touch-friendly interactions
- Responsive image galleries
- Mobile-first design
- PWA support with service worker
- Optimized loading and caching

## 🎨 Design System

- **Colors**: Only shadcn/ui color variables (no custom colors)
- **CSS**: Single `globals.css` file
- **Components**: Consistent shadcn/ui components
- **Themes**: Perfect dark/light mode support

## URLs

- **Production**: https://tundasportsclub.com
- **Admin Panel**: https://tundasportsclub.com/admin

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- MySQL 8.0+ (or SQLite for development)
- Git

### Setup Commands
```bash
# Clone repository
git clone https://github.com/Recentlystarted/tunda-suports-club.git
cd tunda-suports-club

# Install dependencies
pnpm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
pnpm prisma generate
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the application.

---

## 🚀 **Production Deployment**

### For OpenLiteSpeed VPS
This project includes a complete deployment solution for OpenLiteSpeed servers:

1. **Use the deployment script:**
   ```powershell
   .\deploy-to-openlitespeed.ps1 -Mode full
   ```

2. **Follow the VPS setup guide:** See `VPS_SETUP_GUIDE.md` for detailed instructions

### Environment Configuration
Create `.env` file with production values:
```env
DATABASE_URL="mysql://username:password@localhost:3306/tunda_sports_club"
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

---

## 📂 **Project Structure**

```
tunda-sports-club/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard
│   │   ├── auction-live/         # Live auction management
│   │   ├── tournaments/          # Tournament management
│   │   └── players/              # Player management
│   ├── auction/                  # Auction portals
│   │   └── [tournamentId]/       
│   │       ├── admin/            # Admin auction interface
│   │       └── owner/            # Team owner interface
│   ├── api/                      # API routes
│   │   ├── tournaments/          # Tournament APIs
│   │   └── auth/                 # Authentication APIs
│   └── tournament/               # Public tournament pages
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── registration/             # Auction components
├── prisma/                       # Database schema & migrations
├── lib/                          # Utility functions
└── public/                       # Static assets
```

---

## 🎮 **Usage Guide**

### Admin Users
- Access: `/admin`
- Create and manage tournaments
- Conduct live auctions with real-time controls
- Monitor all system activities

### Team Owners
- Access: `/auction/[tournamentId]/owner?token=SECURE_TOKEN`
- Register team and get admin verification
- Participate in real-time bidding
- Manage team composition

### Players
- Complete registration with detailed profiles
- Join tournaments and track auction status
- View team assignments

---

## 🔧 **API Documentation**

### Core Auction APIs
```typescript
GET  /api/tournaments/[id]/auction/live    # Live auction data
POST /api/tournaments/[id]/auction/live    # Manage auction
GET  /api/tournaments/[id]/auction/bid     # Bidding status
POST /api/tournaments/[id]/auction/bid     # Place bids
```

### Tournament APIs
```typescript
GET  /api/tournaments              # List tournaments
POST /api/tournaments              # Create tournament
GET  /api/tournaments/[id]         # Tournament details
```

---

## 📈 **Latest Updates (v2.0)**

### ✅ Real-Time Auction System Complete
- Live bidding with 3-second auto-refresh
- Fixed database relationships for proper team assignment
- Enhanced UI/UX for admin and owner portals
- Live budget tracking and team composition updates

### ✅ Performance Optimizations
- Fixed dynamic server usage errors
- Optimized API routes for production
- Clean build process with no compilation errors
- Improved image handling

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🐛 **Support**

- **Issues:** [GitHub Issues](https://github.com/Recentlystarted/tunda-suports-club/issues)
- **Documentation:** [VPS Setup Guide](VPS_SETUP_GUIDE.md)
- **Live Demo:** https://tundasportsclub.com

---

## 🙏 **Acknowledgments**

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM  
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

**Made with ❤️ for the cricket community in Tunda Village, Gujarat**

> **🏏 Ready for Live Cricket Auctions! ⚡**
