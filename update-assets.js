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
        // Update standard icon
        fs.copyFileSync(LOGO_PATH, path.join(targetFolder, 'ic_launcher.png'));
        // Update round icon
        fs.copyFileSync(LOGO_PATH, path.join(targetFolder, 'ic_launcher_round.png'));
        // Update foreground icon (Crucial for modern Android Adaptive Icons)
        fs.copyFileSync(LOGO_PATH, path.join(targetFolder, 'ic_launcher_foreground.png'));
        console.log(`✅ Updated icons and foreground in ${folder}`);
    }
});

// Ensure raw folder exists for Adhan sounds
const rawFolder = path.join(ANDROID_RES_PATH, 'raw');
if (!fs.existsSync(rawFolder)) {
    fs.mkdirSync(rawFolder, { recursive: true });
    console.log('📁 Created res/raw folder');
}

// Copy a default adhan file to res/raw for notifications
const ADHAN_SRC = path.join(__dirname, 'public', 'adhan', 'الحرم المكي.mp3');
if (fs.existsSync(ADHAN_SRC)) {
    // Android notifications prefer small files, but we'll use this for now
    // Note: It must be named with lowercase letters and underscores only
    fs.copyFileSync(ADHAN_SRC, path.join(rawFolder, 'adhan.mp3'));
    console.log('🎵 Copied adhan.mp3 to res/raw');
}

console.log('✨ Successfully updated all Android icons and assets!');
