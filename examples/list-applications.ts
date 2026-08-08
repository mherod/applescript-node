import { AppleScriptBuilder, ScriptExecutor } from 'applescript-node';

/**
 * This example demonstrates how to list the windows of every foreground
 * application using AppleScript. It uses System Events to walk each non-background
 * process, collects each window's name and geometry, and returns them as JSON.
 */

interface WindowSummary {
  app: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function isWindowSummary(value: unknown): value is WindowSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value;
  return (
    'app' in obj &&
    'name' in obj &&
    'x' in obj &&
    'y' in obj &&
    'width' in obj &&
    'height' in obj &&
    typeof obj.app === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number'
  );
}

const builder = new AppleScriptBuilder();

const script = builder
  .tell('System Events')
  .set('allWindows', [])
  .forEach('proc', 'every application process whose background only is false', (b) =>
    b.forEach('win', 'every window of proc', (inner) =>
      inner
        .setExpression('winPos', 'position of win')
        .setExpression('winSize', 'size of win')
        .setEndRecord('allWindows', {
          app: 'name of proc',
          name: 'name of win',
          x: 'item 1 of winPos',
          y: 'item 2 of winPos',
          width: 'item 1 of winSize',
          height: 'item 2 of winSize',
        }),
    ),
  )
  .returnAsJson('allWindows', {
    app: 'app',
    name: 'name',
    x: 'x',
    y: 'y',
    width: 'width',
    height: 'height',
  })
  .end()
  .build();

console.log('Generated AppleScript:');
console.log(script);
console.log('\nExecuting script...\n');

// Execute the script using our ScriptExecutor
async function listApplications() {
  try {
    const result = await ScriptExecutor.execute(script);
    if (result.success) {
      console.log('Running Application Windows (JSON Output):');
      const parsed: unknown = JSON.parse(result.output);
      const windows: WindowSummary[] = Array.isArray(parsed) ? parsed.filter(isWindowSummary) : [];
      console.log(JSON.stringify(windows, null, 2));
    } else {
      console.error('Error executing AppleScript:', result.error);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

listApplications();
