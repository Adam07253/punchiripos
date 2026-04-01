# Punchiri POS - Quick Start Guide

## 🚀 What's New

Your POS system has been upgraded with powerful new features:

### ✨ Key Improvements

1. **Scan-First Billing** - Just scan, no popups!
2. **Real-Time Updates** - All pages update instantly
3. **Keyboard Shortcuts** - Work faster without mouse
4. **Smart Input** - Scanner never interferes with typing
5. **Professional Workflow** - True supermarket POS behavior

---

## ⌨️ Keyboard Shortcuts

### Billing Page

| Shortcut | Action |
|----------|--------|
| **Scan Barcode** | Adds item with qty=1 (no popup!) |
| **Double Space** | Focus product search |
| **Shift + Space** | Focus customer search |
| **Shift + Enter** | Focus payment amount field |
| **Enter** (in payment) | Complete bill |
| **Ctrl + Q** | Remove last item / reduce qty |
| **Ctrl + →** | Next bill tab |
| **Ctrl + ←** | Previous bill tab |
| **Ctrl + Shift** | Create new bill |

### Print Dialog

| Shortcut | Action |
|----------|--------|
| **← →** | Switch between Cancel/Print |
| **Enter** | Confirm selected button |
| **Esc** | Close dialog |

---

## 🛒 Billing Workflow

### Fast Checkout (Scan-First)

1. **Scan product** → Item added automatically (qty=1)
2. **Scan next product** → Added instantly
3. **Scan more products** → Keep scanning!
4. **Press Shift+Enter** → Jump to payment
5. **Enter amount** → Type payment
6. **Press Enter** → Bill complete!

### With Customer

1. **Press Shift+Space** → Customer search opens
2. **Type name** → Select customer
3. **Scan products** → Add items
4. **Press Shift+Enter** → Jump to payment
5. **Enter amount** → Type payment
6. **Press Enter** → Bill complete, balance updated!

### Manual Entry (No Scanner)

1. **Double Space** → Product search opens
2. **Type product name** → Select from list
3. **Enter quantity** → Type qty or price
4. **Click Add** → Item added
5. **Repeat** → Add more items
6. **Press Shift+Enter** → Jump to payment
7. **Enter amount** → Complete bill

---

## 🔄 Real-Time Updates

### What Updates Automatically?

**No refresh needed!** All pages update instantly when:

- ✅ Product added → Shows in billing search
- ✅ Stock added → Shows in products page
- ✅ Price updated → Shows everywhere
- ✅ Bill created → Dashboard updates
- ✅ Customer added → Shows in customer list
- ✅ Payment received → Balance updates

### How It Works

Open multiple windows and watch them sync in real-time:
- Window 1: Add stock
- Window 2: Products page updates automatically!

---

## 📦 Product Management

### Edit Barcode

1. Open **Products** page
2. Find product
3. Click **Edit Barcode** button
4. Enter new barcode
5. Click **Save**

**Note**: System prevents duplicate barcodes!

### Sort Products

Click column headers to sort:
- **ID** - Sort by product ID
- **Name** - Sort alphabetically
- **Unit** - Sort by unit type (pc/kg)
- **Stock** - Sort by stock level
- **Status** - Sort by active/inactive

---

## 💾 Backup System

### Automatic Backup

- **When**: Every day at 12:00 PM
- **Name**: `storedb_YYYY-MM-DD_divOpen.db`
- **Action**: None needed (automatic)

### Manual Backup (Close Store)

1. Click **Close Store** button
2. Backup created: `storedb_YYYY-MM-DD_divClose_1.db`
3. Close again same day: `divClose_2.db`
4. Close again: `divClose_3.db`

**Note**: Multiple closes same day = sequential numbers!

---

## 🎯 Pro Tips

### Speed Tips

1. **Use keyboard shortcuts** - Faster than mouse
2. **Scan continuously** - No need to wait
3. **Shift+Enter** - Quick jump to payment
4. **Ctrl+Q** - Quick remove last item
5. **Double Space** - Quick product search

### Workflow Tips

1. **Keep scanner ready** - Scan-first is fastest
2. **Use customer search** - Shift+Space for quick access
3. **Multiple bills** - Use tabs for multiple customers
4. **Real-time sync** - No need to refresh pages

### Troubleshooting

**Scanner not working?**
- Check scanner is connected
- Try scanning in product search field
- Verify scanner is configured for Enter key

**Can't type in input field?**
- This is fixed! Just click and type
- Scanner won't interfere anymore

**Page not updating?**
- Check internet connection
- Real-time updates need network
- Refresh page if needed

---

## 📱 Multi-Window Workflow

### Recommended Setup

**Window 1**: Billing (main)
**Window 2**: Products (reference)
**Window 3**: Customers (reference)

All windows update in real-time!

### Example Workflow

1. **Billing window**: Scan products
2. **Products window**: Check stock levels
3. **Customers window**: Check balances
4. All update automatically as you work!

---

## 🔧 System Requirements

### Hardware

- **Scanner**: USB barcode scanner (configured for Enter key)
- **Printer**: Thermal receipt printer (optional)
- **Display**: 1280x720 minimum resolution
- **Network**: Required for real-time updates

### Software

- **OS**: Windows 10 or later
- **Browser**: Chrome, Firefox, or Edge (latest)
- **Node.js**: Included in application

---

## 📞 Support

### Common Questions

**Q: How do I add a new product?**
A: Use Add Product page, enter details, save.

**Q: How do I add stock?**
A: Use Add Stock page, scan/search product, enter quantity.

**Q: How do I check customer balance?**
A: Use Customers page or search in billing.

**Q: How do I view old bills?**
A: Use View Bills page, search by date/customer.

**Q: How do I close the store?**
A: Click Close Store button on dashboard.

### Need Help?

- Check TESTING_CHECKLIST.md for detailed tests
- Check IMPLEMENTATION_SUMMARY.md for technical details
- Check FIX_REPORT.md for fix documentation

---

## 🎓 Training Checklist

### For New Users

- [ ] Learn keyboard shortcuts
- [ ] Practice scan-first workflow
- [ ] Try customer billing
- [ ] Test real-time updates
- [ ] Practice manual entry
- [ ] Learn backup system

### For Existing Users

- [ ] Learn new shortcuts (Ctrl+Q, Shift+Enter)
- [ ] Try scan-first workflow (no popups!)
- [ ] Notice real-time updates (no refresh!)
- [ ] Use Edit Barcode button
- [ ] Check new backup naming

---

## ✅ Quick Reference Card

```
┌─────────────────────────────────────────┐
│     PUNCHIRI POS - QUICK REFERENCE      │
├─────────────────────────────────────────┤
│ SCAN → Add item (qty=1)                 │
│ Double Space → Product search           │
│ Shift+Space → Customer search           │
│ Shift+Enter → Payment field             │
│ Ctrl+Q → Remove last item               │
│ Ctrl+→ → Next bill                      │
│ Ctrl+← → Previous bill                  │
├─────────────────────────────────────────┤
│ WORKFLOW:                               │
│ 1. Scan products                        │
│ 2. Shift+Enter (payment)                │
│ 3. Enter amount                         │
│ 4. Enter (complete)                     │
└─────────────────────────────────────────┘
```

---

**Version**: 1.0
**Date**: April 1, 2026
**Status**: Production Ready

**Happy Selling! 🎉**
