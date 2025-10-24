import { createScript, runScript } from 'applescript-node';

/**
 * Deep dive into UI element details to find where process names are stored
 */

async function exploreElementDetails() {
  console.log('Creating element detail exploration script...\n');

  const exploreScript = createScript()
    .tell('Activity Monitor')
    .activate()
    .delay(1.5)
    .endtell()
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .raw('tell window 1')
    .raw('tell group 1')
    .raw('tell scroll area 1')
    .raw('tell outline 1')
    .comment('Focus on first row elements')
    .set('report', '"=== ROW 1 ELEMENT DETAILS ===" & linefeed & linefeed')
    .raw('repeat with j from 1 to 10')
    .raw('try')
    .raw('set report to report & "ELEMENT " & j & ":" & linefeed')
    .comment('Get class')
    .raw('try')
    .setExpression('elemClass', 'class of UI element j of row 1')
    .raw('set report to report & "  Class: " & elemClass & linefeed')
    .raw('on error')
    .raw('set report to report & "  Class: (unknown)" & linefeed')
    .raw('end try')
    .comment('Get role')
    .raw('try')
    .setExpression('elemRole', 'role of UI element j of row 1')
    .raw('set report to report & "  Role: " & elemRole & linefeed')
    .raw('on error')
    .raw('set report to report & "  Role: (unknown)" & linefeed')
    .raw('end try')
    .comment('Get role description')
    .raw('try')
    .setExpression('elemRoleDesc', 'role description of UI element j of row 1')
    .raw('set report to report & "  Role Desc: " & elemRoleDesc & linefeed')
    .raw('on error')
    .raw('set report to report & "  Role Desc: (unknown)" & linefeed')
    .raw('end try')
    .comment('Get value')
    .raw('try')
    .setExpression('elemValue', 'value of UI element j of row 1')
    .raw('if elemValue is not missing value then')
    .raw('set report to report & "  Value: " & elemValue & linefeed')
    .raw('else')
    .raw('set report to report & "  Value: missing value" & linefeed')
    .raw('end if')
    .raw('on error')
    .raw('set report to report & "  Value: (error)" & linefeed')
    .raw('end try')
    .comment('Get title')
    .raw('try')
    .setExpression('elemTitle', 'title of UI element j of row 1')
    .raw('set report to report & "  Title: " & elemTitle & linefeed')
    .raw('on error')
    .raw('set report to report & "  Title: (none)" & linefeed')
    .raw('end try')
    .comment('Check if its a text field or static text')
    .raw('try')
    .setExpression('textFieldCount', 'count of text fields of UI element j of row 1')
    .raw('if textFieldCount > 0 then')
    .setExpression('tfValue', 'value of text field 1 of UI element j of row 1')
    .raw('set report to report & "  Text Field Value: " & tfValue & linefeed')
    .raw('end if')
    .raw('on error')
    .raw('-- skip')
    .raw('end try')
    .raw('try')
    .setExpression('staticTextCount', 'count of static texts of UI element j of row 1')
    .raw('if staticTextCount > 0 then')
    .setExpression('stValue', 'value of static text 1 of UI element j of row 1')
    .raw('set report to report & "  Static Text Value: " & stValue & linefeed')
    .raw('end if')
    .raw('on error')
    .raw('-- skip')
    .raw('end try')
    .raw('set report to report & linefeed')
    .raw('on error errMsg')
    .raw('set report to report & "ERROR: " & errMsg & linefeed & linefeed')
    .raw('end try')
    .raw('end repeat')
    .returnRaw('report')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Executing element detail exploration...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('Element Details:');
      console.log('='.repeat(80));
      console.log(result.output);
      console.log('='.repeat(80));
    } else {
      console.error('Error:', result.error);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

exploreElementDetails();
