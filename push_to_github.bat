@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo   Auto GitHub Push - Yaqeen AlQuran
echo ========================================================
echo.

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Auto Update: Yaqeen AlQuran Admin and Prayer System"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ========================================================
echo   Finished! All updates pushed to GitHub.
echo ========================================================
echo.
pause
