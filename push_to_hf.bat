@echo off
title Hugging Face Render Server Deployer
cd /d "%~dp0"

echo =========================================================
echo   Hugging Face Render Server Auto Deployer
echo =========================================================
echo.

node auto_hf_bot.js

echo.
echo =========================================================
echo   Press any key to exit...
echo =========================================================
pause >nul
