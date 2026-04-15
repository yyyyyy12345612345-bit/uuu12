const fs = require('fs');
const path = require('path');

const artifactPath = 'C:\\Users\\youse\\.gemini\\antigravity\\brain\\eac64f7f-6752-4f50-b655-94e4c505a74b\\icon_512_1776117937511.png';
const publicDir = path.join(__dirname, 'public');

if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(artifactPath, path.join(publicDir, 'icon-512.png'));
    fs.copyFileSync(artifactPath, path.join(publicDir, 'icon-192.png')); // We can use 512 for 192 too as a fallback
    console.log('Icons copied successfully to public folder.');
} else {
    console.log('Artifact icon not found at: ' + artifactPath);
    // If not found, we create a simple placeholder or tell user
}
