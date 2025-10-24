import { createScript, runScript } from 'applescript-node';

/**
 * Deep UI hierarchy explorer for Activity Monitor
 * This will dump ALL UI element types in Group 1 -> Scroll Area 1
 * to find where the process list actually is
 */

async function exploreActivityMonitorDeep() {
  console.log('Creating deep UI exploration script...\n');

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
    .comment('Get counts of every UI element type')
    .setExpression('tableCount', 'count of tables')
    .setExpression('outlineCount', 'count of outlines')
    .setExpression('listCount', 'count of lists')
    .setExpression('groupCount', 'count of groups')
    .setExpression('uiElementCount', 'count of UI elements')
    .setExpression('rowCount', 'count of rows')
    .setExpression('staticTextCount', 'count of static texts')
    .setExpression('imageCount', 'count of images')
    .comment('Build report')
    .setExpression(
      'report',
      '"=== Group 1 -> Scroll Area 1 Contents ===" & linefeed & linefeed & ' +
        '"Tables: " & tableCount & linefeed & ' +
        '"Outlines: " & outlineCount & linefeed & ' +
        '"Lists: " & listCount & linefeed & ' +
        '"Groups: " & groupCount & linefeed & ' +
        '"UI Elements: " & uiElementCount & linefeed & ' +
        '"Rows: " & rowCount & linefeed & ' +
        '"Static Texts: " & staticTextCount & linefeed & ' +
        '"Images: " & imageCount & linefeed & linefeed',
    )
    .comment('If there are outlines, explore them')
    .raw('if outlineCount > 0 then')
    .raw('tell outline 1')
    .setExpression('outlineRows', 'count of rows')
    .raw('set report to report & "Outline 1 has " & outlineRows & " rows" & linefeed')
    .raw('if outlineRows > 0 then')
    .raw('set report to report & "First 3 rows sample:" & linefeed')
    .raw('repeat with i from 1 to 3')
    .raw('if i > outlineRows then exit repeat')
    .raw('try')
    .setExpression('rowStaticTexts', 'count of static texts of row i')
    .raw(
      'set report to report & "  Row " & i & " has " & rowStaticTexts & " static texts" & linefeed',
    )
    .raw('if rowStaticTexts > 0 then')
    .raw('set firstText to value of static text 1 of row i')
    .raw('set report to report & "    First text: " & firstText & linefeed')
    .raw('end if')
    .raw('on error errMsg')
    .raw('set report to report & "    Error: " & errMsg & linefeed')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .raw('end tell')
    .raw('end if')
    .comment('If there are lists, explore them')
    .raw('if listCount > 0 then')
    .raw('tell list 1')
    .setExpression('listRows', 'count of rows')
    .raw('set report to report & linefeed & "List 1 has " & listRows & " rows" & linefeed')
    .raw('end tell')
    .raw('end if')
    .comment('Explore UI elements if any')
    .raw('if uiElementCount > 0 and uiElementCount < 20 then')
    .raw('set report to report & linefeed & "UI Elements:" & linefeed')
    .raw('repeat with i from 1 to uiElementCount')
    .raw('try')
    .setExpression('elemClass', 'class of UI element i')
    .setExpression('elemDesc', 'description of UI element i')
    .raw('set report to report & "  " & i & ": " & elemClass & " - " & elemDesc & linefeed')
    .raw('on error')
    .raw('-- skip')
    .raw('end try')
    .raw('end repeat')
    .raw('end if')
    .returnRaw('report')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Generated AppleScript (first 80 lines):');
  console.log(exploreScript.split('\n').slice(0, 80).join('\n'));
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing deep exploration...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('UI Hierarchy Report:');
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

exploreActivityMonitorDeep();
