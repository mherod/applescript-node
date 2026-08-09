/**
 * Why `osa` exists: string concatenation is not safe for AppleScript sources.
 *
 * AppleScript has no parameterised statements — a script is just text — so any
 * value you splice into a source string is code until you escape it. This
 * example runs the same three inputs through naive concatenation and through
 * the `osa` tagged template, side by side, so the difference is visible rather
 * than theoretical.
 *
 * Nothing here touches your data: the payload used to demonstrate injection is
 * `echo`, and every script only returns a string.
 */

import { osa, runScript } from 'applescript-node';

interface Case {
  label: string;
  input: string;
  expected: string;
}

const cases: Case[] = [
  {
    label: 'plain text',
    input: 'Ada Lovelace',
    expected: 'Hello, Ada Lovelace',
  },
  {
    label: 'quotes and a backslash',
    input: 'Bobby "Tables" C:\\Users',
    expected: 'Hello, Bobby "Tables" C:\\Users',
  },
  {
    label: 'injection attempt',
    // Closes the literal, splices in a shell call, reopens the literal.
    input: '" & (do shell script "echo INJECTED") & "',
    expected: 'Hello, " & (do shell script "echo INJECTED") & "',
  },
];

/** The tempting, wrong way: drop the value straight into the source text. */
const naiveScript = (input: string): string => `return "Hello, ${input}"`;

/** The safe way: `osa` escapes the value into a literal it cannot escape from. */
const safeScript = (input: string): string => osa`return ${`Hello, ${input}`}`;

async function run(label: string, script: string, expected: string) {
  const result = await runScript<string>(script);
  const actual = result.success ? result.output : `<failed: ${result.error.split('\n')[0]}>`;
  const verdict = actual === expected ? 'OK  ' : 'WRONG';

  console.log(`  ${verdict} ${label}`);
  console.log(`        source:   ${script}`);
  console.log(`        expected: ${expected}`);
  console.log(`        actual:   ${actual}`);
}

async function main() {
  for (const { label, input, expected } of cases) {
    console.log(`\n=== ${label} ===`);
    console.log(`input: ${JSON.stringify(input)}`);

    console.log('\n  naive concatenation:');
    await run(label, naiveScript(input), expected);

    console.log('\n  osa tagged template:');
    await run(label, safeScript(input), expected);
  }

  console.log('\nThe naive column fails or executes attacker-chosen code.');
  console.log('The osa column returns the input verbatim, every time.');
}

main().catch(console.error);
