const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, 'src', 'app', 'api');
const tempPath = path.join(__dirname, 'src', 'api-temp');

let apiMoved = false;

try {
  // 1. Move src/app/api to src/api-temp if it exists
  if (fs.existsSync(apiPath)) {
    console.log('📦 Temporarily moving src/app/api to src/api-temp to prevent Next.js static build errors...');
    fs.renameSync(apiPath, tempPath);
    apiMoved = true;
  }

  // 2. Run next build
  console.log('🚀 Running Next.js build...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      CAPACITOR_BUILD: 'true'
    }
  });
  console.log('✅ Next.js build completed successfully!');

} catch (error) {
  console.error('❌ Build failed during Next.js build:', error);
  process.exitCode = 1;
} finally {
  // 3. Move src/api-temp back to src/app/api
  if (apiMoved && fs.existsSync(tempPath)) {
    console.log('🔄 Restoring src/app/api from src/api-temp...');
    fs.renameSync(tempPath, apiPath);
    console.log('✅ src/app/api successfully restored!');
  }
}
