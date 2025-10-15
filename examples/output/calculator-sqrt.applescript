tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events"
  tell application "System Events" to tell process "Calculator"
    keystroke "c"
    delay 0.1
    keystroke "9"
    delay 0.2
    keystroke "/" using {command, shift}
    delay 0.3
    set resultValue to value of static text 1 of group 1 of window 1
  end tell
end tell
return resultValue