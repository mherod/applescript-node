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
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Get window information')
    .setExpression('winCount', 'count of windows')
    .setExpression('winNames', 'name of every window')
    .comment('Get main window UI elements')
    .raw('tell window 1')
    .setExpression('scrollCount', 'count of scroll areas')
    .setExpression('groupCount', 'count of groups')
    .setExpression('splitterCount', 'count of splitter groups')
    .comment('Explore group 1')
    .raw('if groupCount > 0 then')
    .setExpression('group1Tables', 'count of tables of group 1')
    .setExpression('group1ScrollAreas', 'count of scroll areas of group 1')
    .setExpression('group1Splitters', 'count of splitter groups of group 1')
    .raw('if group1Splitters > 0 then')
    .setExpression('splitterScrollAreas', 'count of scroll areas of splitter group 1 of group 1')
    .raw('if splitterScrollAreas > 0 then')
    .setExpression(
      'splitterTables',
      'count of tables of scroll area 1 of splitter group 1 of group 1',
    )
    .raw('else')
    .set('splitterTables', 0)
    .raw('end if')
    .raw('else')
    .set('splitterScrollAreas', 0)
    .set('splitterTables', 0)
    .raw('end if')
    .raw('else')
    .set('group1Tables', 0)
    .set('group1ScrollAreas', 0)
    .set('group1Splitters', 0)
    .set('splitterScrollAreas', 0)
    .set('splitterTables', 0)
    .raw('end if')
    .raw('end tell')
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
    .raw('end tell')
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
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Try to find the table with processes')
    .raw('tell window 1')
    .comment('Look for tables - try group -> splitter -> scroll area path')
    .setExpression('groupCount', 'count of groups')
    .raw('if groupCount > 0 then')
    .setExpression('splitterCount', 'count of splitter groups of group 1')
    .raw('if splitterCount > 0 then')
    .setExpression('scrollCount', 'count of scroll areas of splitter group 1 of group 1')
    .raw('if scrollCount > 0 then')
    .setExpression('tableCount', 'count of tables of scroll area 1 of splitter group 1 of group 1')
    .raw('if tableCount > 0 then')
    .comment('Get first table (process list)')
    .raw('tell table 1 of scroll area 1 of splitter group 1 of group 1')
    .setExpression('rowCount', 'count of rows')
    .setExpression('columnCount', 'count of columns')
    .comment('Search for claude process')
    .set('foundRow', 0)
    .raw('repeat with i from 1 to rowCount')
    .raw('try')
    .setExpression('rowText', 'value of static text 1 of row i')
    .raw('if rowText contains "claude" or rowText contains "Claude" then')
    .raw('set foundRow to i')
    .comment('Found the claude row!')
    .raw('end if')
    .raw('on error')
    .comment('Skip rows that cause errors')
    .raw('end try')
    .raw('end repeat')
    .comment('Check if we found the row')
    .raw('if foundRow > 0 then')
    .setExpression(
      'result',
      '"Found claude process in row " & foundRow & " out of " & rowCount & " rows" & linefeed & ' +
        '"Table has " & columnCount & " columns"',
    )
    .comment('Try to select the row')
    .raw('select row foundRow')
    .delay(0.5)
    .set('result', 'result & linefeed & "Selected the row"')
    .raw('else')
    .setExpression('result', '"Could not find claude process in " & rowCount & " rows"')
    .raw('end if')
    .raw('end tell')
    .raw('else')
    .set('result', '"No tables found in scroll area"')
    .raw('end if')
    .raw('else')
    .set('result', '"No scroll areas found in splitter group"')
    .raw('end if')
    .raw('else')
    .set('result', '"No splitter groups found in group 1"')
    .raw('end if')
    .raw('else')
    .set('result', '"No groups found in Activity Monitor window"')
    .raw('end if')
    .returnRaw('result')
    .raw('end tell')
    .raw('end tell')
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
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Look for the Inspect button in toolbar or menu bar')
    .setExpression('buttonCount', 'count of buttons of window 1')
    .setExpression('toolbarExists', 'exists toolbar 1 of window 1')
    .raw('if toolbarExists then')
    .setExpression('toolbarButtons', 'count of buttons of toolbar 1 of window 1')
    .raw('try')
    .setExpression('buttonNames', 'description of every button of toolbar 1 of window 1')
    .raw('on error')
    .set('buttonNames', '""')
    .raw('end try')
    .raw('else')
    .set('buttonNames', '""')
    .raw('end if')
    .setExpression(
      'debugInfo',
      '"Buttons in window: " & buttonCount & linefeed & ' +
        '"Toolbar exists: " & toolbarExists & linefeed & ' +
        '"Toolbar buttons: " & toolbarButtons & linefeed & ' +
        'buttonNames',
    )
    .comment('Try to click View menu -> Inspect Process')
    .raw('tell menu bar 1')
    .raw('tell menu bar item "View"')
    .raw('tell menu "View"')
    .setExpression('menuItems', 'name of every menu item')
    .raw('set debugInfo to debugInfo & linefeed & linefeed & "View menu items: " & menuItems')
    .comment('Click Inspect Process if it exists')
    .raw('if exists menu item "Inspect Process" then')
    .raw('click menu item "Inspect Process"')
    .raw('set debugInfo to debugInfo & linefeed & "Clicked Inspect Process menu item"')
    .delay(1)
    .raw('else')
    .raw('set debugInfo to debugInfo & linefeed & "Inspect Process menu item not found"')
    .raw('end if')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .returnRaw('debugInfo')
    .raw('end tell')
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
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Look for the inspector window')
    .setExpression('winCount', 'count of windows')
    .setExpression('winNames', 'name of every window')
    .comment('Find the claude inspector window')
    .set('inspectorWin', 0)
    .raw('repeat with i from 1 to winCount')
    .raw('if name of window i contains "claude" then')
    .raw('set inspectorWin to i')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('if inspectorWin > 0 then')
    .comment('Explore the inspector window')
    .raw('tell window inspectorWin')
    .setExpression('tabGroupCount', 'count of tab groups')
    .setExpression('scrollCount', 'count of scroll areas')
    .setExpression('groupCount', 'count of groups')
    .raw('if tabGroupCount > 0 then')
    .setExpression('radioGroupCount', 'count of radio groups of tab group 1')
    .setExpression('radioButtonCount', 'count of radio buttons of tab group 1')
    .raw('if radioButtonCount > 0 then')
    .setExpression('radioNames', 'name of every radio button of tab group 1')
    .raw('else')
    .set('radioNames', '""')
    .raw('end if')
    .raw('else')
    .set('radioGroupCount', 0)
    .set('radioButtonCount', 0)
    .set('radioNames', '""')
    .raw('end if')
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
    .raw('end tell')
    .raw('else')
    .set('result', '"Inspector window not found. Windows: " & winNames')
    .raw('end if')
    .returnRaw('result')
    .raw('end tell')
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
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Find the claude inspector window')
    .set('inspectorWin', 0)
    .raw('repeat with i from 1 to count of windows')
    .raw('if name of window i contains "claude" then')
    .raw('set inspectorWin to i')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('if inspectorWin > 0 then')
    .raw('tell window inspectorWin')
    .comment('Click the Open Files and Ports radio button')
    .raw('if exists tab group 1 then')
    .raw('tell tab group 1')
    .raw('repeat with rb in radio buttons')
    .raw('if name of rb contains "Open Files" or name of rb contains "Ports" then')
    .raw('click rb')
    .delay(0.5)
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('end tell')
    .comment('Now extract the table data')
    .raw('if exists scroll area 1 then')
    .raw('if exists table 1 of scroll area 1 then')
    .raw('tell table 1 of scroll area 1')
    .setExpression('rowCount', 'count of rows')
    .setExpression('result', '"Open Files and Ports data:" & linefeed & "Total rows: " & rowCount')
    .raw('end tell')
    .raw('else')
    .set('result', '"No table found in scroll area"')
    .raw('end if')
    .raw('else')
    .set('result', '"No scroll area found"')
    .raw('end if')
    .raw('else')
    .set('result', '"No tab group found"')
    .raw('end if')
    .raw('end tell')
    .raw('else')
    .set('result', '"Inspector window not found"')
    .raw('end if')
    .returnRaw('result')
    .raw('end tell')
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
