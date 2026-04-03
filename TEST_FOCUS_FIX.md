# TEST FOCUS FIX - Quick Guide

## ⚠️ BEFORE TESTING: CLEAR CACHE!

**Press `Ctrl + Shift + R` to hard refresh the page**

Otherwise you'll test the OLD cached scripts and think the fix doesn't work!

---

## Quick Test (2 minutes)

### Test 1: Add Product Page
1. Go to Add Product
2. Leave "Product Name" empty
3. Press Enter or Tab to next field
4. Alert appears: "Product Name is required!"
5. Click OK
6. ✅ **EXPECTED**: Input should be clickable immediately
7. ✅ **EXPECTED**: Cursor should appear when you click
8. ❌ **OLD BUG**: Input frozen, need to minimize window

### Test 2: Add Stock Page
1. Go to Add Stock
2. Don't select a product
3. Click "Add Stock" button
4. Alert appears: "Select a product first"
5. Click OK
6. ✅ **EXPECTED**: Search box should be clickable
7. ✅ **EXPECTED**: Can type immediately

### Test 3: Billing Page
1. Go to Billing
2. Enter invalid barcode
3. If alert appears, close it
4. ✅ **EXPECTED**: Barcode input still works
5. ✅ **EXPECTED**: Can scan next barcode immediately

---

## Verify Fix is Loaded

Open DevTools (F12) and check Console:

You should see:
```
✓ Alert fix loaded - focus will restore after validation popups
✓ Global focus fix loaded - UI freeze prevention active
```

If you DON'T see these messages:
- **Cache issue!** Press `Ctrl + Shift + R`
- Or close app completely and restart

---

## What Changed?

### Before (Bug):
1. User triggers validation
2. Alert appears
3. User closes alert
4. ❌ Inputs frozen
5. ❌ Must minimize window to fix

### After (Fixed):
1. User triggers validation
2. Alert appears
3. User closes alert
4. ✅ Focus automatically restored
5. ✅ Inputs work immediately

---

## Technical Verification

In DevTools Console, type:
```javascript
// Check if alert is wrapped
window.alert.toString()
// Should show custom function, not native

// Test focus restoration
alert('Test'); // After closing, focus should restore
```

---

## If Still Not Working

1. **Check version parameter in HTML**
   - View page source
   - Look for: `alertFix.js?v=2`
   - If you see `?v=1` or no version, cache issue!

2. **Check script files exist**
   - Navigate to: `frontend/alertFix.js`
   - Navigate to: `frontend/globalFocusFix.js`
   - Both should exist and have content

3. **Check console for errors**
   - Any red errors about scripts not loading?
   - Any syntax errors?

4. **Nuclear option**
   - Close app
   - Delete: `%APPDATA%/Punchiri Billing System/Cache`
   - Restart app

---

## Success Criteria

✅ Alert appears when validation fails
✅ Alert closes when user clicks OK
✅ Input is immediately clickable (no freeze)
✅ Cursor appears in input field
✅ Can type/interact without minimizing window
✅ Works on all pages (Add Product, Add Stock, Billing, etc.)
