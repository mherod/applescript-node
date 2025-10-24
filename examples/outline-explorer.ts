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
    .tellProcess('Activity Monitor')
    .tellTarget('window 1')
    .tellTarget('group 1')
    .tellTarget('scroll area 1')
    .tellTarget('outline 1')
    .comment('Explore the first 5 rows in detail')
    .set('report', '""')
    .repeatWithRange('i', 1, 5)
    .tryCatchError(
      (tryB) =>
        tryB
          .setExpression('report', 'report & "=== ROW " & i & " ===" & linefeed')
          .comment('Try different ways to get row data')
          .tryCatch(
            (innerTryB) =>
              innerTryB
                .setExpression('rowValue', 'value of row i')
                .setExpression('report', 'report & "Value: " & rowValue & linefeed'),
            (innerCatchB) =>
              innerCatchB.setExpression('report', 'report & "Value: (not accessible)" & linefeed'),
          )
          .tryCatch(
            (innerTryB) =>
              innerTryB
                .setExpression('rowName', 'name of row i')
                .setExpression('report', 'report & "Name: " & rowName & linefeed'),
            (innerCatchB) =>
              innerCatchB.setExpression('report', 'report & "Name: (not accessible)" & linefeed'),
          )
          .tryCatch(
            (innerTryB) =>
              innerTryB
                .setExpression('rowDesc', 'description of row i')
                .setExpression('report', 'report & "Description: " & rowDesc & linefeed'),
            (innerCatchB) =>
              innerCatchB.setExpression(
                'report',
                'report & "Description: (not accessible)" & linefeed',
              ),
          )
          .comment('Check what UI elements are in the row')
          .setExpression('elemCount', 'count of UI elements of row i')
          .setExpression('report', 'report & "UI Elements: " & elemCount & linefeed')
          .ifThen('elemCount > 0 and elemCount < 20', (ifB) =>
            ifB
              .repeatWithRange('j', 1, 'elemCount')
              .tryCatchError(
                (jTryB) =>
                  jTryB
                    .setExpression('elemClass', 'class of UI element j of row i')
                    .setExpression('elemValue', 'value of UI element j of row i')
                    .setExpression(
                      'report',
                      'report & "  Element " & j & ": " & elemClass & " = " & elemValue & linefeed',
                    ),
                'errMsg',
                (jCatchB) =>
                  jCatchB.setExpression(
                    'report',
                    'report & "  Element " & j & ": (error: " & errMsg & ")" & linefeed',
                  ),
              )
              .endrepeat(),
          )
          .comment('Check for static texts specifically')
          .setExpression('textCount', 'count of static texts of row i')
          .setExpression('report', 'report & "Static Texts: " & textCount & linefeed')
          .ifThen('textCount > 0', (ifB) =>
            ifB
              .repeatWithRange('j', 1, 'textCount')
              .tryCatch(
                (jTryB) =>
                  jTryB
                    .setExpression('textValue', 'value of static text j of row i')
                    .setExpression(
                      'report',
                      'report & "  Text " & j & ": " & textValue & linefeed',
                    ),
                (jCatchB) => jCatchB.comment('skip'),
              )
              .endrepeat(),
          )
          .setExpression('report', 'report & linefeed'),
      'errMsg',
      (catchB) =>
        catchB.setExpression(
          'report',
          'report & "ERROR exploring row " & i & ": " & errMsg & linefeed & linefeed',
        ),
    )
    .endrepeat()
    .returnRaw('report')
    .endtell()
    .endtell()
    .endtell()
    .endtell()
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
