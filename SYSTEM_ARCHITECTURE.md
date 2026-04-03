# Punchiri POS - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PUNCHIRI POS v1.0.0                     │
│                  Hybrid Desktop Application                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON LAYER (main.js)                  │
├─────────────────────────────────────────────────────────────┤
│  • Window Management (1400x900)                             │
│  • Auto-Update System (electron-updater)                    │
│  • Process Management                                        │
│  • Single Instance Lock                                      │
│  • Global Shortcuts                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND LAYER (server.js)                   │
├─────────────────────────────────────────────────────────────┤
│  • Express Server (Port 3000)                               │
│  • REST API Endpoints                                        │
│  • WebSocket (Real-time Sync)                               │
│  • Authentication                                            │
│  • Business Logic (FIFO, Billing)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (SQLite)                    │
├─────────────────────────────────────────────────────────────┤
│  • Products Table                                            │
│  • Bills & Bill Items                                        │
│  • Customers & Payments                                      │
│  • Purchase History (FIFO)                                   │
│  • Admin Credentials                                         │
│  Location: %APPDATA%/ShopSystem/store.db                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKUP LAYER (Cloudflare R2)               │
├─────────────────────────────────────────────────────────────┤
│  • Automatic Daily Backups                                   │
│  • Store Closing Backups                                     │
│  • Cloud Storage (R2)                                        │
│  • Backup Manager (backup-manager.js)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Application Flow

### Startup Sequence

```
1. User clicks desktop icon
         ↓
2. Electron launches (main.js)
         ↓
3. Check for existing instance
         ↓
4. Spawn Node.js server (server.js)
         ↓
5. Wait for http://localhost:3000
         ↓
6. Create browser window
         ↓
7. Load login.html
         ↓
8. Check for updates (5 sec delay)
         ↓
9. User logs in
         ↓
10. Application ready
```

### Update Flow

```
1. App starts
         ↓
2. electron-updater checks GitHub
         ↓
3. Compare versions (current vs latest)
         ↓
4. If newer version exists:
         ↓
5. Download .exe and .yml files
         ↓
6. Verify integrity
         ↓
7. Show notification
         ↓
8. Install on app restart
         ↓
9. User has latest version
```

### Billing Flow

```
1. User selects products
         ↓
2. Frontend sends POST /create-bill
         ↓
3. Backend validates data
         ↓
4. FIFO deduction from purchase_history
         ↓
5. Update product stock_qty
         ↓
6. Create bill record
         ↓
7. Create bill_items records
         ↓
8. Update customer OB (if applicable)
         ↓
9. Return bill data
         ↓
10. Frontend generates PDF
         ↓
11. Save to reports folder
```

---

## 📦 Component Breakdown

### Electron Main Process (main.js)
```javascript
Responsibilities:
├── Window Management
│   ├── Create main window
│   ├── Set size and preferences
│   └── Handle window events
├── Server Management
│   ├── Spawn Node.js process
│   ├── Wait for server ready
│   └── Kill on app close
├── Auto-Update
│   ├── Check for updates
│   ├── Download updates
│   ├── Install updates
│   └── Handle errors
└── Security
    ├── Single instance lock
    ├── Context isolation
    └── Process cleanup
```

### Backend Server (server.js)
```javascript
Responsibilities:
├── API Endpoints
│   ├── /products (GET, POST)
│   ├── /create-bill (POST)
│   ├── /customers (GET, POST)
│   ├── /admin/* (Authentication)
│   └── /report-folder (GET, POST)
├── Database Operations
│   ├── CRUD operations
│   ├── FIFO calculations
│   └── Transaction management
├── Real-time Sync
│   ├── WebSocket server
│   └── Broadcast updates
└── File Management
    ├── Report saving
    └── Backup coordination
```

### Database (SQLite)
```sql
Tables:
├── products
│   ├── Product information
│   ├── Stock quantities
│   └── Pricing (retail, wholesale, special)
├── purchase_history
│   ├── FIFO batches
│   ├── Remaining quantities
│   └── Purchase details
├── bills
│   ├── Bill headers
│   └── Payment information
├── bill_items
│   ├── Line items
│   └── FIFO references
├── customers
│   ├── Customer details
│   └── Outstanding balance
├── customer_payments
│   ├── Payment records
│   └── Payment history
└── admin_credentials
    ├── Username
    └── Password
```

---

## 🔐 Security Architecture

### File Protection
```
.gitignore protects:
├── .env (Cloudflare credentials)
├── *.db (Database files)
├── backups/ (Backup files)
├── dist/ (Build outputs)
└── node_modules/ (Dependencies)
```

### Data Storage
```
User Data Location:
C:\Users\[Username]\AppData\Roaming\ShopSystem\
├── store.db (Main database)
├── backups/ (Local backups)
└── settings.json (App settings)

Reports Location:
D:\reports dec 2025\ (Configurable)
```

### Electron Security
```javascript
webPreferences: {
  nodeIntegration: true,      // Required for backend
  contextIsolation: false     // Required for backend
}
// Note: This is acceptable for local-only app
// No external content loaded
```

---

## 🌐 Network Architecture

### Local Communication
```
Frontend (Browser) ←→ Backend (Express)
     ↓                      ↓
  Port: N/A          Port: 3000
     ↓                      ↓
  HTTP Requests      REST API
     ↓                      ↓
  WebSocket          WebSocket Server
```

### External Communication
```
App ←→ GitHub (Updates)
     ↓
  HTTPS
     ↓
  Check releases
  Download updates

App ←→ Cloudflare R2 (Backups)
     ↓
  HTTPS
     ↓
  Upload backups
  Store database copies
```

---

## 📊 Data Flow

### Product Addition
```
User Input → Frontend Validation → POST /add-product
    ↓
Backend Validation → Check Duplicates → Begin Transaction
    ↓
Insert Product → Create FIFO Batch → Commit Transaction
    ↓
Broadcast Update → Return Success → Update UI
```

### Bill Creation
```
Cart Items → Frontend Calculation → POST /create-bill
    ↓
Backend Validation → Begin Transaction → FIFO Deduction
    ↓
Update Stock → Create Bill → Create Bill Items
    ↓
Update Customer OB → Commit Transaction → Return Bill
    ↓
Generate PDF → Save Report → Update UI
```

### Backup Process
```
Scheduled Time → Backup Manager → Create DB Copy
    ↓
Compress File → Upload to R2 → Verify Upload
    ↓
Log Success → Clean Old Backups → Complete
```

---

## 🔧 Build Process

### Development Build
```
npm start
    ↓
Launch Electron
    ↓
Load from source files
    ↓
Hot reload enabled
    ↓
Console logging enabled
```

### Production Build
```
npm run build
    ↓
electron-builder reads config
    ↓
Package all files (except excluded)
    ↓
Create NSIS installer
    ↓
Generate latest.yml
    ↓
Output to dist/
```

### Build Output
```
dist/
├── Punchiri POS Setup.exe (Installer)
├── latest.yml (Update metadata)
└── win-unpacked/ (Unpacked files)
```

---

## 🚀 Deployment Architecture

### GitHub Release
```
Developer → Build App → Create Release
    ↓
Upload Files → Publish Release
    ↓
Users Download → Install App
    ↓
App Checks Updates → Downloads New Version
    ↓
Auto-Install → Users Updated
```

### Update Distribution
```
GitHub Releases
    ↓
latest.yml (metadata)
    ↓
electron-updater checks
    ↓
Downloads if newer
    ↓
Installs on restart
```

---

## 📈 Scalability Considerations

### Current Architecture
- ✅ Single-user desktop app
- ✅ Local database
- ✅ Cloud backups
- ✅ Automatic updates

### Future Enhancements (Not Implemented)
- Multi-user support
- Cloud database sync
- Mobile app integration
- Advanced reporting
- Inventory forecasting

---

## 🎯 Key Features

### Implemented
1. ✅ Electron desktop wrapper
2. ✅ Auto-starting backend
3. ✅ Local SQLite database
4. ✅ FIFO inventory management
5. ✅ Customer OB tracking
6. ✅ Cloudflare R2 backups
7. ✅ Auto-update system
8. ✅ Professional installer
9. ✅ Single instance lock
10. ✅ Graceful error handling

### Not Modified (As Required)
- ✅ Business logic unchanged
- ✅ FIFO calculations unchanged
- ✅ Database schema unchanged
- ✅ Backup system unchanged
- ✅ Frontend UI unchanged

---

## 📝 Technical Stack

```
Frontend:
├── HTML5
├── CSS3
├── JavaScript (Vanilla)
└── PDF Generation (jsPDF)

Backend:
├── Node.js v22.12.0
├── Express v5.2.1
├── SQLite3 v5.1.7
└── WebSocket (ws v8.19.0)

Desktop:
├── Electron v40.4.1
├── electron-updater v6.8.3
└── electron-builder v25.1.8

Cloud:
├── Cloudflare R2 (Backups)
└── GitHub (Updates)
```

---

## 🎉 Architecture Benefits

### For Users
- ✅ One-click installation
- ✅ No manual setup
- ✅ Automatic updates
- ✅ Offline capable
- ✅ Professional experience

### For Developers
- ✅ Easy to maintain
- ✅ Simple deployment
- ✅ Clear separation of concerns
- ✅ Comprehensive documentation
- ✅ Automated updates

### For Business
- ✅ Reduced support costs
- ✅ Easy distribution
- ✅ Automatic backups
- ✅ Version control
- ✅ Professional image

---

**Architecture Version**: 1.0.0  
**Last Updated**: April 2, 2026  
**Status**: Production Ready ✅
