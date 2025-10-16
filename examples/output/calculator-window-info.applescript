tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events" to tell process "Calculator"
  set winName to name of window 1
  set positionList to position of window 1
  set sizeList to size of window 1
  set positionX to item 1 of positionList
  set positionY to item 2 of positionList
  set sizeWidth to item 1 of sizeList
  set sizeHeight to item 2 of sizeList
end tell
tell application "Calculator"
  quit
end tell
return "{" & "\"name\":\"" & winName & "\"" & ",\"positionX\":\"" & positionX & "\"" & ",\"positionY\":\"" & positionY & "\"" & ",\"sizeWidth\":\"" & sizeWidth & "\"" & ",\"sizeHeight\":\"" & sizeHeight & "\"" & "}"