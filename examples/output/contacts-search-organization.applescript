
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
  set matchingPeople to every person whose organization contains "Google"
  set results to {}
  set counter to 0
  repeat with aPerson in matchingPeople
    if counter >= 20 then
      exit repeat
    end if
    set counter to counter + 1
    try
      if count of emails of aPerson > 0 then
        set personEmail to value of item 1 of emails of aPerson
      else
        set personEmail to "missing value"
      end if
      if count of phones of aPerson > 0 then
        set personPhone to value of item 1 of phones of aPerson
      else
        set personPhone to "missing value"
      end if
      set end of results to {id:id of aPerson, name:name of aPerson, firstName:first name of aPerson, lastName:last name of aPerson, organization:organization of aPerson, email:personEmail, phone:personPhone}
    on error
      -- Skip contacts with errors
    end try
  end repeat
  set jsonParts to {}
  repeat with rec in results
    try
      set itemJson to "{"
      set itemJson to itemJson & "\"id\":" & my valueToJson(id of rec)
      set itemJson to itemJson & ",\"name\":" & my valueToJson(name of rec)
      set itemJson to itemJson & ",\"firstName\":" & my valueToJson(firstName of rec)
      set itemJson to itemJson & ",\"lastName\":" & my valueToJson(lastName of rec)
      set itemJson to itemJson & ",\"organization\":" & my valueToJson(organization of rec)
      set itemJson to itemJson & ",\"email\":" & my valueToJson(email of rec)
      set itemJson to itemJson & ",\"phone\":" & my valueToJson(phone of rec)
      set itemJson to itemJson & "}"
      set end of jsonParts to itemJson
    end try
  end repeat
  
  set AppleScript's text item delimiters to ","
  set jsonArray to "[" & (jsonParts as text) & "]"
  set AppleScript's text item delimiters to ""
  return jsonArray
end tell