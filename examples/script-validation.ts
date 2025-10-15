import CliTable3 from 'cli-table3';
import chalk from 'chalk';
import { ScriptValidator, createScript } from '../src/index.js';

async function demonstrateScriptValidation() {
  console.log(chalk.bold.blue('🔍 Script Validation Demo\n'));
  console.log(
    chalk.gray('Validate AppleScript before execution using application scripting dictionaries.\n'),
  );

  // Create a validator for Messages.app
  console.log(chalk.yellow('Creating validator for Messages.app...'));
  const validator = await ScriptValidator.forApplication('/System/Applications/Messages.app');
  console.log(chalk.green('✓ Validator ready\n'));

  // Example 1: Valid script
  console.log(chalk.bold('Example 1: Valid Script'));
  console.log(chalk.gray('Testing a valid Messages.app script...\n'));

  const validScript = createScript()
    .tell('Messages')
    .raw('send "Hello World" to "+1234567890"')
    .raw('login')
    .end()
    .build();

  console.log(chalk.dim('Script:'));
  console.log(chalk.dim(validScript));
  console.log();

  const validResult = validator.validate(validScript);
  displayValidationResult(validResult);

  // Example 2: Script with unknown command
  console.log(chalk.bold('\nExample 2: Unknown Command'));
  console.log(chalk.gray("Testing script with a command that doesn't exist...\n"));

  const unknownCommandScript = `
    tell application "Messages"
      invalid_send_command "Hello"
      unknown_action
    end tell
  `;

  console.log(chalk.dim('Script:'));
  console.log(chalk.dim(unknownCommandScript.trim()));
  console.log();

  const unknownResult = validator.validate(unknownCommandScript, { provideSuggestions: true });
  displayValidationResult(unknownResult);

  // Example 3: Read-only property write attempt
  console.log(chalk.bold('\nExample 3: Read-Only Property'));
  console.log(chalk.gray('Attempting to modify a read-only property...\n'));

  const readOnlyScript = `
    tell application "Messages"
      set id of chat "test" to "new-id"
    end tell
  `;

  console.log(chalk.dim('Script:'));
  console.log(chalk.dim(readOnlyScript.trim()));
  console.log();

  const readOnlyResult = validator.validate(readOnlyScript);
  displayValidationResult(readOnlyResult);

  // Example 4: Command with typo (suggestion test)
  console.log(chalk.bold('\nExample 4: Command Typo with Suggestion'));
  console.log(chalk.gray('Testing script with a typo in command name...\n'));

  const typoScript = `
    tell application "Messages"
      sen "Hello"
      logn
    end tell
  `;

  console.log(chalk.dim('Script:'));
  console.log(chalk.dim(typoScript.trim()));
  console.log();

  const typoResult = validator.validate(typoScript, { provideSuggestions: true });
  displayValidationResult(typoResult);

  // Example 5: Strict mode validation
  console.log(chalk.bold('\nExample 5: Strict Mode Validation'));
  console.log(chalk.gray('Using strict mode (warnings treated as errors)...\n'));

  const warningScript = `
    tell application "Messages"
      possibly_unknown_command
    end tell
  `;

  console.log(chalk.dim('Script:'));
  console.log(chalk.dim(warningScript.trim()));
  console.log();

  const strictResult = validator.validate(warningScript, { strictness: 'strict' });
  console.log(chalk.yellow(`Strictness: strict (warnings = errors)\n`));
  displayValidationResult(strictResult);

  // Example 6: Property access validation
  console.log(chalk.bold('\nExample 6: Property Access Validation'));
  console.log(chalk.gray('Validating specific property access...\n'));

  const propertyTests = [
    { className: 'chat', propertyName: 'id', accessType: 'read' as const },
    { className: 'chat', propertyName: 'id', accessType: 'write' as const },
    { className: 'account', propertyName: 'enabled', accessType: 'write' as const },
  ];

  const propertyTable = new CliTable3({
    head: [
      chalk.cyan('Class'),
      chalk.cyan('Property'),
      chalk.cyan('Access'),
      chalk.cyan('Valid?'),
      chalk.cyan('Issue'),
    ],
    style: { head: [], border: [] },
    colWidths: [15, 15, 10, 10, 40],
    wordWrap: true,
  });

  for (const test of propertyTests) {
    const issues = validator.validatePropertyAccess(
      test.className,
      test.propertyName,
      test.accessType,
    );

    const hasErrors = issues.some((i) => i.severity === 'error');
    const status = hasErrors ? chalk.red('✗ No') : chalk.green('✓ Yes');
    const issue = hasErrors ? chalk.red(issues[0].message) : chalk.gray('No issues');

    propertyTable.push([
      chalk.white(test.className),
      chalk.white(test.propertyName),
      chalk.yellow(test.accessType),
      status,
      issue,
    ]);
  }

  console.log(propertyTable.toString());

  // Example 7: Command parameter validation
  console.log(chalk.bold('\n\nExample 7: Command Parameter Validation'));
  console.log(chalk.gray('Checking if required parameters are provided...\n'));

  const paramTests = [
    { command: 'send', params: { to: '+1234567890' }, label: 'With required param' },
    { command: 'send', params: {}, label: 'Missing required param' },
    { command: 'login', params: {}, label: 'No params needed' },
  ];

  const paramTable = new CliTable3({
    head: [chalk.cyan('Command'), chalk.cyan('Test'), chalk.cyan('Valid?'), chalk.cyan('Issues')],
    style: { head: [], border: [] },
    colWidths: [15, 25, 10, 40],
    wordWrap: true,
  });

  for (const test of paramTests) {
    const issues = validator.validateCommand(test.command, test.params);

    const hasErrors = issues.some((i) => i.severity === 'error');
    const status = hasErrors ? chalk.red('✗ No') : chalk.green('✓ Yes');
    const errorIssue = issues.find((i) => i.severity === 'error');
    const issueText = errorIssue ? chalk.red(errorIssue.message) : chalk.gray('No issues');

    paramTable.push([chalk.white(test.command), chalk.white(test.label), status, issueText]);
  }

  console.log(paramTable.toString());

  // Summary
  console.log(chalk.bold.cyan('\n\n📊 Available Commands & Classes'));
  const commands = validator.getAvailableCommands();
  const classes = validator.getAvailableClasses();

  console.log(chalk.white(`Total Commands: ${chalk.yellow(commands.length)}`));
  console.log(
    chalk.white(
      `  Examples: ${chalk.gray(
        commands
          .slice(0, 5)
          .map((c) => c.name)
          .join(', '),
      )}`,
    ),
  );

  console.log(chalk.white(`Total Classes: ${chalk.yellow(classes.length)}`));
  console.log(
    chalk.white(
      `  Examples: ${chalk.gray(
        classes
          .slice(0, 5)
          .map((c) => c.name)
          .join(', '),
      )}`,
    ),
  );

  console.log(chalk.bold.green('\n✓ Validation demonstration complete!\n'));
}

/**
 * Display validation result in a formatted table
 */
function displayValidationResult(result: {
  valid: boolean;
  issues: Array<{ severity: string; message: string; code?: string; suggestion?: string }>;
  errors: Array<{ severity: string; message: string; code?: string; suggestion?: string }>;
  warnings: Array<{ severity: string; message: string; code?: string; suggestion?: string }>;
  info: Array<{ severity: string; message: string; code?: string; suggestion?: string }>;
}): void {
  // Status
  const statusIcon = result.valid ? chalk.green('✓ VALID') : chalk.red('✗ INVALID');
  console.log(chalk.bold(`Status: ${statusIcon}`));

  if (result.issues.length === 0) {
    console.log(chalk.gray('  No issues found\n'));
    return;
  }

  // Issues summary
  console.log(
    chalk.white(
      `Issues: ${chalk.red(`${result.errors.length} errors`)}, ${chalk.yellow(`${result.warnings.length} warnings`)}, ${chalk.blue(`${result.info.length} info`)}`,
    ),
  );

  // Issues table
  if (result.issues.length > 0) {
    const issuesTable = new CliTable3({
      head: [chalk.cyan('Severity'), chalk.cyan('Code'), chalk.cyan('Message')],
      style: { head: [], border: [] },
      colWidths: [12, 20, 58],
      wordWrap: true,
    });

    for (const issue of result.issues) {
      const severityColor =
        issue.severity === 'error'
          ? chalk.red
          : issue.severity === 'warning'
            ? chalk.yellow
            : chalk.blue;

      issuesTable.push([
        severityColor(issue.severity.toUpperCase()),
        chalk.gray(issue.code ?? 'N/A'),
        chalk.white(issue.message),
      ]);

      if (issue.suggestion) {
        issuesTable.push(['', chalk.cyan('Suggestion:'), chalk.gray(issue.suggestion)]);
      }
    }

    console.log();
    console.log(issuesTable.toString());
  }

  console.log();
}

// Run the demonstration
demonstrateScriptValidation().catch(console.error);
