@echo off
rem Windows launcher: Git Bash only. Never launch WSL.
setlocal
if defined GIT_BASH goto run
for %%B in ("%ProgramFiles%\Git\bin\bash.exe" "%ProgramFiles(x86)%\Git\bin\bash.exe" "%LocalAppData%\Programs\Git\bin\bash.exe") do (
  if exist "%%~B" (
    set "GIT_BASH=%%~B"
    goto run
  )
)
for %%G in (git.exe) do for %%P in ("%%~$PATH:G") do (
  if exist "%%~dpP..\bin\bash.exe" (
    set "GIT_BASH=%%~dpP..\bin\bash.exe"
    goto run
  )
)
echo [error] Git Bash not found. Install Git for Windows or set GIT_BASH to bin\bash.exe.
exit /b 1

:run
if not exist "%GIT_BASH%" (
  echo [error] GIT_BASH does not point to an existing bash.exe.
  exit /b 1
)
pushd "%~dp0.."
if errorlevel 1 exit /b 1
echo [deploy] Using Git Bash: "%GIT_BASH%"
"%GIT_BASH%" "%~dp0deploy-local.sh" %*
set "DEPLOY_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %DEPLOY_EXIT_CODE%
