tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events" to tell process "Calculator"
  keystroke "c"
  delay 0.2
  keystroke "5"
  delay 0.1
  keystroke "+"
  delay 0.1
  keystroke "3"
  keystroke "\r"
  delay 0.5
end tell
tell application "Calculator"
  quit
end tell