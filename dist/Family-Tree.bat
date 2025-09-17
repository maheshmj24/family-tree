@echo off
title Family Tree Application
cls
echo =====================================
echo    Family Tree Application
echo =====================================
echo.
echo Starting the application...
echo This will open in your web browser.
echo.

REM Try Edge (newer versions first)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --disable-web-security --user-data-dir="%TEMP%\family-tree-edge" --allow-file-access-from-files "%~dp0index.html"
    echo App opened in Edge!
    goto :success
)

REM Try Edge (x86)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --disable-web-security --user-data-dir="%TEMP%\family-tree-edge" --allow-file-access-from-files "%~dp0index.html"
    echo App opened in Edge!
    goto :success
)

REM Try Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="%TEMP%\family-tree-chrome" --allow-file-access-from-files "%~dp0index.html"
    echo App opened in Chrome!
    goto :success
)

REM Try Chrome (x86)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="%TEMP%\family-tree-chrome" --allow-file-access-from-files "%~dp0index.html"
    echo App opened in Chrome!
    goto :success
)

echo =====================================
echo   Browser Not Found
echo =====================================
echo.
echo Could not find Chrome or Edge browser.
echo.
echo Please install one of these browsers:
echo - Google Chrome
echo - Microsoft Edge
echo.
echo Then try running this file again.
echo.
pause
exit

:success
echo.
echo =====================================
echo   Success!
echo =====================================
echo.
echo The Family Tree app is now running
echo in your browser!
echo.
echo You can:
echo - Close this window
echo - Minimize this window
echo - Keep it open for reference
echo.
echo To stop the app, simply close the
echo browser tab or window.
echo.
timeout /t 5 /nobreak >nul
exit