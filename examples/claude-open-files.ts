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
    .tellProcess('Activity Monitor')
    .comment('Check if inspector already exists')
    .set('inspectorExists', false)
    .set('inspectorWin', 0)
    .repeatWithRange('w', 1, '(count of windows)')
    .ifThen('name of window w contains "claude"', (b) =>
      b.set('inspectorExists', true).setExpression('inspectorWin', 'w').exitRepeat(),
    )
    .endrepeat()
    .comment('If no inspector, find and select claude process')
    .if('not inspectorExists')
    .thenBlock()
    .repeatWithRange('w', 1, '(count of windows)')
    .setExpression('wName', 'name of window w')
    .if('wName contains "Activity Monitor" and wName does not contain "claude"')
    .thenBlock()
    .tellTarget('window w')
    .tellTarget('outline 1 of scroll area 1 of group 1')
    .repeatWithRange('i', 1, '(count of rows)')
    .tryCatch(
      (tryBlock) =>
        tryBlock
          .setExpression('processName', 'value of static text 1 of UI element 1 of row i')
          .ifThen('processName contains "claude"', (b) =>
            b.select('row i').delay(0.5).exitRepeat(),
          ),
      (catchBlock) => catchBlock.comment('Skip rows with errors'),
    )
    .endrepeat()
    .endtell()
    .endtell()
    .comment('Open Inspector')
    .tellTarget('menu bar 1')
    .tellTarget('menu bar item "View"')
    .tellTarget('menu "View"')
    .click('menu item "Inspect Process"')
    .delay(1.5)
    .endtell()
    .endtell()
    .endtell()
    .comment('Find newly opened inspector')
    .repeatWithRange('w', 1, '(count of windows)')
    .ifThen('name of window w contains "claude"', (b) =>
      b.setExpression('inspectorWin', 'w').set('inspectorExists', true).exitRepeat(),
    )
    .endrepeat()
    .exitRepeat()
    .endif()
    .endrepeat()
    .endif()
    .comment('Extract data from inspector window')
    .ifThenElse(
      'inspectorExists and inspectorWin > 0',
      (thenBlock) =>
        thenBlock
          .tellTarget('window inspectorWin')
          .comment('Ensure Open Files and Ports tab is selected')
          .tellTarget('tab group 1')
          .repeatWith('rb', 'radio buttons')
          .ifThen('name of rb contains "Open Files"', (b) =>
            b
              .ifThen('(value of rb as integer) = 0', (innerBlock) =>
                innerBlock.click('rb').delay(1),
              )
              .exitRepeat(),
          )
          .endrepeat()
          .comment('Get full text area content using AXValue attribute')
          .tellTarget('scroll area 1')
          .tellTarget('text area 1')
          .setExpression('output', 'value of attribute "AXValue"')
          .endtell()
          .endtell()
          .endtell()
          .endtell(),
      (elseBlock) => elseBlock.set('output', 'Could not open or find inspector window'),
    )
    .returnRaw('output')
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
