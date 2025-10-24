import { createScript, runScript } from 'applescript-node';

/**
 * Debug script to understand how to get full text from the inspector text area
 */

async function debugTextArea() {
  console.log('Debugging text area content...\n');

  const script = createScript()
    .tell('Activity Monitor')
    .activate()
    .delay(1)
    .endtell()
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .raw('set inspectorWin to 0')
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorWin to w')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('if inspectorWin > 0 then')
    .raw('tell window inspectorWin')
    .raw('tell scroll area 1')
    .raw('tell text area 1')
    .set('report', '""')
    .comment('Try different ways to get the text')
    .raw('try')
    .setExpression('textValue', 'value')
    .raw('set report to report & "=== VALUE ===" & linefeed & textValue & linefeed & linefeed')
    .raw('on error errMsg')
    .raw('set report to report & "Value error: " & errMsg & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('textContent', 'content')
    .raw('set report to report & "=== CONTENT ===" & linefeed & textContent & linefeed & linefeed')
    .raw('on error errMsg')
    .raw('set report to report & "Content error: " & errMsg & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('entireContents', 'entire contents')
    .raw(
      'set report to report & "=== ENTIRE CONTENTS ===" & linefeed & entireContents & linefeed & linefeed',
    )
    .raw('on error errMsg')
    .raw('set report to report & "Entire contents error: " & errMsg & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('staticTextCount', 'count of static texts')
    .raw('set report to report & "Static texts: " & staticTextCount & linefeed')
    .raw('if staticTextCount > 0 then')
    .raw('repeat with i from 1 to staticTextCount')
    .raw('try')
    .setExpression('stValue', 'value of static text i')
    .raw('set report to report & "  Text " & i & ": " & stValue & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('on error errMsg')
    .raw('set report to report & "Static texts error: " & errMsg & linefeed')
    .raw('end try')
    .raw('try')
    .setExpression('uiElemCount', 'count of UI elements')
    .raw('set report to report & "UI elements: " & uiElemCount & linefeed')
    .raw('on error')
    .raw('end try')
    .returnRaw('report')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('else')
    .set('report', '"Inspector window not found"')
    .returnRaw('report')
    .raw('end if')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Executing...\n');
  try {
    const result = await runScript<string>(script);

    if (result.success && result.output) {
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

debugTextArea();
