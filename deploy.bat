@echo off
echo =========================================================
echo  BuildFlow AI - GitHub Repository Linker & Push Helper
echo =========================================================
echo.
echo Before running this, please create a new repository on GitHub:
echo - Name: ConstructionManagement
echo - Keep it Public or Private
echo - Do NOT initialize it with a README, license, or .gitignore
echo.
set /p REPO_URL="Paste your GitHub Repository URL (HTTPS): "

if "%REPO_URL%"=="" (
    echo Error: GitHub URL cannot be empty.
    pause
    exit /b
)

echo.
echo Linking repository to: %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing code to GitHub...
echo (If prompted, please log in or authorize GitHub in the pop-up window)
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push code to GitHub. Please check your credentials or URL.
) else (
    echo.
    echo =========================================================
    echo  SUCCESS: Code has been pushed to GitHub!
    echo =========================================================
    echo.
    echo Next Steps for Free Hosting:
    echo.
    echo 1. PostgreSQL Database:
    echo    - Sign up at https://neon.tech/ or https://supabase.com/
    echo    - Create a free database and copy the connection string.
    echo.
    echo 2. Deploy Backend on Render:
    echo    - Sign up/Login at https://render.com/
    echo    - Click "New" -> "Web Service" and connect your GitHub repo.
    echo    - Set Root Directory to: backend
    echo    - Set Build Command to: npm install && npm run build
    echo    - Set Start Command to: npm start
    echo    - Set Env Variables: DATABASE_URL (your connection string) and JWT_SECRET.
    echo.
    echo 3. Deploy Frontend on Vercel:
    echo    - Sign up/Login at https://vercel.com/
    echo    - Add new project -> import your GitHub repository.
    echo    - Set Root Directory to: frontend
    echo    - Add Env Variable: VITE_API_URL (pointing to your Render backend URL).
    echo    - Click Deploy!
)
echo.
pause
