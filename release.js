const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// Configuration
const OWNER = 'Adam07253';
const REPO = 'punchiri-pos';
const DIST_DIR = path.join(__dirname, 'dist');

// Read version from package.json
const packageJson = require('./package.json');
const VERSION = packageJson.version;
const TAG = `v${VERSION}`;
const RELEASE_NAME = `Punchiri POS v${VERSION}`;

// Files to upload
const FILES_TO_UPLOAD = [
  'Punchiri POS.exe'
];

async function main() {
  try {
    console.log('🚀 Starting automated release process...\n');

    // Set environment variable to skip code signing
    process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

    // Step 1: Build the app
    console.log('📦 Building app...');
    execSync('npm run build', { stdio: 'inherit', env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } });
    console.log('✅ Build completed\n');

    // Step 2: Validate build files
    console.log('🔍 Validating build files...');
    if (!fs.existsSync(DIST_DIR)) {
      throw new Error(`Build directory not found: ${DIST_DIR}`);
    }

    const missingFiles = [];
    FILES_TO_UPLOAD.forEach(file => {
      const filePath = path.join(DIST_DIR, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }
    console.log('✅ All required files found\n');

    // Step 3: Authenticate with GitHub
    console.log('🔐 Authenticating with GitHub...');
    const token = process.env.GH_TOKEN;
    if (!token) {
      throw new Error('GH_TOKEN not found in environment variables');
    }

    const octokit = new Octokit({ auth: token });
    console.log('✅ Authentication successful\n');

    // Step 4: Create GitHub Release
    console.log(`📝 Creating GitHub release: ${RELEASE_NAME}...`);
    const release = await octokit.repos.createRelease({
      owner: OWNER,
      repo: REPO,
      tag_name: TAG,
      name: RELEASE_NAME,
      body: `Auto-generated release for Punchiri POS version ${VERSION}`,
      draft: false,
      prerelease: false
    });
    console.log(`✅ Release created: ${release.data.html_url}\n`);

    // Step 5: Upload assets
    console.log('📤 Uploading files...');
    for (const fileName of FILES_TO_UPLOAD) {
      const filePath = path.join(DIST_DIR, fileName);
      const fileStats = fs.statSync(filePath);
      const fileSize = (fileStats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`  Uploading ${fileName} (${fileSize} MB)...`);
      
      const fileContent = fs.readFileSync(filePath);
      
      await octokit.repos.uploadReleaseAsset({
        owner: OWNER,
        repo: REPO,
        release_id: release.data.id,
        name: fileName,
        data: fileContent
      });
      
      console.log(`  ✅ ${fileName} uploaded successfully`);
    }

    console.log('\n🎉 Release created successfully!');
    console.log(`🔗 Release URL: ${release.data.html_url}`);
    console.log(`📦 Version: ${VERSION}`);
    console.log(`🏷️  Tag: ${TAG}`);

  } catch (error) {
    console.error('\n❌ Release process failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
