
on escapeJsonString(str)
  set escapedStr to str
  set escapedStr to my replaceText(escapedStr, "\\", "\\\\")
  set escapedStr to my replaceText(escapedStr, "\"", "\\\"") 
  set escapedStr to my replaceText(escapedStr, return, "\\n")
  set escapedStr to my replaceText(escapedStr, linefeed, "\\n")
  set escapedStr to my replaceText(escapedStr, tab, "\\t")
  return escapedStr
end escapeJsonString

on replaceText(theText, searchStr, replaceStr)
  set AppleScript's text item delimiters to searchStr
  set textItems to text items of theText
  set AppleScript's text item delimiters to replaceStr
  set newText to textItems as text
  set AppleScript's text item delimiters to ""
  return newText
end replaceText

on valueToJson(val)
  if val is missing value then
    return "null"
  else if class of val is boolean then
    if val then
      return "true"
    else
      return "false"
    end if
  else if class of val is integer or class of val is real then
    return val as text
  else
    return "\"" & my escapeJsonString(val as text) & "\""
  end if
end valueToJson

tell application "Notes"
  set notesList to {}
  set counter to 0
  repeat with aNote in every note
    if counter ≥ 10 then
      exit repeat
    end if
    set counter to counter + 1
    try
      set end of notesList to {noteId:id of aNote, noteName:name of aNote, noteContent:plaintext of aNote, noteCreated:creation date of aNote as string, noteModified:modification date of aNote as string, noteShared:shared of aNote, noteProtected:password protected of aNote}
    on error
      -- Skip notes with errors
    end try
  end repeat
  set jsonParts to {}
  repeat with rec in notesList
    try
      set itemJson to "{"
      set itemJson to itemJson & "\"id\":" & my valueToJson(|noteId| of rec)
      set itemJson to itemJson & ",\"name\":" & my valueToJson(|noteName| of rec)
      set itemJson to itemJson & ",\"content\":" & my valueToJson(|noteContent| of rec)
      set itemJson to itemJson & ",\"created\":" & my valueToJson(|noteCreated| of rec)
      set itemJson to itemJson & ",\"modified\":" & my valueToJson(|noteModified| of rec)
      set itemJson to itemJson & ",\"shared\":" & my valueToJson(|noteShared| of rec)
      set itemJson to itemJson & ",\"passwordProtected\":" & my valueToJson(|noteProtected| of rec)
      set itemJson to itemJson & "}"
      set end of jsonParts to itemJson
    end try
  end repeat
  
  set AppleScript's text item delimiters to ","
  set jsonArray to "[" & (jsonParts as text) & "]"
  set AppleScript's text item delimiters to ""
  return jsonArray
end tell