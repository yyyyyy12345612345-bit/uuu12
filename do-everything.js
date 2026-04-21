const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- بدء عملية التحديث الشاملة ---');

// 1. حذف المجلد القديم المسبب للكرش
const oldDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', 'com');
if (fs.existsSync(oldDir)) {
    console.log('جاري حذف المجلد القديم...');
    fs.rmSync(oldDir, { recursive: true, force: true });
}

// 2. تحديث الأيقونات
console.log('جاري تحديث أيقونات التطبيق...');
try {
    const logoSource = path.join(__dirname, 'public', 'logo', 'logo.png');
    const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
    const iconFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

    if (fs.existsSync(logoSource)) {
        iconFolders.forEach(folder => {
            const targetFolder = path.join(androidResDir, folder);
            if (fs.existsSync(targetFolder)) {
                fs.copyFileSync(logoSource, path.join(targetFolder, 'ic_launcher.png'));
                fs.copyFileSync(logoSource, path.join(targetFolder, 'ic_launcher_round.png'));
            }
        });
        console.log('تم تحديث الشعار بنجاح.');
    }
} catch (e) {
    console.log('تنبيه: فشل تحديث الأيقونات، سيتم الإكمال بدونها.');
}

// 3. مزامنة Capacitor
console.log('جاري عمل Sync لمشروع الأندرويد...');
try {
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log('تمت المزامنة بنجاح.');
} catch (e) {
    console.log('خطأ أثناء المزامنة، تأكد من تنصيب Capacitor.');
}

console.log('\n--- انتهيت! كل شيء جاهز الآن ---');
console.log('الآن افتح Android Studio وقم بعمل Build APK وستجد كل شيء يعمل.');
