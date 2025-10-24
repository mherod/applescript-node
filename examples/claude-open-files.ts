import { createScript, runScript } from 'applescript-node';

/**
 * Complete GUI automation to get Open Files and Ports for claude process
 *
 * This script demonstrates:
 * - Navigating Activity Monitor's outline structure (not tables!)
 * - Searching for a process by name
 * - Opening the Inspector window
 * - Extracting data from text areas
 */

async function getClaudeOpenFiles() {
  console.log('Getting Open Files and Ports for claude process via GUI...\n');

  const script = createScript()
    .tell('Activity Monitor')
    .activate()
    .delay(1.5)
    .endtell()
    .tell('System Events')
    .raw('tell process "Activity Monitor"')
    .comment('Check if inspector already exists')
    .raw('set inspectorExists to false')
    .raw('set inspectorWin to 0')
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorExists to true')
    .raw('set inspectorWin to w')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .comment('If no inspector, find and select claude process')
    .raw('if not inspectorExists then')
    .raw('repeat with w from 1 to (count of windows)')
    .raw('set wName to name of window w')
    .raw('if wName contains "Activity Monitor" and wName does not contain "claude" then')
    .raw('tell window w')
    .raw('tell outline 1 of scroll area 1 of group 1')
    .raw('repeat with i from 1 to (count of rows)')
    .raw('try')
    .raw('set processName to value of static text 1 of UI element 1 of row i')
    .raw('if processName contains "claude" then')
    .raw('select row i')
    .delay(0.5)
    .raw('exit repeat')
    .raw('end if')
    .raw('on error')
    .raw('end try')
    .raw('end repeat')
    .raw('end tell')
    .raw('end tell')
    .comment('Open Inspector')
    .raw('tell menu bar 1')
    .raw('tell menu bar item "View"')
    .raw('tell menu "View"')
    .raw('click menu item "Inspect Process"')
    .delay(1.5)
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .comment('Find newly opened inspector')
    .raw('repeat with w from 1 to (count of windows)')
    .raw('if name of window w contains "claude" then')
    .raw('set inspectorWin to w')
    .raw('set inspectorExists to true')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .raw('end if')
    .comment('Extract data from inspector window')
    .raw('if inspectorExists and inspectorWin > 0 then')
    .raw('tell window inspectorWin')
    .comment('Ensure Open Files and Ports tab is selected')
    .raw('tell tab group 1')
    .raw('repeat with rb in radio buttons')
    .raw('if name of rb contains "Open Files" then')
    .raw('if (value of rb as integer) = 0 then')
    .raw('click rb')
    .delay(1)
    .raw('end if')
    .raw('exit repeat')
    .raw('end if')
    .raw('end repeat')
    .comment('Get full text area content using AXValue attribute')
    .raw('tell scroll area 1')
    .raw('tell text area 1')
    .raw('set output to value of attribute "AXValue"')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('end tell')
    .raw('else')
    .raw('set output to "Could not open or find inspector window"')
    .raw('end if')
    .returnRaw('output')
    .raw('end tell')
    .endtell()
    .build();

  console.log('Executing...\n');
  try {
    const result = await runScript<string>(script);

    if (result.success && result.output) {
      console.log('='.repeat(80));
      console.log('OPEN FILES AND PORTS FOR CLAUDE PROCESS:');
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

getClaudeOpenFiles();
