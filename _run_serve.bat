@echo off
cd /d D:\workspace\ngx-datawindow
call npm run start > _serve_out.txt 2>&1
echo EXIT: %ERRORLEVEL% >> _serve_out.txt