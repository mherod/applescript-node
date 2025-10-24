import { createScript, runScript } from 'applescript-node';

/**
 * Complete script that:
 * 1. Opens Activity Monitor
 * 2. Finds and selects the claude process
 * 3. Opens the Inspector
 * 4. Clicks "Open Files and Ports" tab
 * 5. Extracts and displays the information
 *
 * All in one script execution to avoid windows closing between steps.
 */

async function getClaudeOpenFilesAndPorts() {
  console.log('Creating comprehensive script...\n');

  const completeScript = createScript()
    .comment('Step 1: Launch and activate Activity Monitor')
    .tell('Activity Monitor')
    .activate()
    .delay(1.5)
    .endtell()
    .comment('Step 2: Use System Events for GUI scripting')
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Step 2a: Check if inspector window already exists for claude')
    .raw('set inspectorExists to false')
    .set('inspectorWin', 0)
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorExists to true')
    .raw('set inspectorWin to w')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .comment('Step 3: If no inspector, find and select claude process')
    .set('claudeRow', 0)
    .set('debugOutput', '""')
    .raw('if inspectorExists then')
    .raw(
      'set debugOutput to "Inspector window already exists at window " & inspectorWin & linefeed',
    )
    .raw('end if')
    .raw('if not inspectorExists then')
    .raw('set debugOutput to "Inspector not found, searching for claude process..." & linefeed')
    .comment('Find the main Activity Monitor window')
    .set('mainWin', 0)
    .setExpression('winCount', 'count of windows')
    .raw('set debugOutput to debugOutput & "Total windows: " & winCount & linefeed')
    .raw('repeat with w from 1 to winCount')
    .raw('set wName to name of window w')
    .raw('set debugOutput to debugOutput & "Window " & w & ": " & wName & linefeed')
    .raw('if wName contains "Activity Monitor" and wName does not contain "claude" then')
    .raw('set mainWin to w')
    .raw('set debugOutput to debugOutput & "Selected as main window!" & linefeed')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('if mainWin > 0 then')
    .raw('tell window mainWin')
    .comment('Debug: dump window structure')
    .setExpression('scrollAreas', 'count of scroll areas')
    .setExpression('groupsCount', 'count of groups')
    .raw(
      'set debugOutput to debugOutput & "Window structure: " & scrollAreas & " scroll areas, " & groupsCount & " groups" & linefeed',
    )
    .raw('if groupsCount > 0 then')
    .setExpression('splittersInG1', 'count of splitter groups of group 1')
    .setExpression('scrollInG1', 'count of scroll areas of group 1')
    .raw(
      'set debugOutput to debugOutput & "Group 1: " & splittersInG1 & " splitters, " & scrollInG1 & " scrolls" & linefeed',
    )
    .raw('if scrollInG1 > 0 then')
    .setExpression('tablesInG1Scroll', 'count of tables of scroll area 1 of group 1')
    .raw(
      'set debugOutput to debugOutput & "  Group 1 Scroll 1 has " & tablesInG1Scroll & " tables" & linefeed',
    )
    .raw('end if')
    .raw('if groupsCount > 1 then')
    .setExpression('splittersInG2', 'count of splitter groups of group 2')
    .setExpression('scrollInG2', 'count of scroll areas of group 2')
    .raw(
      'set debugOutput to debugOutput & "Group 2: " & splittersInG2 & " splitters, " & scrollInG2 & " scrolls" & linefeed',
    )
    .raw('end if')
    .raw('end if')
    .comment('Access the outline (not table!)')
    .raw('set outlineRef to missing value')
    .raw('if exists group 1 then')
    .raw('if exists scroll area 1 of group 1 then')
    .raw('if exists outline 1 of scroll area 1 of group 1 then')
    .raw('set outlineRef to outline 1 of scroll area 1 of group 1')
    .raw('set debugOutput to debugOutput & "Found outline in group->scroll" & linefeed')
    .raw('end if')
    .raw('end if')
    .raw('end if')
    .comment('Search for claude process if outline was found')
    .raw('if outlineRef is not missing value then')
    .raw('tell outlineRef')
    .setExpression('rowCount', 'count of rows')
    .raw('set debugOutput to debugOutput & "Searching " & rowCount & " rows..." & linefeed')
    .raw('repeat with i from 1 to rowCount')
    .raw('try')
    .comment('Get process name from first cell static text')
    .raw('set processName to value of static text 1 of UI element 1 of row i')
    .raw('if processName contains "claude" then')
    .raw('set claudeRow to i')
    .raw('select row i')
    .raw(
      'set debugOutput to debugOutput & "Found claude in row " & i & " (name: " & processName & ")" & linefeed',
    )
    .delay(0.3)
    .raw('exit repeat')
    .raw('end if')
    .raw('on error')
    .raw('-- Skip errors')
    .raw('end try')
    .raw('end repeat')
    .raw('end tell')
    .raw('else')
    .raw('set debugOutput to debugOutput & "No outline found" & linefeed')
    .raw('end if')
    .raw('end tell')
    .comment('Step 4: Open Inspector via View menu if process found')
    .raw('if claudeRow > 0 then')
    .raw('tell menu bar 1')
    .raw('tell menu bar item "View"')
    .raw('tell menu "View"')
    .raw('if exists menu item "Inspect Process" then')
    .raw('click menu item "Inspect Process"')
    .delay(1.5)
    .raw('end if')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .comment('Find the newly opened inspector window')
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorWin to w')
    .raw('set inspectorExists to true')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('end if')
    .raw('else')
    .raw('-- Main window not found')
    .raw('end if')
    .raw('end if')
    .comment('Step 5: Work with inspector window (whether it existed or was just opened)')
    .raw('if inspectorExists and inspectorWin > 0 then')
    .raw('tell window inspectorWin')
    .raw('if exists tab group 1 then')
    .raw('tell tab group 1')
    .comment('Find and click Open Files and Ports radio button')
    .raw('repeat with rb in radio buttons')
    .raw('try')
    .raw('set rbName to name of rb')
    .raw('if rbName contains "Open Files" or rbName contains "Ports" then')
    .raw('if (value of rb as integer) = 0 then')
    .raw('click rb')
    .delay(1)
    .raw('end if')
    .raw('exit repeat')
    .raw('end if')
    .raw('on error')
    .raw('-- Skip button errors')
    .raw('end try')
    .raw('end repeat')
    .raw('end tell')
    .raw('end if')
    .comment('Step 6: Extract text area data from Open Files and Ports')
    .setExpression(
      'output',
      'debugOutput & linefeed & "=== INSPECTOR WINDOW DATA ===" & linefeed & "Open Files and Ports for claude process" & linefeed & linefeed',
    )
    .raw('if exists scroll area 1 then')
    .comment('The data is in a text area, not a table!')
    .raw('if exists text area 1 of scroll area 1 then')
    .setExpression('textData', 'value of text area 1 of scroll area 1')
    .raw('set output to output & textData')
    .raw('else')
    .setExpression('output', 'debugOutput & linefeed & "No text area found in scroll area"')
    .raw('end if')
    .raw('else')
    .setExpression('output', 'debugOutput & linefeed & "No scroll area found in inspector window"')
    .raw('end if')
    .raw('end tell')
    .raw('else')
    .setExpression(
      'output',
      'debugOutput & linefeed & "=== FINAL STATUS ===" & linefeed & "Inspector window could not be opened or found" & linefeed & "inspectorExists: " & inspectorExists & linefeed & "inspectorWin: " & inspectorWin & linefeed & "claudeRow: " & claudeRow',
    )
    .raw('end if')
    .returnRaw('output')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Generated AppleScript (first 100 lines):');
  console.log(completeScript.split('\n').slice(0, 100).join('\n'));
  console.log('...\n');
  console.log('='.repeat(80) + '\n');

  console.log('Executing comprehensive script...\n');
  console.log('This will:');
  console.log('1. Open Activity Monitor');
  console.log('2. Find and select the claude process');
  console.log('3. Open the Inspector window');
  console.log('4. Click the "Open Files and Ports" tab');
  console.log('5. Extract the first 20 entries\n');
  console.log('='.repeat(80) + '\n');

  try {
    const result = await runScript<string>(completeScript);

    if (result.success && result.output) {
      console.log('SUCCESS! Result:');
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

// Run the complete script
getClaudeOpenFilesAndPorts();
