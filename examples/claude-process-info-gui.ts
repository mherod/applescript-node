import { createScript, runScript } from 'applescript-node';

/**
 * This example demonstrates GUI automation with Activity Monitor:
 * 1. Launch Activity Monitor
 * 2. Find the 'claude' process in the UI
 * 3. Click the Inspect button
 * 4. Navigate to "Open Files and Ports" tab
 * 5. Extract the information
 *
 * This uses System Events for GUI scripting and will dump debug info.
 */

async function exploreActivityMonitorUI() {
  console.log('Creating script to explore Activity Monitor UI...\n');

  // First, let's dump the UI structure to understand what we're working with
  const exploreScript = createScript()
    .comment('Launch Activity Monitor')
    .tell('Activity Monitor')
    .activate()
    .delay(2)
    .endtell()
    .comment('Explore the UI structure')
    .tellProcess('Activity Monitor')
    .comment('Get window information')
    .setExpressions({
      winCount: (e) => e.count('windows'),
      winNames: 'name of every window',
    })
    .comment('Get main window UI elements')
    .tellTarget('window 1')
    .setExpressions({
      scrollCount: (e) => e.count('scroll areas'),
      groupCount: (e) => e.count('groups'),
      splitterCount: (e) => e.count('splitter groups'),
    })
    .comment('Explore group 1')
    .ifThenElse(
      (e) => e.gt('groupCount', 0),
      (thenB) =>
        thenB
          .setExpressions({
            group1Tables: (e) => e.count('tables of group 1'),
            group1ScrollAreas: (e) => e.count('scroll areas of group 1'),
            group1Splitters: (e) => e.count('splitter groups of group 1'),
          })
          .ifThenElse(
            (e) => e.gt('group1Splitters', 0),
            (innerThenB) =>
              innerThenB
                .setExpression('splitterScrollAreas', (e) =>
                  e.count('scroll areas of splitter group 1 of group 1'),
                )
                .ifThenElse(
                  (e) => e.gt('splitterScrollAreas', 0),
                  (innerInnerThen) =>
                    innerInnerThen.setExpression('splitterTables', (e) =>
                      e.count('tables of scroll area 1 of splitter group 1 of group 1'),
                    ),
                  (innerInnerElse) => innerInnerElse.set('splitterTables', 0),
                ),
            (innerElseB) => innerElseB.set('splitterScrollAreas', 0).set('splitterTables', 0),
          ),
      (elseB) =>
        elseB
          .set('group1Tables', 0)
          .set('group1ScrollAreas', 0)
          .set('group1Splitters', 0)
          .set('splitterScrollAreas', 0)
          .set('splitterTables', 0),
    )
    .endtell()
    .comment('Build debug output')
    .setExpression(
      'debugInfo',
      '"=== Activity Monitor UI Debug Info ===" & linefeed & linefeed & ' +
        '"Windows: " & winCount & linefeed & ' +
        '"Window names: " & winNames & linefeed & linefeed & ' +
        '"Main Window:" & linefeed & ' +
        '"  Groups: " & groupCount & linefeed & ' +
        '"  Scroll areas: " & scrollCount & linefeed & ' +
        '"  Splitter groups: " & splitterCount & linefeed & linefeed & ' +
        '"Group 1:" & linefeed & ' +
        '"  Tables: " & group1Tables & linefeed & ' +
        '"  Scroll areas: " & group1ScrollAreas & linefeed & ' +
        '"  Splitter groups: " & group1Splitters & linefeed & ' +
        '"  Splitter -> Scroll areas: " & splitterScrollAreas & linefeed & ' +
        '"  Splitter -> Scroll area -> Tables: " & splitterTables',
    )
    .returnRaw('debugInfo')
    .endtell()
    .build();

  console.log('Generated AppleScript:');
  console.log(exploreScript);
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing exploration script...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('Debug Output:');
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

async function _findClaudeProcess() {
  console.log('\n\nNow attempting to find and interact with claude process...\n');

  const interactScript = createScript()
    .comment('Make sure Activity Monitor is running')
    .tell('Activity Monitor')
    .activate()
    .delay(1)
    .endtell()
    .comment('Use System Events for GUI scripting')
    .tellProcess('Activity Monitor')
    .comment('Try to find the table with processes')
    .tellTarget('window 1')
    .comment('Look for tables - try group -> splitter -> scroll area path')
    .setExpression('groupCount', (e) => e.count('groups'))
    .ifThenElse(
      (e) => e.gt('groupCount', 0),
      (thenB) =>
        thenB
          .setExpression('splitterCount', (e) => e.count('splitter groups of group 1'))
          .ifThenElse(
            (e) => e.gt('splitterCount', 0),
            (innerThen) =>
              innerThen
                .setExpression('scrollCount', (e) =>
                  e.count('scroll areas of splitter group 1 of group 1'),
                )
                .ifThenElse(
                  (e) => e.gt('scrollCount', 0),
                  (scrollThen) =>
                    scrollThen
                      .setExpression('tableCount', (e) =>
                        e.count('tables of scroll area 1 of splitter group 1 of group 1'),
                      )
                      .ifThenElse(
                        (e) => e.gt('tableCount', 0),
                        (tableThen) =>
                          tableThen
                            .comment('Get first table (process list)')
                            .tellTarget('table 1 of scroll area 1 of splitter group 1 of group 1')
                            .setExpressions({
                              rowCount: (e) => e.count('rows'),
                              columnCount: (e) => e.count('columns'),
                            })
                            .comment('Search for claude process')
                            .set('foundRow', 0)
                            .repeatWithRange('i', 1, 'rowCount')
                            .tryCatch(
                              (tryB) =>
                                tryB
                                  .setExpression('rowText', 'value of static text 1 of row i')
                                  .ifThen(
                                    'rowText contains "claude" or rowText contains "Claude"',
                                    (ifB) =>
                                      ifB
                                        .setExpression('foundRow', 'i')
                                        .comment('Found the claude row!'),
                                  ),
                              (catchB) => catchB.comment('Skip rows that cause errors'),
                            )
                            .endrepeat()
                            .comment('Check if we found the row')
                            .ifThenElse(
                              (e) => e.gt('foundRow', 0),
                              (foundThen) =>
                                foundThen
                                  .setExpression(
                                    'result',
                                    '"Found claude process in row " & foundRow & " out of " & rowCount & " rows" & linefeed & ' +
                                      '"Table has " & columnCount & " columns"',
                                  )
                                  .comment('Try to select the row')
                                  .select('row foundRow')
                                  .delay(0.5)
                                  .appendTo('result', 'linefeed & "Selected the row"'),
                              (foundElse) =>
                                foundElse.setExpression(
                                  'result',
                                  '"Could not find claude process in " & rowCount & " rows"',
                                ),
                            )
                            .endtell(),
                        (tableElse) => tableElse.set('result', '"No tables found in scroll area"'),
                      ),
                  (scrollElse) =>
                    scrollElse.set('result', '"No scroll areas found in splitter group"'),
                ),
            (innerElse) => innerElse.set('result', '"No splitter groups found in group 1"'),
          ),
      (elseB) => elseB.set('result', '"No groups found in Activity Monitor window"'),
    )
    .returnRaw('result')
    .endtell()
    .endtell()
    .build();

  console.log('Generated AppleScript:');
  console.log(interactScript);
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing interaction script...\n');
  try {
    const result = await runScript<string>(interactScript);

    if (result.success && result.output) {
      console.log('Result:');
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

async function _clickInspectButton() {
  console.log('\n\nAttempting to click Inspect button...\n');

  const clickScript = createScript()
    .tellProcess('Activity Monitor')
    .comment('Look for the Inspect button in toolbar or menu bar')
    .setExpressions({
      buttonCount: (e) => e.count('buttons of window 1'),
      toolbarExists: 'exists toolbar 1 of window 1',
    })
    .ifThenElse(
      'toolbarExists',
      (thenB) =>
        thenB
          .setExpression('toolbarButtons', (e) => e.count('buttons of toolbar 1 of window 1'))
          .tryCatch(
            (tryB) =>
              tryB.setExpression(
                'buttonNames',
                'description of every button of toolbar 1 of window 1',
              ),
            (catchB) => catchB.set('buttonNames', '""'),
          ),
      (elseB) => elseB.set('buttonNames', '""'),
    )
    .setExpression(
      'debugInfo',
      '"Buttons in window: " & buttonCount & linefeed & ' +
        '"Toolbar exists: " & toolbarExists & linefeed & ' +
        '"Toolbar buttons: " & toolbarButtons & linefeed & ' +
        'buttonNames',
    )
    .comment('Try to click View menu -> Inspect Process')
    .tellTarget('menu bar 1')
    .tellTarget('menu bar item "View"')
    .tellTarget('menu "View"')
    .setExpression('menuItems', 'name of every menu item')
    .appendTo('debugInfo', 'linefeed & linefeed & "View menu items: " & menuItems')
    .comment('Click Inspect Process if it exists')
    .ifThenElse(
      'exists menu item "Inspect Process"',
      (thenB) =>
        thenB
          .click('menu item "Inspect Process"')
          .appendTo('debugInfo', 'linefeed & "Clicked Inspect Process menu item"')
          .delay(1),
      (elseB) => elseB.appendTo('debugInfo', 'linefeed & "Inspect Process menu item not found"'),
    )
    .endtell()
    .endtell()
    .endtell()
    .returnRaw('debugInfo')
    .endtell()
    .build();

  console.log('Generated AppleScript:');
  console.log(clickScript);
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing click script...\n');
  try {
    const result = await runScript<string>(clickScript);

    if (result.success && result.output) {
      console.log('Result:');
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

async function exploreInspectorWindow() {
  console.log('\n\nExploring Inspector Window...\n');

  const inspectScript = createScript()
    .tellProcess('Activity Monitor')
    .comment('Look for the inspector window')
    .setExpressions({
      winCount: (e) => e.count('windows'),
      winNames: 'name of every window',
    })
    .comment('Find the claude inspector window')
    .set('inspectorWin', 0)
    .repeatWithRange('i', 1, 'winCount')
    .ifThen('name of window i contains "claude"', (b) =>
      b.setExpression('inspectorWin', 'i').exitRepeat(),
    )
    .endrepeat()
    .ifThenElse(
      (e) => e.gt('inspectorWin', 0),
      (thenB) =>
        thenB
          .comment('Explore the inspector window')
          .tellTarget('window inspectorWin')
          .setExpressions({
            tabGroupCount: (e) => e.count('tab groups'),
            scrollCount: (e) => e.count('scroll areas'),
            groupCount: (e) => e.count('groups'),
          })
          .ifThenElse(
            (e) => e.gt('tabGroupCount', 0),
            (innerThen) =>
              innerThen
                .setExpressions({
                  radioGroupCount: (e) => e.count('radio groups of tab group 1'),
                  radioButtonCount: (e) => e.count('radio buttons of tab group 1'),
                })
                .ifThenElse(
                  (e) => e.gt('radioButtonCount', 0),
                  (radioThen) =>
                    radioThen.setExpression(
                      'radioNames',
                      'name of every radio button of tab group 1',
                    ),
                  (radioElse) => radioElse.set('radioNames', '""'),
                ),
            (innerElse) =>
              innerElse
                .set('radioGroupCount', 0)
                .set('radioButtonCount', 0)
                .set('radioNames', '""'),
          )
          .setExpression(
            'result',
            '"Inspector Window Found!" & linefeed & linefeed & ' +
              '"Tab groups: " & tabGroupCount & linefeed & ' +
              '"Radio groups in tab group 1: " & radioGroupCount & linefeed & ' +
              '"Radio buttons in tab group 1: " & radioButtonCount & linefeed & ' +
              '"Radio button names: " & radioNames & linefeed & ' +
              '"Scroll areas: " & scrollCount & linefeed & ' +
              '"Groups: " & groupCount',
          )
          .endtell(),
      (elseB) => elseB.set('result', '"Inspector window not found. Windows: " & winNames'),
    )
    .returnRaw('result')
    .endtell()
    .build();

  console.log('Generated AppleScript:');
  console.log(inspectScript);
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing inspector exploration script...\n');
  try {
    const result = await runScript<string>(inspectScript);

    if (result.success && result.output) {
      console.log('Result:');
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

async function clickOpenFilesAndPorts() {
  console.log('\n\nClicking Open Files and Ports tab...\n');

  const tabScript = createScript()
    .tellProcess('Activity Monitor')
    .comment('Find the claude inspector window')
    .set('inspectorWin', 0)
    .repeatWithRange('i', 1, '(count of windows)')
    .ifThen('name of window i contains "claude"', (b) =>
      b.setExpression('inspectorWin', 'i').exitRepeat(),
    )
    .endrepeat()
    .ifThenElse(
      (e) => e.gt('inspectorWin', 0),
      (thenB) =>
        thenB
          .tellTarget('window inspectorWin')
          .comment('Click the Open Files and Ports radio button')
          .ifThenElse(
            'exists tab group 1',
            (tabThen) =>
              tabThen
                .tellTarget('tab group 1')
                .repeatWith('rb', 'radio buttons')
                .ifThen('name of rb contains "Open Files" or name of rb contains "Ports"', (ifB) =>
                  ifB.click('rb').delay(0.5).exitRepeat(),
                )
                .endrepeat()
                .endtell()
                .comment('Now extract the table data')
                .ifThenElse(
                  'exists scroll area 1',
                  (scrollThen) =>
                    scrollThen.ifThenElse(
                      'exists table 1 of scroll area 1',
                      (tableThen) =>
                        tableThen
                          .tellTarget('table 1 of scroll area 1')
                          .setExpression('rowCount', (e) => e.count('rows'))
                          .setExpression(
                            'result',
                            '"Open Files and Ports data:" & linefeed & "Total rows: " & rowCount',
                          )
                          .endtell(),
                      (tableElse) => tableElse.set('result', '"No table found in scroll area"'),
                    ),
                  (scrollElse) => scrollElse.set('result', '"No scroll area found"'),
                ),
            (tabElse) => tabElse.set('result', '"No tab group found"'),
          )
          .endtell(),
      (elseB) => elseB.set('result', '"Inspector window not found"'),
    )
    .returnRaw('result')
    .endtell()
    .build();

  console.log('Generated AppleScript:');
  console.log(tabScript);
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('Executing tab click script...\n');
  try {
    const result = await runScript<string>(tabScript);

    if (result.success && result.output) {
      console.log('Result:');
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

// Run all the exploration steps
async function main() {
  console.log('Step 1: Exploring Activity Monitor UI structure...');
  await exploreActivityMonitorUI();

  console.log('\n\nStep 2: Finding and selecting claude process (if needed)...');
  //await findClaudeProcess();

  console.log('\n\nStep 3: Exploring Inspector Window...');
  await exploreInspectorWindow();

  console.log('\n\nStep 4: Clicking Open Files and Ports tab...');
  await clickOpenFilesAndPorts();

  console.log('\n\nDone! Check Activity Monitor to see if it worked.');
}

main();
