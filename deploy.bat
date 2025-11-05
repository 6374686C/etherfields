@echo off
cd /d "%~dp0"

echo.
echo ===============================
echo   Web App Build & Push Tool
echo ===============================
echo.

REM Check if we're in a Git repo
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo This folder is not a Git repository!
    pause
    exit /b
)

echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo !!! npm install failed !!!
    pause
    exit /b
)

echo.
echo Building project...
call npm run build
if errorlevel 1 (
    echo.
    echo !!! Build failed !!!
    pause
    exit /b
)

echo.
echo Adding all changes...
git add .

echo.
echo Current status:
git status

echo.
set /p commit_msg=Enter commit message: 

if "%commit_msg%"=="" (
    set commit_msg=Auto commit
)

echo.
echo Committing with message: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo Pushing to remote...
git push

echo.
echo Done!
pause
