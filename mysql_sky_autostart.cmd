@echo off
set "MYSQLD=E:\MySQL\mysql-8.0.45-winx64\bin\mysqld.exe"
set "MYINI=E:\sky\my.ini"
netstat -ano | findstr LISTENING | findstr :3306 >nul
if not errorlevel 1 exit /b 0
tasklist /FI "IMAGENAME eq mysqld.exe" | find /I "mysqld.exe" >nul
if not errorlevel 1 exit /b 0
start "" /min "%MYSQLD%" "--defaults-file=%MYINI%"
