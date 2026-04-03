# Punchiri POS - Professional Point of Sale System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![License](https://img.shields.io/badge/license-Proprietary-red)

A professional desktop Point of Sale system with automatic updates, local database, and cloud backups.

---

## ✨ Features

- 🖥️ **Desktop Application** - Native Windows app with Electron
- 🔄 **Auto-Updates** - Seamless updates via GitHub releases
- 💾 **Local Database** - Fast SQLite database
- ☁️ **Cloud Backups** - Automatic backups to Cloudflare R2
- 📦 **FIFO Inventory** - First-In-First-Out stock management
- 👥 **Customer Management** - Track outstanding balances
- 🧾 **Professional Billing** - Complete billing system
- 📊 **Reports** - PDF report generation
- 🔐 **Secure** - Local data storage with cloud backups

---

## 🚀 Quick Start

### For Users

1. **Download** the latest installer from [Releases](https://github.com/Adam07253/punchiri-pos/releases)
2. **Run** `Punchiri POS Setup.exe`
3. **Install** following the wizard
4. **Launch** from desktop shortcut
5. **Login** with your credentials

### For Developers

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build installer
npm run build
```

---

## 📋 System Requirements

- **OS**: Windows 7 or later
- **RAM**: 2GB minimum
- **Disk**: 500MB free space
- **Internet**: Optional (for updates and backups)

---

## 🔧 Installation

### End Users

1. Download `Punchiri POS Setup.exe` from the latest release
2. Run the installer
3. Choose installation directory
4. Complete installation
5. Launch the app

### First Time Setup

- Default username: `Adam`
- Default password: `AdStore@07`
- Change credentials in Settings after first login

---

## 📖 Documentation

- **[Quick Start](QUICK_START.md)** - Get started quickly
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Build Instructions](BUILD_INSTRUCTIONS.md)** - How to build the app
- **[Testing Checklist](TESTING_CHECKLIST.md)** - Testing procedures
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Technical architecture
- **[Action Checklist](ACTION_CHECKLIST.md)** - Step-by-step actions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Electron Desktop App            │
│  (Auto-updates, Window Management)  │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     Node.js Backend Server          │
│  (Express, REST API, WebSocket)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     SQLite Database                 │
│  (Local storage in AppData)         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     Cloudflare R2                   │
│  (Automatic cloud backups)          │
└─────────────────────────────────────┘
```

---

## 🔄 Auto-Update System

The app automatically checks for updates on startup:

1. Checks GitHub releases
2. Downloads new version if available
3. Notifies user
4. Installs on restart

No manual intervention required!

---

## 💾 Data Storage

### Database Location
```
C:\Users\[Username]\AppData\Roaming\ShopSystem\store.db
```

### Backups Location
```
C:\Users\[Username]\AppData\Roaming\ShopSystem\backups\
```

### Reports Location
```
D:\reports dec 2025\ (configurable in app)
```

---

## 🛠️ Development

### Prerequisites

- Node.js v18 or later
- npm v8 or later
- Windows OS (for building)

### Setup

```bash
# Clone repository
git clone https://github.com/Adam07253/punchiri-pos.git
cd punchiri-pos

# Install dependencies
npm install

# Run in development
npm start
```

### Building

```bash
# Build installer
npm run build

# Output in dist/ folder
# - Punchiri POS Setup.exe
# - latest.yml
```

### Testing

```bash
# Run app in development
npm start

# Build and test installer
npm run build
# Then install from dist/Punchiri POS Setup.exe
```

---

## 📦 Release Process

### Creating a Release

1. **Update version** in `package.json`
2. **Build** the installer: `npm run build`
3. **Test** the installer
4. **Create GitHub release** with tag `v1.0.x`
5. **Upload** `Punchiri POS Setup.exe` and `latest.yml`
6. **Publish** the release

### Users Get Auto-Update

- Existing users will be notified
- Update downloads automatically
- Installs on next restart

---

## 🔐 Security

### Protected Files

- `.env` - Never committed (contains R2 credentials)
- `*.db` - Database files excluded
- `backups/` - Backup files excluded
- User data stored in AppData folder

### Best Practices

- Environment variables for secrets
- Local database storage
- Secure cloud backups
- No hardcoded credentials

---

## 🧪 Testing

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive testing procedures.

### Quick Test

```bash
# Development mode
npm start

# Verify:
# - App launches
# - Server starts
# - Login works
# - Features work
```

---

## 📊 Features in Detail

### Inventory Management
- FIFO (First-In-First-Out) stock tracking
- Purchase history tracking
- Stock quantity management
- Expiry date tracking
- Multiple pricing tiers (retail, wholesale, special)

### Billing System
- Create bills with multiple items
- Customer outstanding balance tracking
- Multiple payment modes
- PDF bill generation
- Bill editing capability

### Customer Management
- Customer database
- Outstanding balance tracking
- Payment history
- Mobile number tracking

### Backup System
- Automatic daily backups
- Store closing backups
- Cloudflare R2 cloud storage
- Local backup copies

---

## 🤝 Contributing

This is a proprietary project. For issues or feature requests, please contact the development team.

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Support

### For Issues
- Check console logs (F12 in app)
- Review documentation
- Check GitHub issues

### For Updates
- Updates are automatic
- Check [Releases](https://github.com/Adam07253/punchiri-pos/releases) for changelog

---

## 🎯 Roadmap

### Current Version (1.0.0)
- ✅ Desktop application
- ✅ Auto-updates
- ✅ Local database
- ✅ Cloud backups
- ✅ FIFO inventory
- ✅ Customer management
- ✅ Billing system

### Future Enhancements
- Multi-user support
- Advanced reporting
- Mobile app
- Cloud sync
- Inventory forecasting

---

## 📈 Version History

### v1.0.0 (April 2, 2026)
- Initial release
- Electron desktop app
- Auto-update system
- Local SQLite database
- Cloudflare R2 backups
- FIFO inventory management
- Customer OB tracking
- Professional billing system

---

## 🙏 Acknowledgments

- Built with Electron
- Powered by Node.js
- Database: SQLite
- Cloud Storage: Cloudflare R2
- Updates: electron-updater

---

## 📧 Contact

For support or inquiries, please contact the development team.

---

**Made with ❤️ for Punchiri Store**

---

## 🚀 Getting Started

Ready to use Punchiri POS?

1. **Download** from [Releases](https://github.com/Adam07253/punchiri-pos/releases)
2. **Install** the app
3. **Launch** and login
4. **Start billing!**

For developers: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Platform**: Windows  
**Last Updated**: April 2, 2026
