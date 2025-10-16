
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

tell application "Contacts"
  set matchingPeople to every person whose name contains "John" and organization contains "UNiDAYS"
  set results to {}
  set counter to 0
  repeat with aPerson in matchingPeople
    if counter >= 10 then
      exit repeat
    end if
    set counter to counter + 1
    try
      if count of emails of aPerson > 0 then
        set personEmail to {}
      else
        set personEmail to "missing value"
      end if
      set end of results to {name:name of aPerson, organization:organization of aPerson, jobTitle:job title of aPerson, email:personEmail}
    on error
      -- Skip contacts with errors
    end try
  end repeat
  set jsonParts to {}
  repeat with rec in results
    try
      set itemJson to "{"
      set itemJson to itemJson & "\"name\":" & my valueToJson(name of rec)
      set itemJson to itemJson & ",\"organization\":" & my valueToJson(organization of rec)
      set itemJson to itemJson & ",\"jobTitle\":" & my valueToJson(jobTitle of rec)
      set itemJson to itemJson & ",\"email\":" & my valueToJson(email of rec)
      set itemJson to itemJson & "}"
      set end of jsonParts to itemJson
    end try
  end repeat
  
  set AppleScript's text item delimiters to ","
  set jsonArray to "[" & (jsonParts as text) & "]"
  set AppleScript's text item delimiters to ""
  return jsonArray
end tell