@echo off
pushd "C:\secureguard"

:: Start Python in invisible background mode
start "" "C:\Users\aniak\AppData\Local\Microsoft\WindowsApps\pythonw.exe" pc_brain.py

:: Use a silent ping instead of 'timeout' to wait without opening a window
ping 127.0.0.1 -n 4 > nul

:: Start Ngrok completely hidden
start "" /b ngrok http --url=phenomenologically-unbemoaned-kimberley.ngrok-free.dev 5000

exit