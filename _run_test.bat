@echo off
REM 运行测试的批处理文件
echo Running ngx-datawindow tests...
cmd /c "ng test --no-watch --browsers=ChromeHeadless"
