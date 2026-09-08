@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo [1/3] إنشاء مجلد public\apk...
if not exist "public\apk" mkdir "public\apk"

echo [2/3] نسخ الملفات إلى public\apk...
copy /y "public\download\yaqeen.apk" "public\apk\yaqeen.apk"
copy /y "public\download\yaqeen-v7a.apk" "public\apk\yaqeen-v7a.apk"

echo [3/3] نسخ الملفات مباشرة إلى public...
copy /y "public\download\yaqeen.apk" "public\yaqeen.apk"
copy /y "public\download\yaqeen-v7a.apk" "public\yaqeen-v7a.apk"

echo.
echo تم بنجاح نسخ الملفات لتكون متاحة للتحميل الفوري بدون أي تداخل مع Next.js!
pause
