import { createScript, runScript } from 'applescript-node';

/**
 * Explore the full structure under the Open Files and Ports tab
 */

async function exploreTabStructure() {
  console.log('Exploring tab structure...\n');

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
    .set('report', '"=== FULL WINDOW STRUCTURE ===" & linefeed & linefeed')
    .comment('Check what is directly in the window')
    .setExpression('groupCount', 'count of groups')
    .setExpression('scrollCount', 'count of scroll areas')
    .setExpression('tabGroupCount', 'count of tab groups')
    .setExpression('splitterCount', 'count of splitter groups')
    .raw('set report to report & "Groups: " & groupCount & linefeed')
    .raw('set report to report & "Scroll areas: " & scrollCount & linefeed')
    .raw('set report to report & "Tab groups: " & tabGroupCount & linefeed')
    .raw('set report to report & "Splitters: " & splitterCount & linefeed & linefeed')
    .comment('Explore groups if any')
    .raw('if groupCount > 0 then')
    .raw('repeat with g from 1 to groupCount')
    .raw('set report to report & "=== GROUP " & g & " ===" & linefeed')
    .raw('try')
    .setExpression('groupScrolls', 'count of scroll areas of group g')
    .setExpression('groupSplitters', 'count of splitter groups of group g')
    .setExpression('groupTextAreas', 'count of text areas of group g')
    .raw('set report to report & "  Scroll areas: " & groupScrolls & linefeed')
    .raw('set report to report & "  Splitters: " & groupSplitters & linefeed')
    .raw('set report to report & "  Text areas: " & groupTextAreas & linefeed')
    .raw('if groupScrolls > 0 then')
    .raw('repeat with s from 1 to groupScrolls')
    .raw('try')
    .setExpression('scrollTables', 'count of tables of scroll area s of group g')
    .setExpression('scrollOutlines', 'count of outlines of scroll area s of group g')
    .setExpression('scrollTextAreas', 'count of text areas of scroll area s of group g')
    .raw(
      'set report to report & "    Scroll " & s & ": tables=" & scrollTables & ", outlines=" & scrollOutlines & ", text areas=" & scrollTextAreas & linefeed',
    )
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('on error errMsg')
    .raw('set report to report & "  Error: " & errMsg & linefeed')
    .raw('end try')
    .raw('set report to report & linefeed')
    .raw('end repeat')
    .raw('end if')
    .comment('Explore splitters if any')
    .raw('if splitterCount > 0 then')
    .raw('set report to report & "=== SPLITTER 1 ===" & linefeed')
    .raw('try')
    .setExpression('splitterGroups', 'count of groups of splitter group 1')
    .setExpression('splitterScrolls', 'count of scroll areas of splitter group 1')
    .raw('set report to report & "  Groups: " & splitterGroups & linefeed')
    .raw('set report to report & "  Scroll areas: " & splitterScrolls & linefeed')
    .raw('if splitterScrolls > 0 then')
    .raw('repeat with s from 1 to splitterScrolls')
    .raw('try')
    .setExpression('scrollTables', 'count of tables of scroll area s of splitter group 1')
    .setExpression('scrollOutlines', 'count of outlines of scroll area s of splitter group 1')
    .setExpression('scrollTextAreas', 'count of text areas of scroll area s of splitter group 1')
    .raw(
      'set report to report & "    Scroll " & s & ": tables=" & scrollTables & ", outlines=" & scrollOutlines & ", text areas=" & scrollTextAreas & linefeed',
    )
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('on error errMsg')
    .raw('set report to report & "  Error: " & errMsg & linefeed')
    .raw('end try')
    .raw('end if')
    .returnRaw('report')
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

exploreTabStructure();
