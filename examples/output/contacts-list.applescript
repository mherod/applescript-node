tell application "Contacts"
  set contactsList to {}
  set counter to 0
  repeat with aPerson in every person
    if counter > 50 then
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
      if exists birth date of aPerson then
        set personBirthday to birth date of aPerson as string
      else
        set personBirthday to "missing value"
      end if
      set end of contactsList to {id:id of aPerson, name:name of aPerson, firstName:first name of aPerson, lastName:last name of aPerson, organization:organization of aPerson, jobTitle:job title of aPerson, email:personEmail, phone:personPhone, birthday:personBirthday, isCompany:company of aPerson}
    on error
      -- Skip contacts with errors
    end try
  end repeat
  return contactsList
end tell