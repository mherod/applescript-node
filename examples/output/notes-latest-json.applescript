
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
  set __collected_items to {}
  set __counter to 0
  repeat with aNote in every note
    if __counter >= 10 then
      exit repeat
    end if
    set __counter to __counter + 1
    try
      set end of __collected_items to {id:id of aNote, name:name of aNote, content:plaintext of aNote, created:creation date of aNote as string, modified:modification date of aNote as string, shared:shared of aNote, passwordProtected:password protected of aNote}
    on error
      -- Skip items with errors
    end try
  end repeat
  set jsonParts to {}
  repeat with rec in __collected_items
    try
      set itemJson to "{"
      set itemJson to itemJson & "\"id\":" & my valueToJson(id of rec)
      set itemJson to itemJson & ",\"name\":" & my valueToJson(name of rec)
      set itemJson to itemJson & ",\"content\":" & my valueToJson(content of rec)
      set itemJson to itemJson & ",\"created\":" & my valueToJson(created of rec)
      set itemJson to itemJson & ",\"modified\":" & my valueToJson(modified of rec)
      set itemJson to itemJson & ",\"shared\":" & my valueToJson(shared of rec)
      set itemJson to itemJson & ",\"passwordProtected\":" & my valueToJson(passwordProtected of rec)
      set itemJson to itemJson & "}"
      set end of jsonParts to itemJson
    end try
  end repeat
  
  set AppleScript's text item delimiters to ","
  set jsonArray to "[" & (jsonParts as text) & "]"
  set AppleScript's text item delimiters to ""
  return jsonArray
end tell