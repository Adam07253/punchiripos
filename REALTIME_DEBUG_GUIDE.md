# Real-Time Updates Debug Guide

## Issue
Products added to the system are not updating in real-time on the billing page without a refresh.

## What Was Fixed

### 1. Enhanced Real-Time Event Handlers
- Added better logging to track when events are received
- Added toast notifications when products are added/updated
- Added connection status monitoring

### 2. Connection Status Indicator
- Added a live status indicator in the top-right corner of the billing page
- Shows:
  - **Green "Live"** = WebSocket connected and working
  - **Yellow "Reconnecting..."** = Temporarily disconnected, attempting to reconnect
  - **Red "Offline"** = Connection failed

### 3. Debug Test Page
- Created `frontend/test-realtime.html` for testing the connection
- Access it at: `http://localhost:3000/test-realtime.html`

## How to Test

### Step 1: Check Server is Running
1. Open terminal
2. Run: `node server.js`
3. You should see: "Server running on http://localhost:3000"

### Step 2: Test Connection
1. Open browser to: `http://localhost:3000/test-realtime.html`
2. Click "Test Server (HTTP)" - should show ✓ Server is running
3. Click "Test WebSocket" - should show ✓ WebSocket is connected
4. Watch the Event Log for real-time messages

### Step 3: Test Real-Time Updates
1. Open TWO browser windows:
   - Window 1: `http://localhost:3000/billing_v2.html`
   - Window 2: `http://localhost:3000/products.html`

2. In Window 1 (Billing):
   - Check the status indicator in top-right corner
   - Should show **Green "Live"** if connected
   - Open browser console (F12) to see logs

3. In Window 2 (Products):
   - Add a new product
   - Fill in all required fields
   - Click "Add Product"

4. In Window 1 (Billing):
   - You should see:
     - A toast notification: "✓ New product added: [Product Name]"
     - Console log: "🔔 Product added event received"
     - The product should now be searchable without refresh

### Step 4: Check Console Logs
Open browser console (F12) in the billing page and look for:

**Good signs:**
```
✓ Real-time client available, setting up event handlers...
✓ WebSocket connected successfully
✓ Products loaded successfully (X products)
🔔 Product added event received: {name: "..."}
✓ Products reloaded (X products)
```

**Bad signs:**
```
❌ Real-time client not available!
⚠ WebSocket not connected yet
✗ WebSocket failed to connect
```

## Common Issues & Solutions

### Issue 1: "Server Connection Failed" Error
**Cause:** Server is not running or not accessible
**Solution:**
1. Make sure server is running: `node server.js`
2. Check if port 3000 is available
3. Try accessing: `http://localhost:3000/products` in browser
4. Should return JSON array of products

### Issue 2: Status Shows "Reconnecting..." or "Offline"
**Cause:** WebSocket connection failed
**Solution:**
1. Check server console for WebSocket errors
2. Make sure no firewall is blocking WebSocket connections
3. Try restarting the server
4. Clear browser cache (Ctrl + Shift + R)

### Issue 3: Products Don't Update in Real-Time
**Cause:** Event handlers not receiving broadcasts
**Solution:**
1. Check if status indicator shows "Live" (green)
2. Open console and verify: `window.realtimeClient.isConnected` returns `true`
3. Check server console when adding product - should show:
   ```
   Client connected to real-time sync
   ```
4. Verify the broadcast is being sent from server

### Issue 4: Toast Notifications Don't Show
**Cause:** `nbToast` function not available
**Solution:**
1. Make sure `nonBlockingUI.js` is loaded before the billing script
2. Check console for errors related to `nbToast`
3. The products should still reload even if toast doesn't show

## Manual Testing Commands

Open browser console on billing page and run:

```javascript
// Check if realtimeClient exists
console.log('Client exists:', !!window.realtimeClient);

// Check connection status
console.log('Connected:', window.realtimeClient?.isConnected);

// Check WebSocket URL
console.log('WebSocket URL:', window.realtimeClient?.url);

// Manually trigger product reload
fetch('http://localhost:3000/products')
  .then(r => r.json())
  .then(products => console.log('Products:', products.length));

// Test toast notification
if (window.nbToast) {
  nbToast('Test notification', 'success', 3000);
}
```

## Expected Behavior

When everything is working correctly:

1. **Billing page loads:**
   - Status indicator shows "Live" (green)
   - Console shows "✓ WebSocket connected successfully"

2. **Product is added in products.html:**
   - Server broadcasts `product:added` event
   - Billing page receives event
   - Products are automatically reloaded
   - Toast notification appears
   - Product is immediately searchable

3. **No page refresh needed:**
   - Products update automatically
   - User sees toast notification
   - Seamless experience

## Files Modified

1. `frontend/billing_v2.html`
   - Enhanced real-time event handlers with better logging
   - Added connection status indicator
   - Added connection status update functions

2. `frontend/test-realtime.html` (NEW)
   - Diagnostic page for testing connections
   - Real-time event monitoring
   - Connection testing tools

## Next Steps

If the issue persists after following this guide:

1. Run the test page: `http://localhost:3000/test-realtime.html`
2. Take a screenshot of the Event Log
3. Copy the browser console output from billing page
4. Copy the server console output
5. Share these for further debugging

The real-time system is now properly instrumented with logging and status indicators to help identify exactly where the connection is failing.
