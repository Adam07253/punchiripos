# MANUAL TESTING CHECKLIST - PART 5

## Instructions
- Test each feature in the browser
- Mark ✅ when test passes
- Mark ❌ when test fails (add notes)
- Mark ⚠️ for partial pass or issues

---

## PART 1: BILLING SYSTEM (billing_v2.html)

### 1.1 Barcode Scanning Behavior
- [ ] Scan a barcode → Item adds to bill automatically
- [ ] No quantity popup appears
- [ ] Default quantity = 1
- [ ] Cursor remains in scan input field
- [ ] Can scan next item immediately (continuous scanning)
- [ ] No mouse interaction required

**Test Steps:**
1. Open billing page
2. Focus on barcode input
3. Scan/type barcode and press Enter
4. Verify item added with qty=1
5. Verify cursor still in barcode input
6. Scan another barcode immediately

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 1.2 Bill Switching Shortcuts
- [ ] Press Ctrl + ← → Switches to previous bill
- [ ] Press Ctrl + → → Switches to next bill
- [ ] Tabs switch instantly (no delay)
- [ ] Works from any input field
- [ ] Visual feedback shows active tab

**Test Steps:**
1. Create 2-3 bills
2. Press Ctrl + → to move forward
3. Press Ctrl + ← to move backward
4. Verify tab switching works

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 1.3 Remove Last Item (Ctrl+Q)
- [ ] Last item qty = 1 → Ctrl+Q removes item completely
- [ ] Last item qty > 1 → Ctrl+Q reduces qty by 1
- [ ] Works from any input field
- [ ] Updates total immediately
- [ ] No confirmation dialog

**Test Steps:**
1. Add item with qty=1
2. Press Ctrl+Q → Item removed
3. Add item with qty=5
4. Press Ctrl+Q → Qty becomes 4
5. Press Ctrl+Q again → Qty becomes 3

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 1.4 Print Popup Behavior
- [ ] After saving bill, print popup appears
- [ ] Cancel button has default focus (highlighted)
- [ ] Arrow keys work (Left/Right to switch buttons)
- [ ] Enter key confirms current selection
- [ ] Escape key closes popup

**Test Steps:**
1. Complete a bill and save
2. Print popup appears
3. Verify Cancel button focused
4. Press Right arrow → Print button focused
5. Press Left arrow → Cancel button focused
6. Press Escape → Popup closes

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 1.5 Payment Flow (MANDATORY)
- [ ] Shift + Enter → Focuses "Enter Amount" field
- [ ] Bill does NOT complete without payment amount
- [ ] Must enter amount before completing
- [ ] Supports Cash/GPay/etc payment methods
- [ ] Amount validation works

**Test Steps:**
1. Add items to bill
2. Press Shift + Enter
3. Verify focus moves to payment field
4. Try to complete without amount → Should fail
5. Enter amount → Bill completes

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 1.6 Customer OB Removed
- [ ] Customer Old Balance (OB) not visible in billing UI
- [ ] No OB column in billing table
- [ ] No OB field in customer section
- [ ] Bill summary does not show OB

**Test Steps:**
1. Open billing page
2. Search for customer
3. Verify no OB field visible
4. Complete bill
5. Check bill summary for OB

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## PART 2: ADD STOCK & PRICING (add_stock.html)

### 2.1 Search Field Merge
- [ ] Single search field present
- [ ] Can scan barcode → Product found
- [ ] Can type product name → Product found
- [ ] Search works for partial names
- [ ] Results appear instantly

**Test Steps:**
1. Open add stock page
2. Scan/type barcode → Product appears
3. Clear search
4. Type product name → Product appears
5. Type partial name → Results filter

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 2.2 Item Selection Persistence
- [ ] Select a product
- [ ] Click purchase history date
- [ ] Return back
- [ ] Previously selected product still selected
- [ ] Can continue adding stock

**Test Steps:**
1. Search and select product
2. Click any purchase history date
3. View history
4. Click back/close
5. Verify product still selected

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 2.3 Mouse Fix After Save
- [ ] Add stock and save
- [ ] Mouse cursor works normally
- [ ] Can click buttons
- [ ] Can select text
- [ ] No need to restart application

**Test Steps:**
1. Add stock to a product
2. Click Save
3. Move mouse around
4. Click various buttons
5. Verify all mouse interactions work

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 2.4 Price Entry Flow
- [ ] Field order: Min Qty → Retail → Wholesale → Special
- [ ] Press Enter in Retail → Moves to Wholesale
- [ ] Press Enter in Wholesale → Moves to Special
- [ ] Press Enter in Special → Moves to Save button
- [ ] Does NOT save immediately after wholesale
- [ ] Can enter special price before saving

**Test Steps:**
1. Select product
2. Enter Min Qty, press Enter
3. Enter Retail price, press Enter → Focus on Wholesale
4. Enter Wholesale price, press Enter → Focus on Special
5. Verify bill NOT saved yet
6. Enter Special price (optional)
7. Press Enter → Saves

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 2.5 Purchase History Logic

#### Case 1: Same Day Update
- [ ] Add stock with new prices (same day)
- [ ] View purchase history
- [ ] Updated prices shown directly
- [ ] No "Price Updated" column

**Test Steps:**
1. Add stock with Price A
2. Later same day, add stock with Price B
3. View history
4. Verify Price B shown in latest entry

**Notes:**
```
_____________________________________________
_____________________________________________
```

#### Case 2: Next Day Update
- [ ] Add stock with new prices (next day)
- [ ] View purchase history
- [ ] "Price Updated" column appears
- [ ] Shows old and new prices

**Test Steps:**
1. Add stock on Day 1 with Price A
2. Add stock on Day 2 with Price B
3. View history
4. Verify "Price Updated" column visible

**Notes:**
```
_____________________________________________
_____________________________________________
```

#### Case 3: Only Price Update (No Stock)
- [ ] Update only prices (qty = 0)
- [ ] New row added in history
- [ ] Qty = 0, Total = 0, Per Unit = 0
- [ ] Updated prices shown

**Test Steps:**
1. Select product
2. Change prices only (no qty)
3. Save
4. View history
5. Verify new row with qty=0

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## PART 3: PRODUCT TABLE (products.html)

### 3.1 Barcode Validation
- [ ] Try to set duplicate barcode → Error shown
- [ ] Error message clear and specific
- [ ] Barcode does NOT save
- [ ] Can set unique barcode → Saves successfully
- [ ] Can set empty barcode → Saves as null

**Test Steps:**
1. Note existing barcode (e.g., "12345")
2. Edit different product
3. Try to set barcode to "12345"
4. Verify error: "Barcode already exists"
5. Change to unique barcode
6. Verify saves successfully

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 3.2 Edit Barcode UI
- [ ] 3-dot menu (⋮) is removed
- [ ] "Edit Barcode" button visible in Actions column
- [ ] Button click opens modal
- [ ] Modal shows current barcode
- [ ] Input field auto-focused
- [ ] Enter key saves
- [ ] Escape key closes modal
- [ ] Cancel button closes modal

**Test Steps:**
1. Open products page
2. Verify no 3-dot menu visible
3. Click "Edit Barcode" button
4. Modal opens with current barcode
5. Press Escape → Modal closes
6. Open again, edit barcode, press Enter → Saves

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 3.3 Sorting Options

#### Unit Column Sorting
- [ ] Click "Unit" header → Sorts by kg/pc
- [ ] Click again → Reverses sort order
- [ ] Sort indicator (↑/↓) displays correctly
- [ ] kg items grouped together
- [ ] pc items grouped together

**Test Steps:**
1. Click "Unit" column header
2. Verify sorting (kg before pc or vice versa)
3. Click again
4. Verify reverse order
5. Check sort indicator

**Notes:**
```
_____________________________________________
_____________________________________________
```

#### Status Column Sorting
- [ ] Click "Status" header → Sorts by Active/Inactive
- [ ] Click again → Reverses sort order
- [ ] Sort indicator (↑/↓) displays correctly
- [ ] Active products grouped together
- [ ] Inactive products grouped together

**Test Steps:**
1. Click "Status" column header
2. Verify sorting (Active/Inactive grouped)
3. Click again
4. Verify reverse order
5. Check sort indicator

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## PART 4: DATABASE & BACKUP

### 4.1 Automatic Backup (12 PM)
- [ ] Wait for 12:00 PM (or adjust cron)
- [ ] Backup created: `storedb_YYYY-MM-DD_divOpen.db`
- [ ] File exists in backups folder
- [ ] File uploaded to Cloudflare R2
- [ ] Console log shows success message

**Test Steps:**
1. Wait for 12 PM or adjust BACKUP_TIME_CRON in .env
2. Check backups folder
3. Verify divOpen file created
4. Check R2 bucket for upload

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 4.2 Manual Store Closing
- [ ] Click "Close Store" button
- [ ] Backup created: `storedb_YYYY-MM-DD_divClose_1.db`
- [ ] File exists in backups folder
- [ ] File uploaded to R2
- [ ] Success message shown

**Test Steps:**
1. Click Close Store button
2. Check backups folder
3. Verify divClose_1.db created
4. Check file size > 0

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 4.3 Multi-Close Support
- [ ] Close store first time → `divClose_1.db`
- [ ] Close store second time → `divClose_2.db`
- [ ] Close store third time → `divClose_3.db`
- [ ] Numbers are sequential
- [ ] No overwrites

**Test Steps:**
1. Close store → divClose_1.db
2. Reopen and close → divClose_2.db
3. Reopen and close → divClose_3.db
4. Verify all 3 files exist

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

### 4.4 Day-wise Backup
- [ ] Backups from different days preserved
- [ ] Each day has separate files
- [ ] No cross-day overwrites
- [ ] Easy to identify by date in filename

**Test Steps:**
1. Check backups folder
2. Verify files from different dates
3. Confirm no overwrites
4. Check date format in filenames

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## CRASH & EDGE CASES

### Page Refresh
- [ ] Refresh during billing → Data persists
- [ ] Refresh during stock add → Data persists
- [ ] No data loss on refresh

**Notes:**
```
_____________________________________________
```

---

### Multiple Tabs
- [ ] Open 2+ tabs
- [ ] Make changes in Tab 1
- [ ] Verify Tab 2 updates (if real-time sync enabled)
- [ ] No conflicts or errors

**Notes:**
```
_____________________________________________
```

---

### Fast Scanning
- [ ] Scan 10+ items rapidly
- [ ] All items added correctly
- [ ] No missed scans
- [ ] No UI lag

**Notes:**
```
_____________________________________________
```

---

### Network Errors
- [ ] Disconnect network
- [ ] Try to save data
- [ ] Error message shown
- [ ] Data not lost
- [ ] Can retry after reconnect

**Notes:**
```
_____________________________________________
```

---

### Invalid Inputs
- [ ] Negative quantity → Rejected
- [ ] Zero price → Handled appropriately
- [ ] Invalid barcode format → Handled
- [ ] Very long text → UI handles gracefully

**Notes:**
```
_____________________________________________
```

---

## FINAL CHECKLIST

- [ ] All Part 1 features working
- [ ] All Part 2 features working
- [ ] All Part 3 features working
- [ ] All Part 4 features working
- [ ] No console errors
- [ ] No UI glitches
- [ ] Performance acceptable
- [ ] All shortcuts working
- [ ] All validations working
- [ ] Backup system working

---

## SIGN-OFF

**Tester Name:** _______________________

**Date:** _______________________

**Overall Status:** ⬜ PASS  ⬜ FAIL  ⬜ NEEDS REVIEW

**Additional Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```
