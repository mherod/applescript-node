
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
  set __collected_items to {}
  set __counter to 0
  repeat with aPerson in every person
    if __counter >= 50 then
      exit repeat
    end if
    set __counter to __counter + 1
    if count of emails of aPerson > 0 then
      set __temp_email to value of item 1 of emails of aPerson
    else
      set __temp_email to missing value
    end if
    if count of phones of aPerson > 0 then
      set __temp_phone to value of item 1 of phones of aPerson
    else
      set __temp_phone to missing value
    end if
    if exists birth date then
      set __temp_birthday to birth date as string
    else
      set __temp_birthday to missing value
    end if
    try
      set end of __collected_items to {id:id of aPerson, name:name of aPerson, firstName:first name, lastName:last name, organization:organization of aPerson, jobTitle:job title of aPerson, email:__temp_email of aPerson, phone:__temp_phone of aPerson, birthday:__temp_birthday of aPerson, isCompany:company of aPerson}
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
      set itemJson to itemJson & ",\"firstName\":" & my valueToJson(firstName of rec)
      set itemJson to itemJson & ",\"lastName\":" & my valueToJson(lastName of rec)
      set itemJson to itemJson & ",\"organization\":" & my valueToJson(organization of rec)
      set itemJson to itemJson & ",\"jobTitle\":" & my valueToJson(jobTitle of rec)
      set itemJson to itemJson & ",\"email\":" & my valueToJson(email of rec)
      set itemJson to itemJson & ",\"phone\":" & my valueToJson(phone of rec)
      set itemJson to itemJson & ",\"birthday\":" & my valueToJson(birthday of rec)
      set itemJson to itemJson & ",\"isCompany\":" & my valueToJson(isCompany of rec)
      set itemJson to itemJson & "}"
      set end of jsonParts to itemJson
    end try
  end repeat
  
  set AppleScript's text item delimiters to ","
  set jsonArray to "[" & (jsonParts as text) & "]"
  set AppleScript's text item delimiters to ""
  return jsonArray
end tell