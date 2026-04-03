# Quick Build Instructions

## 🚀 Build the Application

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Build the Installer
```bash
npm run build
```

### 3. Output Files
After build completes, find in `dist/` folder:
- `Punchiri POS Setup.exe` - The installer (upload to GitHub)
- `latest.yml` - Update metadata (upload to GitHub)

---

## 📤 Upload to GitHub

### Method 1: Manual Upload (Recommended)
1. Go to: https://github.com/Adam07253/punchiri-pos/releases
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: `Punchiri POS v1.0.0`
5. Upload both files from `dist/` folder
6. Click "Publish release"

### Method 2: Automated (Requires GH_TOKEN)
```bash
# Set token first
$env:GH_TOKEN="your_github_token_here"

# Build and publish
npm run build -- --publish always
```

---

## ✅ Verify Build

### Before Uploading
1. Install the `.exe` file locally
2. Test the app:
   - Login works
   - Billing works
   - Products load
   - Backup works
3. Check console for errors (F12)

---

## 🔄 For Future Updates

### Update Version
1. Edit `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Create new GitHub release with tag `v1.0.1`

4. Upload new files

5. Users get auto-update!

---

## 🛑 Important Notes

- ✅ DO build with `npm run build`
- ✅ DO test before releasing
- ✅ DO upload both `.exe` and `.yml` files
- ❌ DON'T commit `.env` file
- ❌ DON'T commit database files
- ❌ DON'T commit `dist/` folder

---

## 📞 Quick Troubleshooting

### Build fails?
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Can't upload to GitHub?
- Check internet connection
- Verify GitHub token
- Ensure repo exists: Adam07253/punchiri-pos

---

**Ready to build? Run:** `npm run build`
