import { createScript, runScript } from 'applescript-node';

/**
 * Try different ways to get the full text from the text area
 */

async function getFullTextArea() {
  console.log('Getting full text area content...\n');

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
    .raw('tell tab group 1')
    .raw('tell scroll area 1')
    .raw('tell text area 1')
    .set('report', '""')
    .comment('Try to get entire contents with AXValue attribute')
    .raw('try')
    .raw('set textValue to value of attribute "AXValue"')
    .raw('set report to report & "=== AXValue ===" & linefeed & textValue & linefeed')
    .raw('on error errMsg')
    .raw('set report to report & "AXValue error: " & errMsg & linefeed')
    .raw('end try')
    .comment('Try to count and iterate through paragraphs/lines')
    .raw('try')
    .setExpression('numParagraphs', 'count of paragraphs')
    .raw('set report to report & linefeed & "Paragraphs: " & numParagraphs & linefeed')
    .raw('on error')
    .raw('end try')
    .comment('Try entire contents property')
    .raw('try')
    .raw('set allContent to entire contents')
    .raw('set report to report & linefeed & "=== ENTIRE CONTENTS ===" & linefeed')
    .raw('repeat with elem in allContent')
    .raw('try')
    .raw('set itemValue to value of elem')
    .raw('if itemValue is not missing value then')
    .raw('set report to report & itemValue & linefeed')
    .raw('end if')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('on error errMsg')
    .raw('set report to report & "Entire contents error: " & errMsg & linefeed')
    .raw('end try')
    .returnRaw('report')
    .raw('end tell')
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

getFullTextArea();
