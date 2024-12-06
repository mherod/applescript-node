import { AppleScriptBuilder, ScriptExecutor } from 'applescript-node';

const builder = new AppleScriptBuilder();

// Get window info for Finder's Downloads folder
const script = builder
  .tell('Finder')
  .raw('tell window "Downloads" to return {name, bounds}')
  .end()
  .build();

console.log('Generated AppleScript:');
console.log(script);
console.log('\nExecuting script...\n');

async function manageWindows() {
  try {
    // Get window info
    const result = await ScriptExecutor.execute(script);
    if (!result.success) {
      console.error('Error getting window info:', result.error);
      return;
    }

    console.log('Window info:', result.output);

    // Move window to new position
    const moveScript = builder
      .tell('Finder')
      .raw('tell window "Downloads" to set position to {100, 100}')
      .end()
      .build();

    const moveResult = await ScriptExecutor.execute(moveScript);
    if (!moveResult.success) {
      console.error('Error moving window:', moveResult.error);
      return;
    }

    console.log('Window moved successfully');

    // Resize window
    const resizeScript = builder
      .tell('Finder')
      .raw('tell window "Downloads" to set size to {800, 600}')
      .end()
      .build();

    const resizeResult = await ScriptExecutor.execute(resizeScript);
    if (!resizeResult.success) {
      console.error('Error resizing window:', resizeResult.error);
      return;
    }

    console.log('Window resized successfully');

    // Minimize window
    const minimizeScript = builder
      .tell('Finder')
      .raw('set miniaturized of window "Downloads" to true')
      .end()
      .build();

    const minimizeResult = await ScriptExecutor.execute(minimizeScript);
    if (!minimizeResult.success) {
      console.error('Error minimizing window:', minimizeResult.error);
      return;
    }

    console.log('Window minimized successfully');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Unminimize window
    const unminimizeScript = builder
      .tell('Finder')
      .raw('set miniaturized of window "Downloads" to false')
      .end()
      .build();

    const unminimizeResult = await ScriptExecutor.execute(unminimizeScript);
    if (!unminimizeResult.success) {
      console.error('Error unminimizing window:', unminimizeResult.error);
      return;
    }

    console.log('Window unminimized successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

manageWindows();
