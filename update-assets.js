const fs = require('fs');
const path = require('path');

const logoSource = path.join(__dirname, 'public', 'logo', 'logo.png');
const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const iconFolders = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
];

if (!fs.existsSync(logoSource)) {
    console.error('Source logo not found at: ' + logoSource);
    process.exit(1);
}

iconFolders.forEach(folder => {
    const targetFolder = path.join(androidResDir, folder);
    if (fs.existsSync(targetFolder)) {
        const targetPath = path.join(targetFolder, 'ic_launcher.png');
        const targetPathRound = path.join(targetFolder, 'ic_launcher_round.png');
        
        fs.copyFileSync(logoSource, targetPath);
        fs.copyFileSync(logoSource, targetPathRound);
        console.log(`Updated icons in ${folder}`);
    }
});

console.log('Successfully updated all Android icons to the website logo.');
