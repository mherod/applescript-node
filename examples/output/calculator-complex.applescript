tell application "Calculator"
  activate
end tell
delay 0.5
tell application "System Events"
  tell application "System Events" to tell process "Calculator"
    keystroke "c"
    delay 0.2
    keystroke "2"
    delay 0.1
    keystroke "5"
    delay 0.2
    keystroke "/"
    delay 0.2
    keystroke "5"
    delay 0.2
    keystroke "\r"
    delay 0.3
    keystroke "+"
    delay 0.2
    keystroke "1"
    delay 0.1
    keystroke "0"
    delay 0.2
    keystroke "\r"
    delay 0.5
  end tell
end tell
tell application "Calculator"
  quit
end tell