import { createScript, runScript } from 'applescript-node';

/**
 * Explore what's inside the tab group (not just the scroll area)
 */

async function exploreTabGroupContent() {
  console.log('Exploring tab group content...\n');

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
    .set('report', '"=== TAB GROUP CONTENTS ===" & linefeed & linefeed')
    .comment('Get counts of everything in the tab group')
    .setExpression('radioCount', 'count of radio buttons')
    .setExpression('scrollCount', 'count of scroll areas')
    .setExpression('groupCount', 'count of groups')
    .setExpression('textAreaCount', 'count of text areas')
    .setExpression('splitterCount', 'count of splitter groups')
    .setExpression('uiElemCount', 'count of UI elements')
    .raw('set report to report & "Radio buttons: " & radioCount & linefeed')
    .raw('set report to report & "Scroll areas: " & scrollCount & linefeed')
    .raw('set report to report & "Groups: " & groupCount & linefeed')
    .raw('set report to report & "Text areas: " & textAreaCount & linefeed')
    .raw('set report to report & "Splitters: " & splitterCount & linefeed')
    .raw('set report to report & "UI elements: " & uiElemCount & linefeed & linefeed')
    .comment('Explore scroll areas in tab group')
    .raw('if scrollCount > 0 then')
    .raw('repeat with s from 1 to scrollCount')
    .raw('set report to report & "=== SCROLL AREA " & s & " ===" & linefeed')
    .raw('try')
    .setExpression('scrollTables', 'count of tables of scroll area s')
    .setExpression('scrollOutlines', 'count of outlines of scroll area s')
    .setExpression('scrollTextAreas', 'count of text areas of scroll area s')
    .setExpression('scrollLists', 'count of lists of scroll area s')
    .setExpression('scrollGroups', 'count of groups of scroll area s')
    .raw('set report to report & "  Tables: " & scrollTables & linefeed')
    .raw('set report to report & "  Outlines: " & scrollOutlines & linefeed')
    .raw('set report to report & "  Text areas: " & scrollTextAreas & linefeed')
    .raw('set report to report & "  Lists: " & scrollLists & linefeed')
    .raw('set report to report & "  Groups: " & scrollGroups & linefeed')
    .comment('If there is a table, explore it')
    .raw('if scrollTables > 0 then')
    .raw('tell table 1 of scroll area s')
    .setExpression('rowCount', 'count of rows')
    .raw('set report to report & "  TABLE 1 has " & rowCount & " rows" & linefeed')
    .raw('if rowCount > 0 then')
    .raw('set report to report & "  First 3 rows:" & linefeed')
    .raw('repeat with i from 1 to 3')
    .raw('if i > rowCount then exit repeat')
    .raw('try')
    .setExpression('rowValue', 'value of row i')
    .raw('set report to report & "    Row " & i & ": " & rowValue & linefeed')
    .raw('on error')
    .raw('try')
    .setExpression('cellValue', 'value of static text 1 of UI element 1 of row i')
    .raw('set report to report & "    Row " & i & ": " & cellValue & linefeed')
    .raw('on error')
    .raw('end try')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('end tell')
    .raw('end if')
    .raw('on error errMsg')
    .raw('set report to report & "  Error: " & errMsg & linefeed')
    .raw('end try')
    .raw('set report to report & linefeed')
    .raw('end repeat')
    .raw('end if')
    .returnRaw('report')
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

exploreTabGroupContent();
