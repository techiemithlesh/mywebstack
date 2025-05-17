@echo off
title Stopping MyWebStack (Apache + MySQL)
echo Stopping Apache...
taskkill /F /IM httpd.exe >nul 2>&1
echo Stopping MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
echo All services stopped.

pause
