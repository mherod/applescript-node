/**
 * Top-level scripting helpers — a tour of the shortest paths to a result.
 *
 * Every helper here is a thin wrapper over the executor or the builder, so
 * anything you can do with `runScript` you can still do; these just remove the
 * boilerplate from the cases you write most often.
 */

import {
  activate,
  isRunning,
  osa,
  runJxa,
  runScriptOrThrow,
  ScriptExecutionError,
  tell,
  toAppleScriptLiteral,
} from 'applescript-node';

async function main() {
  // 1. `osa` — a tagged template that escapes every interpolated value.
  console.log('--- osa: building script source ---');
  const appName = 'Finder';
  const script = osa`tell application ${appName} to get name of home`;
  console.log('source:', script);
  console.log('output:', await runScriptOrThrow(script));

  // Values become AppleScript literals, not string concatenation: lists stay
  // lists, records stay records, `null` becomes `missing value`.
  console.log('\n--- toAppleScriptLiteral: JS values -> AppleScript literals ---');
  console.log('list:  ', toAppleScriptLiteral(['Documents', 'Desktop']));
  console.log('record:', toAppleScriptLiteral({ name: 'Finder', visible: true }));
  console.log('null:  ', toAppleScriptLiteral(null));

  // 2. `tell` — run a body inside a `tell application` block without building
  // the block yourself. The body can be a raw string...
  console.log('\n--- tell: raw string body ---');
  const home = await tell<string>('Finder', 'get name of home');
  console.log('home folder:', home.output);

  // ...or a callback that receives the builder, already inside the block.
  console.log('\n--- tell: builder callback body ---');
  const diskCount = await tell<string>('Finder', (b) => b.get('count of every disk'));
  console.log('mounted disks:', diskCount.output);

  // 3. `isRunning` / `activate` — the two most common app-level questions.
  // `isRunning` goes through System Events, so it never launches the app.
  console.log('\n--- isRunning / activate ---');
  console.log('Finder running?     ', await isRunning('Finder'));
  console.log('DefinitelyNotAnApp? ', await isRunning('DefinitelyNotAnApp'));

  await activate('Finder');
  console.log('activated Finder');

  // 4. `runJxa` — the same execution path, but JavaScript for Automation.
  console.log('\n--- runJxa: JavaScript instead of AppleScript ---');
  const jxa = await runJxa<string>('Application("Finder").name()');
  console.log('app name via JXA:', jxa.output);

  // JXA returning JSON is parsed automatically, exactly like `runScript`.
  const jxaJson = await runJxa<{ user: string; shell: string }>(
    'JSON.stringify({ user: $.NSUserName().js, shell: "jxa" })',
  );
  console.log('parsed JSON:', jxaJson.output, '(typeof:', typeof jxaJson.output, ')');

  // 5. `runScriptOrThrow` — output directly, or a typed error. Useful when a
  // failure is genuinely exceptional and you do not want to branch on
  // `result.success` at every call site.
  console.log('\n--- runScriptOrThrow: errors as exceptions ---');
  try {
    await runScriptOrThrow('this is not valid applescript at all');
  } catch (error) {
    if (error instanceof ScriptExecutionError) {
      // The error carries the script that produced it, so a failure deep in a
      // helper chain still tells you exactly what osascript was asked to run.
      console.log('caught ScriptExecutionError');
      console.log(
        '  exitCode:',
        error.exitCode,
        '(always 1 — osascript does not map error numbers)',
      );
      console.log('  script:  ', error.script);

      // osascript writes two useful lines: the shell command it ran, then the
      // AppleScript diagnostic with source offsets and the AppleScript error
      // number. The second line is the one worth surfacing to a user.
      const [command, diagnostic] = error.message.split('\n');
      console.log('  command: ', command);
      console.log('  detail:  ', diagnostic);
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
