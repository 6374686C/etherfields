@echo off
title Deploy to GitHub
cls
color 0A

setlocal enabledelayedexpansion

:: ----------------------------------------
:: Read current version from constants.ts
:: ----------------------------------------
for /f "tokens=3 delims= " %%A in ('findstr "APP_VERSION" constants.ts') do (
    set "VERSION_RAW=%%A"
)
set "VERSION_RAW=!VERSION_RAW:'=!"
set "VERSION_RAW=!VERSION_RAW:;=!"
set "VERSION_RAW=!VERSION_RAW:~=!"
set "CURRENT_VERSION=!VERSION_RAW!"
echo ----------------------------------------
echo 📦 Current version: !CURRENT_VERSION!
echo ----------------------------------------

:: ----------------------------------------
:: Ask if user wants to update version
:: ----------------------------------------
set /p "CHOICE=Do you want to update the version? [Y/n]: "
if /i "%CHOICE%"=="" set "CHOICE=Y"

if /i "%CHOICE%"=="Y" (
    set /p "NEW_VERSION=Enter new version number (e.g. 1.0.9): "
    if not "%NEW_VERSION%"=="" (
        powershell -Command "(Get-Content 'constants.ts') -replace 'APP_VERSION = ''.*'';', 'APP_VERSION = ''%NEW_VERSION%'';' | Set-Content 'constants.ts'"
        echo ✅ Version updated to %NEW_VERSION%
    ) else (
        echo ⚠️  No version entered, keeping %CURRENT_VERSION%.
    )
) else (
    echo 🔹 Version unchanged.
)

:: ----------------------------------------
:: Install & build
:: ----------------------------------------
echo ----------------------------------------
echo 🔧 Installing dependencies...
echo ----------------------------------------
npm install

echo ----------------------------------------
echo 🏗️ Building project...
echo ----------------------------------------
npm run build

:: ----------------------------------------
:: Git add, commit and push
:: ----------------------------------------
git add .
git status

echo ----------------------------------------
echo 📝 Enter your commit message below.
echo (Press Ctrl+Z then Enter when done)
echo ----------------------------------------
set "TEMPFILE=%temp%\commitmsg.txt"
type nul > "%TEMPFILE%"
copy con "%TEMPFILE%"
git commit -F "%TEMPFILE%"
del "%TEMPFILE%"

echo ----------------------------------------
echo 📤 Pushing to GitHub...
echo ----------------------------------------
git push origin main

echo ✅ Deployment complete!
pause
endlocal
