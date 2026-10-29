@echo off
rem ============================================================
rem  Interview deploy launcher -- DOUBLE-CLICK this file to run.
rem
rem  Why .bat instead of double-clicking deploy-local.sh?
rem  A .sh file cannot be double-clicked on Windows; it would be
rem  opened by git-bash and the window closes as soon as the
rem  script exits (esp. on an error, because the script uses
rem  "set -e"), so you never see what happened -> "git pops up
rem  and then it's gone".
rem
rem  This launcher runs the real script inside WSL (this machine
rem  has WSL, not Git-for-Windows), then PAUSES so the window
rem  stays open and you can read the result.
rem ============================================================
setlocal

rem --- repo root = parent of the folder that holds this .bat (deploy\) ---
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
cd /d "%ROOT%"

echo ============================================================
echo  Interview deploy
echo  Repo   : %ROOT%
echo  Action : bash deploy/deploy-local.sh
echo ============================================================
echo.

rem --- Prefer WSL (this machine has WSL, no Git-for-Windows) ---
where wsl.exe >nul 2>&1
if %errorlevel%==0 (
  echo [launch] Using WSL bash ...
  wsl.exe --cd "%ROOT%" bash deploy/deploy-local.sh
  goto :finish
)

rem --- Fallback: Git for Windows, if ever installed ---
set "GITBASH=%ProgramFiles%\Git\bin\bash.exe"
if not exist "%GITBASH%" set "GITBASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if exist "%GITBASH%" (
  echo [launch] Using Git Bash ...
  "%GITBASH%" -lc "cd '%ROOT%' && bash deploy/deploy-local.sh"
  goto :finish
)

echo [error] No bash available. Please run manually in Git Bash or WSL:
echo         bash deploy/deploy-local.sh

:finish
echo.
echo ============================================================
echo  Finished   (exit code %errorlevel%)
echo ============================================================
echo  Press any key to close this window...
pause >nul
