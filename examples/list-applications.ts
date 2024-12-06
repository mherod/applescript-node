import { AppleScriptBuilder, ScriptExecutor } from 'applescript-node';

/**
 * This example demonstrates how to list all running applications using AppleScript.
 * It uses System Events to get a list of all running processes and their names.
 */

const builder = new AppleScriptBuilder();

const script = builder.tell('System Events').get('name of every process').end().build();

console.log('Generated AppleScript:');
console.log(script);
console.log('\nExecuting script...\n');

// Execute the script using our ScriptExecutor
async function listApplications() {
  try {
    const result = await ScriptExecutor.execute(script);
    if (result.success) {
      console.log('Running Applications:');
      console.log(
        result.output
          .split(',')
          .map((app: string) => `- ${app.trim()}`)
          .join('\n'),
      );
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
