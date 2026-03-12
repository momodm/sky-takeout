@echo off
echo Installing MySQL Service...
"D:\Bin\mysqld.exe" --install MySQL_Sky --defaults-file="E:\sky\my.ini"
if %errorlevel% neq 0 (
    echo Failed to install service. Please run as Administrator.
    pause
    exit /b
)
echo Starting MySQL Service...
net start MySQL_Sky
echo Done.
pause