@echo off
REM =========================================
REM Deployment Script with Version Increment
REM =========================================
REM Usage: deploy.bat "your commit message"
REM Example: deploy.bat "Added new feature"
REM =========================================

setlocal enabledelayedexpansion

REM Check if commit message is provided
if "%~1"=="" (
    echo ERROR: Please provide a commit message
    echo Usage: deploy.bat "your commit message"
    exit /b 1
)

set COMMIT_MSG=%~1

echo.
echo ====================================
echo   Deployment Script Started
echo ====================================
echo.

REM =========================================
REM Increment Frontend Build Number
REM =========================================
echo [1/5] Incrementing Frontend build number...

set FRONTEND_VERSION_FILE=frontend\public\version.json

REM Read current frontend version
for /f "tokens=2 delims=:, " %%a in ('type "%FRONTEND_VERSION_FILE%" ^| findstr "buildNumber"') do (
    set FRONTEND_BUILD=%%a
)

REM Remove any quotes or spaces
set FRONTEND_BUILD=!FRONTEND_BUILD: =!
set FRONTEND_BUILD=!FRONTEND_BUILD:"=!

REM Increment frontend build number
set /a NEW_FRONTEND_BUILD=!FRONTEND_BUILD! + 1

REM Write new frontend version
echo { > "%FRONTEND_VERSION_FILE%"
echo   "buildNumber": !NEW_FRONTEND_BUILD! >> "%FRONTEND_VERSION_FILE%"
echo } >> "%FRONTEND_VERSION_FILE%"

echo    Frontend Build: !FRONTEND_BUILD! -^> !NEW_FRONTEND_BUILD!

REM =========================================
REM Build Backend TypeScript
REM =========================================
echo [2.5/5] Building backend TypeScript...
cd backend
call npm run build
if errorlevel 1 (
    echo ERROR: Backend TypeScript build failed
    cd ..
    exit /b 1
)
cd ..
echo    Backend build completed successfully

REM =========================================
REM Git Add
REM =========================================
echo [3/5] Adding files to git...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files to git
    exit /b 1
)
echo    Files added successfully

REM =========================================
REM Git Commit
REM =========================================
echo [4/5] Committing changes...
git commit -m "%COMMIT_MSG% [Frontend: !NEW_FRONTEND_BUILD!]"
if errorlevel 1 (
    echo ERROR: Failed to commit changes
    echo Note: This might be because there are no changes to commit
    exit /b 1
)
echo    Commit created successfully

REM =========================================
REM Git Push
REM =========================================
echo [5/5] Pushing to remote repository...
git push origin main
if errorlevel 1 (
    echo ERROR: Failed to push to remote repository
    exit /b 1
)
echo    Pushed successfully

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo   Frontend Build: !NEW_FRONTEND_BUILD!
echo   Commit Message: %COMMIT_MSG%
echo ====================================
echo.
echo GitHub Actions will now deploy to VPS...
echo Check: https://github.com/Overproness/ERP.js/actions
echo.

endlocal
