tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events"
  tell application "System Events" to tell process "Calculator"
    set windowName to name of window 1
    set windowPosition to position of window 1
    set windowSize to size of window 1
    set info to "Window: " & windowName & ", Position: " & (item 1 of windowPosition) & "," & (item 2 of windowPosition) & ", Size: " & (item 1 of windowSize) & "x" & (item 2 of windowSize)
  end tell
end tell
tell application "Calculator"
  quit
end tell
return info