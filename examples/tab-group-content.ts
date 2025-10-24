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
    .tellProcess('Activity Monitor')
    .set('inspectorWin', 0)
    .repeatWithRange('w', 1, '(count of windows)')
    .ifThen('name of window w contains "claude"', (b) =>
      b.setExpression('inspectorWin', 'w').exitRepeat(),
    )
    .endrepeat()
    .ifThenElse(
      (e) => e.gt('inspectorWin', 0),
      (thenB) =>
        thenB
          .tellTarget('window inspectorWin')
          .tellTarget('tab group 1')
          .set('report', '"=== TAB GROUP CONTENTS ===" & linefeed & linefeed')
          .comment('Get counts of everything in the tab group')
          .setExpressions({
            radioCount: (e) => e.count('radio buttons'),
            scrollCount: (e) => e.count('scroll areas'),
            groupCount: (e) => e.count('groups'),
            textAreaCount: (e) => e.count('text areas'),
            splitterCount: (e) => e.count('splitter groups'),
            uiElemCount: (e) => e.count('UI elements'),
          })
          .appendTo('report', '"Radio buttons: " & radioCount & linefeed')
          .appendTo('report', '"Scroll areas: " & scrollCount & linefeed')
          .appendTo('report', '"Groups: " & groupCount & linefeed')
          .appendTo('report', '"Text areas: " & textAreaCount & linefeed')
          .appendTo('report', '"Splitters: " & splitterCount & linefeed')
          .appendTo('report', '"UI elements: " & uiElemCount & linefeed & linefeed')
          .comment('Explore scroll areas in tab group')
          .ifThen(
            (e) => e.gt('scrollCount', 0),
            (ifB) =>
              ifB
                .repeatWithRange('s', 1, 'scrollCount')
                .appendTo('report', '"=== SCROLL AREA " & s & " ===" & linefeed')
                .tryCatchError(
                  (tryB) =>
                    tryB
                      .setExpressions({
                        scrollTables: (e) => e.count('tables of scroll area s'),
                        scrollOutlines: (e) => e.count('outlines of scroll area s'),
                        scrollTextAreas: (e) => e.count('text areas of scroll area s'),
                        scrollLists: (e) => e.count('lists of scroll area s'),
                        scrollGroups: (e) => e.count('groups of scroll area s'),
                      })
                      .appendTo('report', '"  Tables: " & scrollTables & linefeed')
                      .appendTo('report', '"  Outlines: " & scrollOutlines & linefeed')
                      .appendTo('report', '"  Text areas: " & scrollTextAreas & linefeed')
                      .appendTo('report', '"  Lists: " & scrollLists & linefeed')
                      .appendTo('report', '"  Groups: " & scrollGroups & linefeed')
                      .comment('If there is a table, explore it')
                      .ifThen(
                        (e) => e.gt('scrollTables', 0),
                        (tableIfB) =>
                          tableIfB
                            .tellTarget('table 1 of scroll area s')
                            .setExpression('rowCount', (e) => e.count('rows'))
                            .appendTo('report', '"  TABLE 1 has " & rowCount & " rows" & linefeed')
                            .ifThen(
                              (e) => e.gt('rowCount', 0),
                              (rowIfB) =>
                                rowIfB
                                  .appendTo('report', '"  First 3 rows:" & linefeed')
                                  .repeatWithRange('i', 1, 3)
                                  .exitRepeatIf((e) => e.gt('i', 'rowCount'))
                                  .tryCatch(
                                    (innerTryB) =>
                                      innerTryB
                                        .setExpression('rowValue', 'value of row i')
                                        .appendTo(
                                          'report',
                                          '"    Row " & i & ": " & rowValue & linefeed',
                                        ),
                                    (innerCatchB) =>
                                      innerCatchB.tryCatch(
                                        (nestedTryB) =>
                                          nestedTryB
                                            .setExpression(
                                              'cellValue',
                                              'value of static text 1 of UI element 1 of row i',
                                            )
                                            .appendTo(
                                              'report',
                                              '"    Row " & i & ": " & cellValue & linefeed',
                                            ),
                                        (nestedCatchB) => nestedCatchB.comment('skip'),
                                      ),
                                  )
                                  .endrepeat(),
                            )
                            .endtell(),
                      ),
                  'errMsg',
                  (catchB) => catchB.appendTo('report', '"  Error: " & errMsg & linefeed'),
                )
                .appendTo('report', 'linefeed')
                .endrepeat(),
          )
          .returnRaw('report')
          .endtell()
          .endtell(),
      (elseB) => elseB.set('report', '"Inspector window not found"').returnRaw('report'),
    )
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
