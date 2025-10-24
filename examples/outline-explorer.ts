import { createScript, runScript } from 'applescript-node';

/**
 * Explore outline row structure to find where process data is stored
 */

async function exploreOutlineRows() {
  console.log('Creating outline row exploration script...\n');

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
    .comment('Explore the first 5 rows in detail')
    .set('report', '""')
    .raw('repeat with i from 1 to 5')
    .raw('try')
    .raw('set report to report & "=== ROW " & i & " ===" & linefeed')
    .comment('Try different ways to get row data')
    .raw('try')
    .setExpression('rowValue', 'value of row i')
    .raw('set report to report & "Value: " & rowValue & linefeed')
    .raw('on error')
    .raw('set report to report & "Value: (not accessible)" & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('rowName', 'name of row i')
    .raw('set report to report & "Name: " & rowName & linefeed')
    .raw('on error')
    .raw('set report to report & "Name: (not accessible)" & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('rowDesc', 'description of row i')
    .raw('set report to report & "Description: " & rowDesc & linefeed')
    .raw('on error')
    .raw('set report to report & "Description: (not accessible)" & linefeed')
    .raw('end try')
    .comment('Check what UI elements are in the row')
    .setExpression('elemCount', 'count of UI elements of row i')
    .raw('set report to report & "UI Elements: " & elemCount & linefeed')
    .raw('if elemCount > 0 and elemCount < 20 then')
    .raw('repeat with j from 1 to elemCount')
    .raw('try')
    .setExpression('elemClass', 'class of UI element j of row i')
    .setExpression('elemValue', 'value of UI element j of row i')
    .raw(
      'set report to report & "  Element " & j & ": " & elemClass & " = " & elemValue & linefeed',
    )
    .raw('on error errMsg')
    .raw('set report to report & "  Element " & j & ": (error: " & errMsg & ")" & linefeed')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .comment('Check for static texts specifically')
    .setExpression('textCount', 'count of static texts of row i')
    .raw('set report to report & "Static Texts: " & textCount & linefeed')
    .raw('if textCount > 0 then')
    .raw('repeat with j from 1 to textCount')
    .raw('try')
    .setExpression('textValue', 'value of static text j of row i')
    .raw('set report to report & "  Text " & j & ": " & textValue & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('set report to report & linefeed')
    .raw('on error errMsg')
    .raw('set report to report & "ERROR exploring row " & i & ": " & errMsg & linefeed & linefeed')
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

  console.log('Generated AppleScript (first 60 lines):');
  console.log(exploreScript.split('\n').slice(0, 60).join('\n'));
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing outline row exploration...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('Outline Row Structure:');
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

exploreOutlineRows();
