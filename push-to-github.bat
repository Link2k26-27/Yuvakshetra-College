@echo off
title Push to GitHub - Yuvakshetra-College
echo ===================================================
echo Pushing Hostel Hub to https://github.com/link2k26-27/Yuvakshetra-College
echo ===================================================
echo.
cd /d "%~dp0"

echo Running: git push -u origin main
echo (If a GitHub sign-in window appears, click "Sign in with your browser")
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo SUCCESS! Your code has been uploaded to GitHub!
    echo Your live website will be available at:
    echo https://link2k26-27.github.io/Yuvakshetra-College/
    echo ===================================================
) else (
    echo ===================================================
    echo Push incomplete. Please review any error above.
    echo ===================================================
)
echo.
pause
