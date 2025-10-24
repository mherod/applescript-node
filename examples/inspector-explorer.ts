import { createScript, runScript } from 'applescript-node';

/**
 * Explore the inspector window UI structure
 */

async function exploreInspectorWindow() {
  console.log('Creating inspector window exploration script...\n');

  const exploreScript = createScript()
    .tell('Activity Monitor')
    .activate()
    .delay(1)
    .endtell()
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Find the claude inspector window')
    .set('inspectorWin', 0)
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorWin to w')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('if inspectorWin > 0 then')
    .raw('tell window inspectorWin')
    .set('report', '"=== INSPECTOR WINDOW STRUCTURE ===" & linefeed & linefeed')
    .comment('Get basic structure')
    .setExpression('tabGroupCount', 'count of tab groups')
    .setExpression('scrollCount', 'count of scroll areas')
    .setExpression('groupCount', 'count of groups')
    .raw('set report to report & "Tab groups: " & tabGroupCount & linefeed')
    .raw('set report to report & "Scroll areas: " & scrollCount & linefeed')
    .raw('set report to report & "Groups: " & groupCount & linefeed & linefeed')
    .comment('Explore tab group')
    .raw('if tabGroupCount > 0 then')
    .raw('tell tab group 1')
    .setExpression('radioCount', 'count of radio buttons')
    .raw('set report to report & "Radio buttons: " & radioCount & linefeed')
    .raw('if radioCount > 0 then')
    .raw('repeat with i from 1 to radioCount')
    .raw('try')
    .setExpression('rbName', 'name of radio button i')
    .setExpression('rbValue', 'value of radio button i')
    .raw('set report to report & "  " & i & ": " & rbName & " (value: " & rbValue & ")" & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('end tell')
    .raw('set report to report & linefeed')
    .raw('end if')
    .comment('Explore scroll areas')
    .raw('if scrollCount > 0 then')
    .raw('tell scroll area 1')
    .setExpression('tableCount', 'count of tables')
    .setExpression('outlineCount', 'count of outlines')
    .setExpression('listCount', 'count of lists')
    .setExpression('groupCount2', 'count of groups')
    .setExpression('uiElementCount', 'count of UI elements')
    .setExpression('staticTextCount', 'count of static texts')
    .setExpression('textFieldCount', 'count of text fields')
    .raw('set report to report & "Scroll Area 1:" & linefeed')
    .raw('set report to report & "  Tables: " & tableCount & linefeed')
    .raw('set report to report & "  Outlines: " & outlineCount & linefeed')
    .raw('set report to report & "  Lists: " & listCount & linefeed')
    .raw('set report to report & "  Groups: " & groupCount2 & linefeed')
    .raw('set report to report & "  UI Elements: " & uiElementCount & linefeed')
    .raw('set report to report & "  Static Texts: " & staticTextCount & linefeed')
    .raw('set report to report & "  Text Fields: " & textFieldCount & linefeed')
    .comment('Sample UI elements if any')
    .raw('if uiElementCount > 0 and uiElementCount < 10 then')
    .raw('set report to report & "  UI Element types:" & linefeed')
    .raw('repeat with i from 1 to uiElementCount')
    .raw('try')
    .setExpression('elemClass', 'class of UI element i')
    .setExpression('elemRole', 'role of UI element i')
    .raw('set report to report & "    " & i & ": " & elemClass & " (" & elemRole & ")" & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('if outlineCount > 0 then')
    .raw('tell outline 1')
    .setExpression('outlineRows', 'count of rows')
    .raw('set report to report & "  Outline 1 has " & outlineRows & " rows" & linefeed')
    .raw('if outlineRows > 2 then')
    .raw('set report to report & "  First row sample:" & linefeed')
    .raw('try')
    .setExpression('rowElemCount', 'count of UI elements of row 1')
    .raw('set report to report & "    UI elements: " & rowElemCount & linefeed')
    .raw('if rowElemCount > 0 then')
    .raw('try')
    .setExpression('elem1Value', 'value of static text 1 of UI element 1 of row 1')
    .raw('set report to report & "    First cell text: " & elem1Value & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end if')
    .raw('on error')
    .raw('end try')
    .raw('end if')
    .raw('end tell')
    .raw('end if')
    .raw('end tell')
    .raw('end if')
    .returnRaw('report')
    .raw('end tell')
    .raw('else')
    .set(
      'report',
      '"Inspector window not found. Make sure to run this after opening the inspector!"',
    )
    .returnRaw('report')
    .raw('end if')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Executing inspector window exploration...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('Inspector Window Structure:');
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

exploreInspectorWindow();
