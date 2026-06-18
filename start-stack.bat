@echo off
setlocal EnableExtensions
title Starting MyWebStack (Apache + MySQL)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-stack.ps1"

pause
