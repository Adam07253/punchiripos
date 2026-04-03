# Punchiri POS - Deployment Guide

## 🎯 System Overview

Punchiri POS is now a production-grade hybrid desktop application with:
- ✅ Electron Desktop App
- ✅ Auto-starting Node.js Backend
- ✅ Local SQLite Database
- ✅ Cloudflare R2 Backup System
- ✅ GitHub Auto-Update System

---

## 📋 Pre-Deployment Checklist

### 1. Verify All Files Are Ready
- [x] main.js (Electron main process with auto-updater)
- [x] server.js (Backend server)
- [x] package.json (Updated with electron-updater)
- [x] electron-builder.yml (Build configuration)
- [x] .env (Cloudflare R2 credentials - DO NOT COMMIT)
- [x] .gitignore (Protects sensitive files)

### 2. Environment Variables
Ensure `.env` file contains:
```
R2_ACCOUNT_ID=372ca15463bc5e2d08bb3adc44fd2363
R2_ACCESS_KEY_ID=fd270fe62343ed9f7f1d8644ad801345
R2_SECRET_ACCESS_KEY=69acee16ae5602d62a229da63aa0de193b16fd14208a55f3b8f105dca1bbe01a
R2_BUCKET_NAME=punchiri-backups
R2_ENDPOINT=https://372ca15463bc5e2d08bb3adc44fd2363.r2.cloudflarestorage.com
BACKUP_TIME_CRON=0 12 * * *
BACKUP_FOLDER=backups
```

⚠️ **CRITICAL**: Never commit `.env` to GitHub!

---

## 🔨 Building the Application

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build the Installer
```bash
npm run build
```

This will create:
- `dist/Punchiri POS Setup.exe` - The installer
- `dist/latest.yml` - Update metadata file

---

## 🚀 GitHub Release Setup

### Step 1: Create GitHub Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Punchiri POS Releases`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)

### Step 2: Set Environment Variable
**Windows (PowerShell):**
```powershell
$env:GH_TOKEN="your_github_token_here"
```

**Windows (CMD):**
```cmd
set GH_TOKEN=your_github_token_here
```

### Step 3: Create GitHub Release

#### Option A: Manual Release (Recommended for First Release)
1. Go to: https://github.com/Adam07253/punchiri-pos/releases
2. Click "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `Punchiri POS v1.0.0`
5. Description:
   ```
   Initial release of Punchiri POS
   
   Features:
   - Professional billing system
   - FIFO inventory management
   - Customer management with OB tracking
   - Cloudflare R2 automatic backups
   - Auto-update system
   ```
6. Upload files:
   - `dist/Punchiri POS Setup.exe`
   - `dist/latest.yml`
7. Click "Publish release"

#### Option B: Automated Release (Using electron-builder)
```bash
npm run build -- --publish always
```

This will automatically:
- Build the installer
- Create a GitHub release
- Upload the files

---

## 🔄 Auto-Update Flow

### How It Works
1. User installs `v1.0.0`
2. App starts and checks GitHub for updates
3. If `v1.0.1` is available:
   - Downloads update silently
   - Shows progress notification
   - Installs on restart
4. User gets latest version automatically

### Update Behavior
- ✅ Checks for updates 5 seconds after launch
- ✅ Downloads updates in background
- ✅ Notifies user when ready
- ✅ Installs on app restart
- ✅ No manual intervention required

---

## 📦 First Install Experience

### User Journey
1. Download `Punchiri POS Setup.exe`
2. Run installer
3. Choose installation directory
4. App launches automatically
5. Backend server starts (no manual setup)
6. Login screen appears
7. Ready to use!

### Default Credentials
- Username: `Adam`
- Password: `AdStore@07`

---

## 🔐 Security Checklist

### Before Committing to GitHub
- [ ] `.env` is in `.gitignore`
- [ ] No database files (*.db) in repo
- [ ] No backup files in repo
- [ ] No `GH_TOKEN` in code
- [ ] No hardcoded credentials

### Verify with:
```bash
git status
```

Should NOT show:
- `.env`
- `*.db` files
- `backups/` folder
- `dist/` folder

---

## 🧪 Testing Before Release

### Local Testing
```bash
npm start
```

Verify:
- ✅ App launches
- ✅ Server starts automatically
- ✅ Login works
- ✅ Billing works
- ✅ Products load
- ✅ Backup system works

### Production Build Testing
1. Build the app: `npm run build`
2. Install from `dist/Punchiri POS Setup.exe`
3. Test all features
4. Verify auto-update check (check console logs)

---

## 📝 Version Management

### Releasing New Versions

#### Step 1: Update Version
Edit `package.json`:
```json
{
  "version": "1.0.1"
}
```

#### Step 2: Build
```bash
npm run build
```

#### Step 3: Create GitHub Release
1. Tag: `v1.0.1`
2. Upload new files:
   - `Punchiri POS Setup.exe`
   - `latest.yml`

#### Step 4: Users Get Auto-Update
- Existing users will be notified
- Update downloads automatically
- Installs on next restart

---

## 🛠️ Troubleshooting

### Issue: "Server failed to start"
**Solution**: Check if port 3000 is already in use
```bash
netstat -ano | findstr :3000
```

### Issue: "Update check failed"
**Causes**:
- No internet connection
- GitHub rate limit
- Invalid release format

**Solution**: Check console logs in app

### Issue: "Database not found"
**Solution**: Database is created automatically in:
```
%APPDATA%/ShopSystem/store.db
```

### Issue: "Backup failed"
**Solution**: Verify `.env` credentials are correct

---

## 📊 Database Location

### Production
```
C:\Users\[Username]\AppData\Roaming\ShopSystem\store.db
```

### Backups
```
C:\Users\[Username]\AppData\Roaming\ShopSystem\backups\
```

### Reports
```
D:\reports dec 2025\
```
(Configurable in app settings)

---

## 🎯 Post-Deployment

### Monitor
1. Check GitHub release downloads
2. Monitor for update errors
3. Collect user feedback

### Maintenance
1. Regular version updates
2. Database backup verification
3. R2 storage monitoring

---

## 📞 Support

### For Issues
1. Check console logs (F12 in app)
2. Check server logs
3. Verify database integrity

### For Updates
1. Increment version in `package.json`
2. Build and release
3. Users get auto-update

---

## ✅ Final Verification

Before releasing v1.0.0:
- [ ] All features tested
- [ ] Auto-update configured
- [ ] GitHub repo ready
- [ ] `.env` not committed
- [ ] Build successful
- [ ] Installer tested
- [ ] Documentation complete

---

## 🚀 Ready to Deploy!

You're all set! Follow these steps:

1. **Build**: `npm run build`
2. **Test**: Install and verify
3. **Release**: Upload to GitHub
4. **Distribute**: Share installer with users
5. **Monitor**: Watch for update adoption

---

**Version**: 1.0.0  
**Last Updated**: April 2, 2026  
**Status**: Production Ready ✅
