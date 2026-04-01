# Testing Quick Start Guide

## Part 5 - Full System Testing

This guide helps you quickly run all tests for the Punchiri Store Billing System.

---

## Prerequisites

1. **Server Running:**
   ```bash
   node server.js
   ```

2. **Database Exists:**
   - Ensure `shop.db` exists in project root
   - Should have sample products and data

3. **Dependencies Installed:**
   ```bash
   npm install
   ```

---

## Quick Test Commands

### 1. Run All Automated Tests
```bash
node test-part5-full-system.js
```

**What it tests:**
- All code implementations (Parts 1-4)
- File integrity
- Feature presence verification
- Generates TEST_REPORT_PART5.md

**Expected Output:**
- ✅ 27+ automated tests pass
- 🔍 36 manual tests listed
- Report saved to TEST_REPORT_PART5.md

---

### 2. Test Individual Parts

#### Part 1: Billing System
```bash
# No specific test - use browser
# Open: http://localhost:3000/frontend/billing_v2.html
```

#### Part 2: Add Stock
```bash
# No specific test - use browser
# Open: http://localhost:3000/frontend/add_stock.html
```

#### Part 3: Product Table
```bash
node test-part3-features.js
# Then open: http://localhost:3000/frontend/products.html
```

#### Part 4: Backup System
```bash
node test-part4-backup.js
```

---

## Manual Testing Workflow

### Step 1: Open Checklist
```bash
# Open in your editor or print
code MANUAL_TESTING_CHECKLIST.md
```

### Step 2: Start Application
```bash
# Terminal 1
node server.js

# Terminal 2 (if using Electron)
npm start
```

### Step 3: Test Each Feature
Follow the checklist in `MANUAL_TESTING_CHECKLIST.md`:
- [ ] Part 1: Billing (7 tests)
- [ ] Part 2: Add Stock (7 tests)
- [ ] Part 3: Products (7 tests)
- [ ] Part 4: Backup (4 tests)
- [ ] Edge Cases (10 tests)

### Step 4: Document Results
Mark checkboxes in the checklist as you complete each test.

---

## Test URLs

### Frontend Pages
```
Billing:        http://localhost:3000/frontend/billing_v2.html
Add Stock:      http://localhost:3000/frontend/add_stock.html
Products:       http://localhost:3000/frontend/products.html
Dashboard:      http://localhost:3000/frontend/dashboard.html
```

### API Endpoints
```
Store Closing:  POST http://localhost:3000/api/store-closing-backup
Products List:  GET  http://localhost:3000/products/all
Update Barcode: PUT  http://localhost:3000/products/:id/barcode
```

---

## Common Test Scenarios

### Test Barcode Scanning
1. Open billing page
2. Focus barcode input
3. Type barcode: `12345` + Enter
4. Verify item added automatically
5. Verify cursor stays in input
6. Scan another barcode immediately

### Test Ctrl+Q Shortcut
1. Add item to bill (qty=1)
2. Press Ctrl+Q
3. Verify item removed
4. Add item with qty=5
5. Press Ctrl+Q
6. Verify qty reduced to 4

### Test Barcode Validation
1. Open products page
2. Note existing barcode (e.g., "ABC123")
3. Click "Edit Barcode" on different product
4. Try to set barcode to "ABC123"
5. Verify error: "Barcode already exists"

### Test Backup System
```bash
# Create manual backup
curl -X POST http://localhost:3000/api/store-closing-backup

# Check backup created
ls -lh backups/storedb_*

# Verify naming format
# Should be: storedb_2026-03-31_divClose_1.db
```

---

## Keyboard Shortcuts to Test

### Billing Page
- `Ctrl + ←` - Previous bill
- `Ctrl + →` - Next bill
- `Ctrl + Q` - Remove/reduce last item
- `Shift + Enter` - Focus payment field
- `Double Space` - Product search
- `Escape` - Close dialogs

### Add Stock Page
- `Enter` - Navigate through price fields
- `Tab` - Move between inputs

### Products Page
- `Enter` - Save barcode edit
- `Escape` - Close modal

---

## Verification Checklist

### After Running Automated Tests
- [ ] 27+ tests passed
- [ ] TEST_REPORT_PART5.md generated
- [ ] No critical errors in console
- [ ] All files integrity verified

### After Manual Testing
- [ ] All keyboard shortcuts work
- [ ] All validations work
- [ ] No console errors
- [ ] UI responsive and smooth
- [ ] Data persists correctly

### After Backup Testing
- [ ] divOpen backup created (12 PM)
- [ ] divClose_1.db created (manual)
- [ ] divClose_2.db created (second close)
- [ ] Files uploaded to R2 (if configured)
- [ ] Naming format correct

---

## Troubleshooting

### Server Not Starting
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Restart server
node server.js
```

### Database Locked
```bash
# Close all connections
# Restart server
# Try again
```

### Backup Not Created
```bash
# Check .env file
cat .env

# Verify R2 credentials
# Check backup folder exists
ls -la backups/

# Check server logs
```

### Tests Failing
```bash
# Ensure server is running
# Check database exists
# Verify all dependencies installed
npm install

# Re-run tests
node test-part5-full-system.js
```

---

## Test Reports Location

All test reports are saved in the project root:

```
TEST_REPORT_PART5.md          - Automated test results
MANUAL_TESTING_CHECKLIST.md   - Manual test checklist
PART1_COMPLETED.md             - Part 1 completion report
PART2_COMPLETED.md             - Part 2 completion report
PART3_COMPLETED.md             - Part 3 completion report
PART4_COMPLETED.md             - Part 4 completion report
PART5_COMPLETED.md             - Part 5 completion report
```

---

## Next Steps

After completing all tests:

1. ✅ Review all test reports
2. ✅ Document any issues found
3. ✅ Fix critical bugs
4. ✅ Re-test fixed issues
5. ➡️ Proceed to Part 6 (Report Generation)

---

## Support

If you encounter issues:
1. Check server logs
2. Check browser console
3. Review test reports
4. Check database integrity
5. Verify all files present

---

## Summary

**Quick Test:**
```bash
node test-part5-full-system.js
```

**Full Test:**
1. Run automated tests
2. Complete manual checklist
3. Test backup system
4. Verify all features
5. Document results

**Time Estimate:**
- Automated tests: 5 minutes
- Manual testing: 30-45 minutes
- Backup testing: 10 minutes
- Total: ~1 hour

Good luck with testing! 🚀
