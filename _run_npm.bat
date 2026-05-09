@echo off
REM 修复 npm 执行权限问题的批处理文件
REM 使用方法：_run_npm.bat test
cmd /c "npm %*"
