const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, 'public', 'logo', 'logo.png');
const ANDROID_RES_PATH = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const mipmapFolders = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];

if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Error: logo.png not found at ' + LOGO_PATH);
    process.exit(1);
}

console.log('🚀 Starting to update Android icons...');

mipmapFolders.forEach(folder => {
    const targetFolder = path.join(ANDROID_RES_PATH, folder);
    if (fs.existsSync(targetFolder)) {
        // تحديث الأيقونة العادية
        fs.copyFileSync(LOGO_PATH, path.join(targetFolder, 'ic_launcher.png'));
        // تحديث الأيقونة الدائرية (مهم جداً للاندرويد الحديث)
        fs.copyFileSync(LOGO_PATH, path.join(targetFolder, 'ic_launcher_round.png'));
        console.log(`✅ Updated icons in ${folder}`);
    }
});

console.log('✨ Successfully updated all Android icons to your website logo!');
