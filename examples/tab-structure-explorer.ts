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
          .set('report', '"=== FULL WINDOW STRUCTURE ===" & linefeed & linefeed')
          .comment('Check what is directly in the window')
          .setExpressions({
            groupCount: (e) => e.count('groups'),
            scrollCount: (e) => e.count('scroll areas'),
            tabGroupCount: (e) => e.count('tab groups'),
            splitterCount: (e) => e.count('splitter groups'),
          })
          .appendTo('report', '"Groups: " & groupCount & linefeed')
          .appendTo('report', '"Scroll areas: " & scrollCount & linefeed')
          .appendTo('report', '"Tab groups: " & tabGroupCount & linefeed')
          .appendTo('report', '"Splitters: " & splitterCount & linefeed & linefeed')
          .comment('Explore groups if any')
          .ifThen(
            (e) => e.gt('groupCount', 0),
            (ifB) =>
              ifB
                .repeatWithRange('g', 1, 'groupCount')
                .appendTo('report', '"=== GROUP " & g & " ===" & linefeed')
                .tryCatchError(
                  (tryB) =>
                    tryB
                      .setExpressions({
                        groupScrolls: (e) => e.count('scroll areas of group g'),
                        groupSplitters: (e) => e.count('splitter groups of group g'),
                        groupTextAreas: (e) => e.count('text areas of group g'),
                      })
                      .appendTo('report', '"  Scroll areas: " & groupScrolls & linefeed')
                      .appendTo('report', '"  Splitters: " & groupSplitters & linefeed')
                      .appendTo('report', '"  Text areas: " & groupTextAreas & linefeed')
                      .ifThen(
                        (e) => e.gt('groupScrolls', 0),
                        (innerIfB) =>
                          innerIfB
                            .repeatWithRange('s', 1, 'groupScrolls')
                            .tryCatch(
                              (innerTryB) =>
                                innerTryB
                                  .setExpressions({
                                    scrollTables: (e) =>
                                      e.count('tables of scroll area s of group g'),
                                    scrollOutlines: (e) =>
                                      e.count('outlines of scroll area s of group g'),
                                    scrollTextAreas: (e) =>
                                      e.count('text areas of scroll area s of group g'),
                                  })
                                  .appendTo(
                                    'report',
                                    '"    Scroll " & s & ": tables=" & scrollTables & ", outlines=" & scrollOutlines & ", text areas=" & scrollTextAreas & linefeed',
                                  ),
                              (innerCatchB) => innerCatchB.comment('skip'),
                            )
                            .endrepeat(),
                      ),
                  'errMsg',
                  (catchB) => catchB.appendTo('report', '"  Error: " & errMsg & linefeed'),
                )
                .appendTo('report', 'linefeed')
                .endrepeat(),
          )
          .comment('Explore splitters if any')
          .ifThen(
            (e) => e.gt('splitterCount', 0),
            (ifB) =>
              ifB.appendTo('report', '"=== SPLITTER 1 ===" & linefeed').tryCatchError(
                (tryB) =>
                  tryB
                    .setExpressions({
                      splitterGroups: (e) => e.count('groups of splitter group 1'),
                      splitterScrolls: (e) => e.count('scroll areas of splitter group 1'),
                    })
                    .appendTo('report', '"  Groups: " & splitterGroups & linefeed')
                    .appendTo('report', '"  Scroll areas: " & splitterScrolls & linefeed')
                    .ifThen(
                      (e) => e.gt('splitterScrolls', 0),
                      (innerIfB) =>
                        innerIfB
                          .repeatWithRange('s', 1, 'splitterScrolls')
                          .tryCatch(
                            (innerTryB) =>
                              innerTryB
                                .setExpressions({
                                  scrollTables: (e) =>
                                    e.count('tables of scroll area s of splitter group 1'),
                                  scrollOutlines: (e) =>
                                    e.count('outlines of scroll area s of splitter group 1'),
                                  scrollTextAreas: (e) =>
                                    e.count('text areas of scroll area s of splitter group 1'),
                                })
                                .appendTo(
                                  'report',
                                  '"    Scroll " & s & ": tables=" & scrollTables & ", outlines=" & scrollOutlines & ", text areas=" & scrollTextAreas & linefeed',
                                ),
                            (innerCatchB) => innerCatchB.comment('skip'),
                          )
                          .endrepeat(),
                    ),
                'errMsg',
                (catchB) => catchB.appendTo('report', '"  Error: " & errMsg & linefeed'),
              ),
          )
          .returnRaw('report')
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

exploreTabStructure();
