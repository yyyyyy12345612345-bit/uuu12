const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'اذان');
const destDir = path.join(__dirname, 'public', 'adhan');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

// Read and copy each file
if (fs.existsSync(srcDir)) {
    fs.readdirSync(srcDir).forEach(file => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied: ${file}`);
    });
    console.log('Transfer complete!');
} else {
    console.log('Source directory "اذان" not found.');
}
