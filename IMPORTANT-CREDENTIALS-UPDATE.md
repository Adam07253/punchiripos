# ⚠️ IMPORTANT: CORRECT DEFAULT CREDENTIALS

## Database Creation on First Run

### When Does the Database Get Created?

The database is created **automatically** when the application starts for the **FIRST TIME**. Here's the exact flow:

1. **Application Starts** → `Punchiri Billing System.exe` is launched
2. **Server Starts** → `server.js` runs
3. **Database Path Check** → Looks for database at: `%APPDATA%\ShopSystem\shop.db`
4. **Database Creation** → If not found, SQLite creates it automatically
5. **Tables Creation** → All tables are created using `CREATE TABLE IF NOT EXISTS`
6. **Default Admin Creation** → Checks if admin exists, if not, creates default admin

### Database Location

```
Windows Path: C:\Users\[USERNAME]\AppData\Roaming\ShopSystem\shop.db
```

NOT in the application folder! It's stored in the user's AppData folder.

### Tables Created Automatically

When the app runs for the first time, these tables are created:

1. ✅ `payment_receipts` - Payment receipt records
2. ✅ `products` - Product inventory
3. ✅ `purchase_history` - Stock purchase tracking (FIFO)
4. ✅ `bills` - Sales bills
5. ✅ `bill_items` - Bill line items
6. ✅ `customers` - Customer database
7. ✅ `customer_payments` - Customer payment history
8. ✅ `admin_credentials` - Admin login credentials

### ⚠️ CORRECT DEFAULT CREDENTIALS

**I made an error in my previous documentation!**

The actual default credentials in the application are:

```
Username: Adam
Password: AdStore@07
```

**NOT** admin/admin123 as I previously stated!

### First Run Process

```
1. User extracts zip file
2. User runs "Punchiri Billing System.exe"
3. Application starts
4. Server checks: %APPDATA%\ShopSystem\shop.db
5. Database doesn't exist → SQLite creates it
6. All tables are created automatically
7. Admin credentials table is checked
8. If empty → Creates default admin: Adam / AdStore@07
9. Login page appears
10. User logs in with: Adam / AdStore@07
```

### Backup Location

Backups are also stored in AppData:

```
Local Backups: %APPDATA%\ShopSystem\backups\
Cloud Backups: Cloudflare R2 (punchiri-backups bucket)
```

### Daily Automatic Backup

On each day when the app starts:
- Checks if backup exists for today
- If not, creates: `shop_backup_YYYYMMDD.db`
- Stores in: `%APPDATA%\ShopSystem\backups\`

### Settings File

Settings are stored at:
```
%APPDATA%\ShopSystem\settings.json
```

Default content:
```json
{
  "report_folder": "D:\\reports dec 2025"
}
```

---

## 🔧 CORRECTED DOCUMENTATION

### Quick Start Guide

1. Extract `Punchiri-Billing-System-Portable-FIXED-2026-03-28.zip`
2. Run `Punchiri Billing System.exe`
3. Wait for server to start (5-10 seconds)
4. Login page will open automatically
5. Use credentials:
   - **Username:** `Adam`
   - **Password:** `AdStore@07`
6. Change password after first login (recommended)

### Database Files Location

```
Database: C:\Users\[USERNAME]\AppData\Roaming\ShopSystem\shop.db
Backups:  C:\Users\[USERNAME]\AppData\Roaming\ShopSystem\backups\
Settings: C:\Users\[USERNAME]\AppData\Roaming\ShopSystem\settings.json
```

### Why AppData?

The application stores data in AppData because:
- ✅ User-specific data storage
- ✅ Survives application updates
- ✅ Proper Windows data storage practice
- ✅ Automatic backup location
- ✅ No admin rights needed

### First Time Setup Checklist

When user runs the app for the first time:

1. ✅ Database auto-creates in AppData
2. ✅ All tables auto-create
3. ✅ Default admin auto-creates (Adam/AdStore@07)
4. ✅ Settings file auto-creates
5. ✅ Backup folder auto-creates
6. ✅ Report folder auto-creates (if doesn't exist)
7. ✅ Server starts on port 3000
8. ✅ Login page opens in browser

**No manual setup required!**

---

## 📝 CORRECTED CREDENTIALS SUMMARY

### Default Login (First Time)
```
Username: Adam
Password: AdStore@07
```

### After First Login
User should:
1. Go to Dashboard
2. Click "Change Password" or "Change Username"
3. Set new secure credentials
4. Remember new credentials!

---

## ⚠️ IMPORTANT NOTES

1. **Database Location:** NOT in app folder, but in `%APPDATA%\ShopSystem\`
2. **Default Credentials:** `Adam / AdStore@07` (NOT admin/admin123)
3. **First Run:** Everything auto-creates, no manual setup needed
4. **Backups:** Automatic daily backup on first run each day
5. **Cloud Backup:** Scheduled for 12:00 PM daily + manual via "Store Closing"

---

## 🔄 What Happens Each Day

### First Run of the Day
1. App starts
2. Checks if today's backup exists
3. If not, creates: `shop_backup_YYYYMMDD.db`
4. Continues normal operation

### At 12:00 PM (Scheduled)
1. Automatic backup triggers
2. Creates local backup
3. Uploads to Cloudflare R2
4. Continues normal operation

### Store Closing (Manual)
1. User clicks "Store Closing" button
2. Creates backup immediately
3. Uploads to Cloudflare R2
4. Shows confirmation

---

## ✅ CORRECTED TEST RESULTS

All tests passed with correct understanding:
- ✅ Database auto-creates on first run
- ✅ Tables auto-create
- ✅ Default admin auto-creates (Adam/AdStore@07)
- ✅ Backups work correctly
- ✅ Cloud integration working

---

**Test Date:** March 28, 2026  
**Status:** ✅ VERIFIED & CORRECTED  
**Correct Credentials:** Adam / AdStore@07
