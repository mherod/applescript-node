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
    .tellProcess('Activity Monitor')
    .tellTarget('window 1')
    .tellTarget('group 1')
    .tellTarget('scroll area 1')
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
    .ifThen('outlineCount > 0', (b) =>
      b
        .tellTarget('outline 1')
        .setExpression('outlineRows', 'count of rows')
        .setExpression('report', 'report & "Outline 1 has " & outlineRows & " rows" & linefeed')
        .ifThen('outlineRows > 0', (innerB) =>
          innerB
            .setExpression('report', 'report & "First 3 rows sample:" & linefeed')
            .repeatWithRange('i', 1, 3)
            .ifThen('i > outlineRows', (exitB) => exitB.exitRepeat())
            .tryCatchError(
              (tryB) =>
                tryB
                  .setExpression('rowStaticTexts', 'count of static texts of row i')
                  .setExpression(
                    'report',
                    'report & "  Row " & i & " has " & rowStaticTexts & " static texts" & linefeed',
                  )
                  .ifThen('rowStaticTexts > 0', (textB) =>
                    textB
                      .setExpression('firstText', 'value of static text 1 of row i')
                      .setExpression(
                        'report',
                        'report & "    First text: " & firstText & linefeed',
                      ),
                  ),
              'errMsg',
              (catchB) =>
                catchB.setExpression('report', 'report & "    Error: " & errMsg & linefeed'),
            )
            .endrepeat(),
        )
        .endtell(),
    )
    .comment('If there are lists, explore them')
    .ifThen('listCount > 0', (b) =>
      b
        .tellTarget('list 1')
        .setExpression('listRows', 'count of rows')
        .setExpression(
          'report',
          'report & linefeed & "List 1 has " & listRows & " rows" & linefeed',
        )
        .endtell(),
    )
    .comment('Explore UI elements if any')
    .ifThen('uiElementCount > 0 and uiElementCount < 20', (b) =>
      b
        .setExpression('report', 'report & linefeed & "UI Elements:" & linefeed')
        .repeatWithRange('i', 1, 'uiElementCount')
        .tryCatch(
          (tryB) =>
            tryB
              .setExpression('elemClass', 'class of UI element i')
              .setExpression('elemDesc', 'description of UI element i')
              .setExpression(
                'report',
                'report & "  " & i & ": " & elemClass & " - " & elemDesc & linefeed',
              ),
          (catchB) => catchB.comment('skip'),
        )
        .endrepeat(),
    )
    .returnRaw('report')
    .endtell()
    .endtell()
    .endtell()
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
