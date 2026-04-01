# Punchiri POS System - Testing Checklist

## PART 1 — Global Input Issue

### Test Steps
1. Open billing page
2. Click on "Product Search" input field
3. Type product name
4. **Expected**: Characters appear in input field
5. **Expected**: Scanner does NOT interfere

### Test: Customer Search
1. Click on "Customer Search" input field
2. Type customer name
3. **Expected**: Characters appear in input field

### Test: Quantity Input
1. Add a product to bill
2. Double-click quantity cell
3. Type new quantity
4. **Expected**: Numbers appear correctly

### Test: Keyboard Shortcuts Still Work
1. Press Ctrl+Q → **Expected**: Last item removed/reduced
2. Press Ctrl+→ → **Expected**: Next bill tab
3. Press Ctrl+← → **Expected**: Previous bill tab
4. Press Shift+Enter → **Expected**: Focus payment amount field

---

## PART 2 — Scan-First Billing

### Test Steps
1. Open billing page
2. Scan a product barcode
3. **Expected**: Product added with qty=1
4. **Expected**: No popup appears
5. **Expected**: Ready for next scan immediately
6. Scan another product
7. **Expected**: Second product added
8. **Expected**: No mouse interaction needed

---

## PART 3 — Payment Flow

### Test Steps
1. Add products to bill
2. Press Shift+Enter
3. **Expected**: "Received Amount" field is focused
4. Type payment amount
5. Press Enter
6. **Expected**: Bill completes
7. **Expected**: Print dialog appears

### Test: Amount Mandatory
1. Add products to bill
2. Click "Finish & Print Bill" without entering amount
3. **Expected**: System requires payment amount

---

## PART 4 — Real-Time Updates

### Test: Products Page
1. Open Products page in one window
2. Open Add Stock page in another window
3. Add stock to a product
4. **Expected**: Products page updates instantly (no refresh)

### Test: Billing Page
1. Open Billing page
2. Open Add Product page in another window
3. Add a new product
4. Search for the new product in billing
5. **Expected**: New product appears in search

### Test: Customers Page
1. Open Customers page
2. Open Billing page in another window
3. Create a bill with a customer
4. **Expected**: Customer balance updates on Customers page

### Test: Dashboard
1. Open Dashboard
2. Create a bill in another window
3. **Expected**: Dashboard stats update instantly

---

## PART 5 — Barcode Uniqueness

### Test Steps
1. Open Products page
2. Click "Edit Barcode" on a product
3. Enter a barcode that already exists
4. Click Save
5. **Expected**: Error message "Barcode already exists"
6. **Expected**: Save is blocked

---

## PART 6 — Billing UX Improvements

### Test 6.1: Ctrl+Q Shortcut
1. Add product with qty=5
2. Press Ctrl+Q
3. **Expected**: Qty reduces to 4
4. Press Ctrl+Q four more times
5. **Expected**: Qty reduces to 1
6. Press Ctrl+Q once more
7. **Expected**: Item is removed completely

### Test 6.2: Bill Switching
1. Create 3 bills (tabs)
2. Press Ctrl+→
3. **Expected**: Switches to next tab
4. Press Ctrl+←
5. **Expected**: Switches to previous tab

### Test 6.3: Print Popup
1. Complete a bill
2. **Expected**: Print dialog appears
3. **Expected**: Cancel button is focused (default)
4. Press → (right arrow)
5. **Expected**: Focus moves to Print button
6. Press ← (left arrow)
7. **Expected**: Focus moves back to Cancel
8. Press Enter
9. **Expected**: Executes focused button action
10. Press Esc
11. **Expected**: Dialog closes

---

## PART 7 — Stock Page Fixes

### Test 7.1: Merged Search Field
1. Open Add Stock page
2. **Expected**: Single search field for barcode OR product name
3. Type product name
4. **Expected**: Product suggestions appear
5. Scan barcode
6. **Expected**: Product auto-selected

### Test 7.2: Selection Persistence
1. Select a product
2. Click "Purchase History" link
3. Return to Add Stock page
4. **Expected**: Product still selected

### Test 7.3: Mouse Freeze Fix
1. Add stock to a product
2. Click Save
3. Move mouse
4. **Expected**: Mouse works normally
5. **Expected**: No restart needed

### Test 7.4: Price Flow
1. Select a product
2. Enter Min Wholesale Qty
3. Enter Retail Price
4. **Expected**: No auto-save yet
5. Enter Wholesale Price
6. **Expected**: No auto-save yet
7. Enter Special Price
8. **Expected**: No auto-save yet
9. Click "Update Prices"
10. **Expected**: All prices saved together

### Test 7.5: Purchase History Logic

#### Case 1: Same Day
1. Add stock to product at price X
2. View purchase history
3. Add stock again same day at price Y
4. **Expected**: Shows updated price Y

#### Case 2: Next Day
1. Add stock today at price X
2. Next day, add stock at price Y
3. View history
4. **Expected**: Shows "Price Updated" column

#### Case 3: Price-Only Change
1. Update only price (no stock added)
2. View history
3. **Expected**: New row with qty=0

---

## PART 8 — Product Table Fixes

### Test 8.1: Barcode Validation
1. Open Products page
2. Click "Edit Barcode" on Product A
3. Enter barcode that belongs to Product B
4. Click Save
5. **Expected**: Error "Barcode already exists"
6. **Expected**: Save blocked

### Test 8.2: Edit Barcode Button
1. Open Products page
2. **Expected**: "Edit Barcode" button visible (not 3-dot menu)
3. Click "Edit Barcode"
4. **Expected**: Modal opens

### Test 8.3: Sorting
1. Click "Unit" column header
2. **Expected**: Products sorted by unit
3. Click "Status" column header
4. **Expected**: Products sorted by active/inactive

---

## PART 9 — Backup System

### Test 9.1: Automatic Backup (12 PM)
1. Wait for 12:00 PM
2. Check backups folder
3. **Expected**: File named `storedb_YYYY-MM-DD_divOpen.db`

### Test 9.2: Manual Close (First Time)
1. Click "Close Store" button
2. Check backups folder
3. **Expected**: File named `storedb_YYYY-MM-DD_divClose_1.db`

### Test 9.3: Multiple Closes Same Day
1. Click "Close Store" (first time)
2. **Expected**: `storedb_YYYY-MM-DD_divClose_1.db`
3. Click "Close Store" (second time)
4. **Expected**: `storedb_YYYY-MM-DD_divClose_2.db`
5. Click "Close Store" (third time)
6. **Expected**: `storedb_YYYY-MM-DD_divClose_3.db`

### Test 9.4: No Overwrites
1. Create backup today
2. Create another backup today
3. **Expected**: Both files exist
4. **Expected**: No file overwritten

---

## FULL SYSTEM TEST

### Workflow Test: Complete Sale
1. Open billing page
2. Scan product barcode
3. **Expected**: Product added
4. Scan another product
5. **Expected**: Second product added
6. Press Shift+Enter
7. **Expected**: Payment field focused
8. Enter payment amount
9. Press Enter
10. **Expected**: Bill completes
11. **Expected**: Print dialog appears
12. **Expected**: Cancel focused by default
13. Press → then Enter
14. **Expected**: Bill prints

### Workflow Test: Customer Bill
1. Open billing page
2. Press Shift+Space
3. **Expected**: Customer search focused
4. Type customer name
5. Select customer
6. **Expected**: Customer balance shown
7. Add products
8. Enter payment amount
9. Complete bill
10. **Expected**: Customer balance updated
11. Open Customers page
12. **Expected**: Balance updated there too (real-time)

### Workflow Test: Stock Management
1. Open Add Stock page
2. Scan barcode
3. **Expected**: Product auto-selected
4. Enter quantity
5. Enter purchase price
6. Click "Add Stock"
7. **Expected**: Stock added
8. Open Products page
9. **Expected**: Stock updated (real-time)
10. Open Billing page
11. Search for product
12. **Expected**: Updated stock available

---

## Performance Test

### Test: Real-Time Latency
1. Open 2 windows (Products + Add Stock)
2. Add stock
3. Measure time until Products page updates
4. **Expected**: < 1 second

### Test: Multiple Tabs
1. Create 10 bill tabs
2. Switch between tabs using Ctrl+Arrow
3. **Expected**: Instant switching
4. **Expected**: No lag

### Test: Large Product List
1. Search for product with 1000+ products loaded
2. **Expected**: Suggestions appear instantly
3. **Expected**: No lag

---

## Edge Cases

### Test: Duplicate Product in Bill
1. Add same product twice
2. **Expected**: Warning message appears
3. **Expected**: Both items shown in bill

### Test: Insufficient Stock
1. Add product with qty > available stock
2. **Expected**: Warning message
3. **Expected**: Item still added (with warning)

### Test: Network Disconnect
1. Disconnect network
2. Try to add product
3. **Expected**: Error message
4. Reconnect network
5. **Expected**: Real-time updates resume

### Test: Scanner Interference
1. Focus on product search input
2. Scan barcode
3. **Expected**: Barcode appears in input field
4. **Expected**: No interference

---

## Browser Compatibility

### Test: Chrome
- [ ] All features work
- [ ] Real-time updates work
- [ ] Scanner works

### Test: Firefox
- [ ] All features work
- [ ] Real-time updates work
- [ ] Scanner works

### Test: Edge
- [ ] All features work
- [ ] Real-time updates work
- [ ] Scanner works

---

## Final Checklist

- [ ] All PART 1 tests pass
- [ ] All PART 2 tests pass
- [ ] All PART 3 tests pass
- [ ] All PART 4 tests pass
- [ ] All PART 5 tests pass
- [ ] All PART 6 tests pass
- [ ] All PART 7 tests pass
- [ ] All PART 8 tests pass
- [ ] All PART 9 tests pass
- [ ] Full system test passes
- [ ] Performance test passes
- [ ] Edge cases handled
- [ ] Browser compatibility verified
- [ ] No console errors
- [ ] No broken features
- [ ] System stable

---

## Sign-Off

**Tester Name**: _______________
**Date**: _______________
**Result**: PASS / FAIL
**Notes**: _______________
