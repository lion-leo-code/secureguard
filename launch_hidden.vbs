Set WshShell = CreateObject("WScript.Shell")
' The 0 at the end forces the window to be completely invisible
WshShell.Run chr(34) & "C:\secureguard\start_sentry.bat" & Chr(34), 0
Set WshShell = Nothing