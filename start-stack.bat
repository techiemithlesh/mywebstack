@echo off
title Starting MyWebStack (Apache + MySQL)
echo Starting Apache...
start "" "C:\MyWebStack\apache\Apache24\bin\httpd.exe"
echo Apache started.

echo Starting MySQL...
start "" "C:\MyWebStack\mysql\bin\mysqld.exe" --defaults-file="C:\MyWebStack\mysql\my.ini"
echo MySQL started.

pause
