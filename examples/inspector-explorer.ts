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
    .tellProcess('Activity Monitor')
    .comment('Find the claude inspector window')
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
          .set('report', '"=== INSPECTOR WINDOW STRUCTURE ===" & linefeed & linefeed')
          .comment('Get basic structure')
          .setExpressions({
            tabGroupCount: (e) => e.count('tab groups'),
            scrollCount: (e) => e.count('scroll areas'),
            groupCount: (e) => e.count('groups'),
          })
          .appendTo('report', '"Tab groups: " & tabGroupCount & linefeed')
          .appendTo('report', '"Scroll areas: " & scrollCount & linefeed')
          .appendTo('report', '"Groups: " & groupCount & linefeed & linefeed')
          .comment('Explore tab group')
          .ifThen(
            (e) => e.gt('tabGroupCount', 0),
            (ifB) =>
              ifB
                .tellTarget('tab group 1')
                .setExpression('radioCount', (e) => e.count('radio buttons'))
                .appendTo('report', '"Radio buttons: " & radioCount & linefeed')
                .ifThen(
                  (e) => e.gt('radioCount', 0),
                  (innerIfB) =>
                    innerIfB
                      .repeatWithRange('i', 1, 'radioCount')
                      .tryCatch(
                        (tryB) =>
                          tryB
                            .setExpressions({
                              rbName: (e) => e.property('radio button i', 'name'),
                              rbValue: (e) => e.property('radio button i', 'value'),
                            })
                            .appendTo(
                              'report',
                              '"  " & i & ": " & rbName & " (value: " & rbValue & ")" & linefeed',
                            ),
                        (catchB) => catchB.comment('skip'),
                      )
                      .endrepeat(),
                )
                .endtell()
                .appendTo('report', 'linefeed'),
          )
          .comment('Explore scroll areas')
          .ifThen(
            (e) => e.gt('scrollCount', 0),
            (ifB) =>
              ifB
                .tellTarget('scroll area 1')
                .setExpressions({
                  tableCount: (e) => e.count('tables'),
                  outlineCount: (e) => e.count('outlines'),
                  listCount: (e) => e.count('lists'),
                  groupCount2: (e) => e.count('groups'),
                  uiElementCount: (e) => e.count('UI elements'),
                  staticTextCount: (e) => e.count('static texts'),
                  textFieldCount: (e) => e.count('text fields'),
                })
                .appendTo('report', '"Scroll Area 1:" & linefeed')
                .appendTo('report', '"  Tables: " & tableCount & linefeed')
                .appendTo('report', '"  Outlines: " & outlineCount & linefeed')
                .appendTo('report', '"  Lists: " & listCount & linefeed')
                .appendTo('report', '"  Groups: " & groupCount2 & linefeed')
                .appendTo('report', '"  UI Elements: " & uiElementCount & linefeed')
                .appendTo('report', '"  Static Texts: " & staticTextCount & linefeed')
                .appendTo('report', '"  Text Fields: " & textFieldCount & linefeed')
                .comment('Sample UI elements if any')
                .ifThen(
                  (e) => e.and(e.gt('uiElementCount', 0), e.lt('uiElementCount', 10)),
                  (innerIfB) =>
                    innerIfB
                      .appendTo('report', '"  UI Element types:" & linefeed')
                      .repeatWithRange('i', 1, 'uiElementCount')
                      .tryCatch(
                        (tryB) =>
                          tryB
                            .setExpressions({
                              elemClass: (e) => e.property('UI element i', 'class'),
                              elemRole: (e) => e.property('UI element i', 'role'),
                            })
                            .appendTo(
                              'report',
                              '"    " & i & ": " & elemClass & " (" & elemRole & ")" & linefeed',
                            ),
                        (catchB) => catchB.comment('skip'),
                      )
                      .endrepeat(),
                )
                .ifThen(
                  (e) => e.gt('outlineCount', 0),
                  (innerIfB) =>
                    innerIfB
                      .tellTarget('outline 1')
                      .setExpression('outlineRows', (e) => e.count('rows'))
                      .appendTo('report', '"  Outline 1 has " & outlineRows & " rows" & linefeed')
                      .ifThen(
                        (e) => e.gt('outlineRows', 2),
                        (rowIfB) =>
                          rowIfB.appendTo('report', '"  First row sample:" & linefeed').tryCatch(
                            (tryB) =>
                              tryB
                                .setExpression('rowElemCount', (e) =>
                                  e.count('UI elements of row 1'),
                                )
                                .appendTo('report', '"    UI elements: " & rowElemCount & linefeed')
                                .ifThen(
                                  (e) => e.gt('rowElemCount', 0),
                                  (elemIfB) =>
                                    elemIfB.tryCatch(
                                      (innerTryB) =>
                                        innerTryB
                                          .setExpression(
                                            'elem1Value',
                                            'value of static text 1 of UI element 1 of row 1',
                                          )
                                          .appendTo(
                                            'report',
                                            '"    First cell text: " & elem1Value & linefeed',
                                          ),
                                      (innerCatchB) => innerCatchB.comment('skip'),
                                    ),
                                ),
                            (catchB) => catchB.comment('skip'),
                          ),
                      )
                      .endtell(),
                )
                .endtell(),
          )
          .returnRaw('report')
          .endtell(),
      (elseB) =>
        elseB
          .set(
            'report',
            '"Inspector window not found. Make sure to run this after opening the inspector!"',
          )
          .returnRaw('report'),
    )
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
