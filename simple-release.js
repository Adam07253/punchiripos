const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const OWNER = 'Adam07253';
const REPO = 'punchiripos';
const DIST_DIR = path.join(__dirname, 'dist', 'win-unpacked');

// Read version from package.json
const packageJson = require('./package.json');
const VERSION = packageJson.version;
const TAG = `v${VERSION}`;
const RELEASE_NAME = `Punchiri POS v${VERSION}`;

// Get today's date for filename
const today = new Date().toISOString().split('T')[0];
const ZIP_NAME = `Punchiri-POS-v${VERSION}-${today}.zip`;
const ZIP_PATH = path.join(__dirname, ZIP_NAME);

async function main() {
  try {
    console.log('🚀 Starting simple release process...\n');

    // Step 1: Check if unpacked build exists
    console.log('🔍 Checking for existing build...');
    if (!fs.existsSync(DIST_DIR)) {
      console.log('❌ No build found at dist/win-unpacked');
      console.log('📦 Please run your app normally first, or run: npm start');
      console.log('   This will create the necessary files.');
      process.exit(1);
    }
    console.log('✅ Build found\n');

    // Step 2: Create ZIP file
    console.log(`📦 Creating portable ZIP: ${ZIP_NAME}...`);
    
    // Remove old zip if exists
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }

    // Create zip using PowerShell
    const psCommand = `Compress-Archive -Path "${DIST_DIR}\\*" -DestinationPath "${ZIP_PATH}" -CompressionLevel Optimal`;
    execSync(psCommand, { shell: 'powershell.exe' });

    if (!fs.existsSync(ZIP_PATH)) {
      throw new Error('Failed to create ZIP file');
    }

    const fileSize = (fs.statSync(ZIP_PATH).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP created (${fileSize} MB)\n`);

    // Step 3: Authenticate with GitHub
    console.log('🔐 Authenticating with GitHub...');
    const token = process.env.GH_TOKEN;
    if (!token) {
      throw new Error('GH_TOKEN not found in .env file');
    }

    const octokit = new Octokit({ auth: token });
    console.log('✅ Authentication successful\n');

    // Step 4: Create GitHub Release
    console.log(`📝 Creating GitHub release: ${RELEASE_NAME}...`);
    const releaseBody = `## Punchiri POS v${VERSION}

**Release Date:** ${today}

### Installation Instructions
1. Download the ZIP file below
2. Extract it to any folder on your computer
3. Run "Punchiri POS.exe"
4. No installation required!

### Note
If Windows SmartScreen shows a warning, click "More info" → "Run anyway"

---
*Auto-generated release*`;

    const release = await octokit.repos.createRelease({
      owner: OWNER,
      repo: REPO,
      tag_name: TAG,
      name: RELEASE_NAME,
      body: releaseBody,
      draft: false,
      prerelease: false
    });
    console.log(`✅ Release created: ${release.data.html_url}\n`);

    // Step 5: Upload ZIP file
    console.log(`📤 Uploading ${ZIP_NAME}...`);
    const fileContent = fs.readFileSync(ZIP_PATH);
    
    await octokit.repos.uploadReleaseAsset({
      owner: OWNER,
      repo: REPO,
      release_id: release.data.id,
      name: ZIP_NAME,
      data: fileContent
    });
    
    console.log(`✅ File uploaded successfully\n`);

    // Step 6: Cleanup
    console.log('🧹 Cleaning up...');
    fs.unlinkSync(ZIP_PATH);
    console.log('✅ Temporary ZIP removed\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 RELEASE COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`🔗 Release URL: ${release.data.html_url}`);
    console.log(`📦 Version: ${VERSION}`);
    console.log(`🏷️  Tag: ${TAG}`);
    console.log(`📁 File: ${ZIP_NAME}`);
    console.log(`💾 Size: ${fileSize} MB`);
    console.log('\n✨ Your client can now download and run the app!');

  } catch (error) {
    console.error('\n❌ Release process failed:');
    console.error(error.message);
    
    // Cleanup on error
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }
    
    process.exit(1);
  }
}

main();
