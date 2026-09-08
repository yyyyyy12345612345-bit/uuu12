@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================================
echo   إصلاح Git LFS وتضمين ملف الـ APK الحقيقي (9.2 MB)
echo ========================================================
echo.

echo [1/4] إلغاء تتبع Git LFS لملفات الـ APK...
git rm --cached public\download\yaqeen.apk public\download\yaqeen-v7a.apk 2>nul
git rm --cached public\apk\yaqeen.apk public\apk\yaqeen-v7a.apk 2>nul

echo.
echo [2/4] نسخ ملفات الـ APK الحقيقية إلى مجلد public\apk...
if not exist "public\apk" mkdir "public\apk"
copy /y "..\yaqeen_flutter_app\build\app\outputs\flutter-apk\app-arm64-v8a-release.apk" "public\apk\yaqeen.apk"
copy /y "..\yaqeen_flutter_app\build\app\outputs\flutter-apk\app-armeabi-v7a-release.apk" "public\apk\yaqeen-v7a.apk"
copy /y "..\yaqeen_flutter_app\build\app\outputs\flutter-apk\app-arm64-v8a-release.apk" "public\download\yaqeen.apk"
copy /y "..\yaqeen_flutter_app\build\app\outputs\flutter-apk\app-armeabi-v7a-release.apk" "public\download\yaqeen-v7a.apk"

echo.
echo [3/4] إضافة الملفات الأصلية كملفات عادية في Git (بدون LFS)...
git add .gitattributes
git add -f public\apk\yaqeen.apk
git add -f public\apk\yaqeen-v7a.apk
git add -f public\download\yaqeen.apk
git add -f public\download\yaqeen-v7a.apk
git add .

echo.
echo [4/4] عمل Commit و Push...
git commit -m "fix: commit real 9.2MB APK binary directly without Git LFS pointers"
git push -u origin main

echo.
echo ========================================================
echo   تم الرفع بنجاح! ملف الـ APK بحجم 9.2 MB متاح الآن.
echo ========================================================
echo.
pause
