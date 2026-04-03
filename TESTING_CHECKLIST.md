# Testing Checklist - Punchiri POS

## 🧪 Pre-Build Testing (Development Mode)

### Test 1: App Launch
```bash
npm start
```

**Verify:**
- [ ] App window opens
- [ ] No console errors
- [ ] Window size: 1400x900
- [ ] Menu bar hidden

### Test 2: Backend Auto-Start
**Verify:**
- [ ] Server starts automatically (check console: "Starting backend server...")
- [ ] Server ready message appears (check console: "Server is ready...")
- [ ] No "port already in use" errors

### Test 3: UI Loading
**Verify:**
- [ ] Login page loads at http://localhost:3000/login.html
- [ ] No "Failed to load" errors
- [ ] Page renders correctly

### Test 4: Authentication
**Verify:**
- [ ] Login with: Username: `Adam`, Password: `AdStore@07`
- [ ] Login successful
- [ ] Redirects to dashboard

### Test 5: Core Features
**Verify:**
- [ ] Products page loads
- [ ] Can add new product
- [ ] Can view product list
- [ ] Billing page works
- [ ] Can create bill
- [ ] Customer management works

### Test 6: Database
**Verify:**
- [ ] Database created at: `%APPDATA%/ShopSystem/store.db`
- [ ] Data persists after app restart
- [ ] No database errors in console

### Test 7: Backup System
**Verify:**
- [ ] Cloudflare R2 credentials loaded from .env
- [ ] Backup folder exists
- [ ] Manual backup works (if implemented)

### Test 8: App Close
**Verify:**
- [ ] App closes cleanly
- [ ] Server process terminates
- [ ] No orphan processes (check Task Manager)

---

## 📦 Post-Build Testing (Production Mode)

### Build the App
```bash
npm run build
```

**Verify:**
- [ ] Build completes without errors
- [ ] `dist/Punchiri POS Setup.exe` created
- [ ] `dist/latest.yml` created
- [ ] File sizes reasonable (exe ~200-300MB)

### Test 9: Installation
**Verify:**
- [ ] Installer runs
- [ ] Can choose installation directory
- [ ] Desktop shortcut created
- [ ] Start menu shortcut created
- [ ] Installation completes successfully

### Test 10: First Launch
**Verify:**
- [ ] App launches from desktop shortcut
- [ ] Server starts automatically
- [ ] Login page appears
- [ ] No errors in console (F12)

### Test 11: Production Features
**Verify:**
- [ ] All features work (same as Test 5)
- [ ] Database created in correct location
- [ ] Settings persist
- [ ] Reports save to correct folder

### Test 12: Auto-Update Check
**Verify:**
- [ ] Console shows: "Checking for updates..." (after 5 seconds)
- [ ] If no release: "No updates available"
- [ ] No update errors

### Test 13: Multiple Instances
**Verify:**
- [ ] Try launching app twice
- [ ] Second instance should focus first window
- [ ] Only one instance runs

### Test 14: App Restart
**Verify:**
- [ ] Close and reopen app
- [ ] Server starts again
- [ ] Data persists
- [ ] No errors

---

## 🔄 Auto-Update Testing (After GitHub Release)

### Prerequisites
1. Create GitHub release v1.0.0
2. Upload `Punchiri POS Setup.exe` and `latest.yml`
3. Install v1.0.0 on test machine

### Test 15: Update Detection
**Setup:**
1. Update `package.json` version to `1.0.1`
2. Build: `npm run build`
3. Create GitHub release v1.0.1
4. Upload new files

**Verify:**
- [ ] Launch v1.0.0 app
- [ ] Console shows: "Checking for updates..."
- [ ] Console shows: "Update available: 1.0.1"
- [ ] Console shows: "Downloading update..."

### Test 16: Update Download
**Verify:**
- [ ] Download progress shown in console
- [ ] No download errors
- [ ] Console shows: "Update downloaded: 1.0.1"

### Test 17: Update Installation
**Verify:**
- [ ] Console shows: "Update ready. Restarting..."
- [ ] App restarts automatically
- [ ] New version (1.0.1) is running
- [ ] All data preserved

---

## 🔐 Security Testing

### Test 18: Environment Variables
**Verify:**
- [ ] `.env` file NOT in `dist/` folder
- [ ] `.env` file NOT committed to GitHub
- [ ] R2 credentials work from installed app

### Test 19: Database Security
**Verify:**
- [ ] Database NOT in installation folder
- [ ] Database in user AppData folder
- [ ] Database NOT committed to GitHub

### Test 20: Sensitive Files
**Verify:**
- [ ] No `.db` files in repo
- [ ] No `backups/` folder in repo
- [ ] No `GH_TOKEN` in code
- [ ] `.gitignore` properly configured

---

## 🚨 Error Handling Testing

### Test 21: Port Already in Use
**Setup:**
1. Start app
2. Try to start another instance

**Verify:**
- [ ] Second instance focuses first window
- [ ] No "port in use" error shown to user

### Test 22: No Internet Connection
**Setup:**
1. Disconnect internet
2. Launch app

**Verify:**
- [ ] App launches normally
- [ ] Update check fails gracefully
- [ ] No crash
- [ ] Error logged in console

### Test 23: Corrupted Database
**Setup:**
1. Delete database file while app is closed
2. Launch app

**Verify:**
- [ ] New database created automatically
- [ ] App works normally
- [ ] No crash

### Test 24: Missing .env File
**Setup:**
1. Rename `.env` to `.env.backup`
2. Launch app

**Verify:**
- [ ] App launches
- [ ] Backup system may fail (expected)
- [ ] App doesn't crash
- [ ] Other features work

---

## 📊 Performance Testing

### Test 25: Startup Time
**Verify:**
- [ ] App launches in < 5 seconds
- [ ] Server ready in < 3 seconds
- [ ] UI responsive immediately

### Test 26: Large Dataset
**Setup:**
1. Add 100+ products
2. Create 50+ bills

**Verify:**
- [ ] Product list loads quickly
- [ ] Billing remains responsive
- [ ] No lag or freezing

### Test 27: Memory Usage
**Verify:**
- [ ] Check Task Manager
- [ ] App uses < 200MB RAM
- [ ] No memory leaks after extended use

---

## ✅ Final Verification

### Before Release v1.0.0
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] `.env` not committed
- [ ] Build successful
- [ ] Installer tested on clean machine

### GitHub Release Checklist
- [ ] Tag: `v1.0.0`
- [ ] Title: `Punchiri POS v1.0.0`
- [ ] Description written
- [ ] `Punchiri POS Setup.exe` uploaded
- [ ] `latest.yml` uploaded
- [ ] Release published

### Post-Release
- [ ] Download installer from GitHub
- [ ] Install on fresh machine
- [ ] Verify all features
- [ ] Test auto-update to v1.0.1

---

## 🐛 Known Issues to Watch For

### Common Issues
1. **Port 3000 in use**: Close other apps using port 3000
2. **Server won't start**: Check Node.js is installed
3. **Update check fails**: Check internet connection
4. **Database locked**: Close all app instances

### Solutions
- Restart app
- Check console logs (F12)
- Verify `.env` file exists
- Check Task Manager for orphan processes

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Version: ___________

Pre-Build Tests: ___/8 passed
Post-Build Tests: ___/14 passed
Auto-Update Tests: ___/3 passed
Security Tests: ___/3 passed
Error Handling Tests: ___/4 passed
Performance Tests: ___/3 passed

Total: ___/35 passed

Critical Issues: ___________
Minor Issues: ___________
Notes: ___________

Ready for Release: YES / NO
```

---

**Testing Status**: Ready for Testing ✅  
**Last Updated**: April 2, 2026
