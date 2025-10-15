tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events" to tell process "Calculator"
  set winName to name of window 1
  set winPosition to position of window 1 as text
  set winSize to size of window 1 as text
end tell
tell application "Calculator"
  quit
end tell
return "{" & "\"name\":\"" & winName & "\"" & ",\"position\":\"" & winPosition & "\"" & ",\"size\":\"" & winSize & "\"" & "}"