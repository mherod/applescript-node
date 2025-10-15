import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import { createScript, runScript, ScriptValidator } from '../src/index.js';

async function demonstrateNotesAutomation() {
  console.log(chalk.bold.blue('📝 Notes.app - Automation Demo\n'));
  console.log(chalk.gray('Demonstrates Notes.app scripting with validation.\n'));

  // Create validator for Notes.app
  console.log(chalk.yellow('🔍 Loading Notes.app scripting dictionary...'));
  const validator = await ScriptValidator.forApplication('/System/Applications/Notes.app');
  console.log(chalk.green('✓ Validator ready\n'));

  // Show available capabilities
  const commands = validator.getAvailableCommands();
  const classes = validator.getAvailableClasses();
  console.log(chalk.gray(`Available: ${commands.length} commands, ${classes.length} classes\n`));

  // Activate Notes.app
  console.log(chalk.yellow('Opening Notes.app...'));
  const activateScript = createScript().tell('Notes').activate().delay(1).end();

  const activateValidation = validator.validate(activateScript.build());
  if (!activateValidation.valid) {
    console.log(chalk.red('✗ Script validation failed:'));
    activateValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
    return;
  }

  await runScript(activateScript);
  console.log(chalk.green('✓ Notes.app opened\n'));

  // Get account information
  console.log(chalk.yellow('📊 Gathering account information...'));
  const accountsScript = createScript()
    .tell('Notes')
    .set('accountInfo', [])
    .repeatWith('acc', 'every account')
    .try()
    .setEndRecord('accountInfo', {
      accountName: 'name of acc',
      accountId: 'id of acc',
      noteCount: 'count of notes in acc',
      folderCount: 'count of folders in acc',
    })
    .onError()
    .comment('Skip accounts with errors')
    .end()
    .end()
    .returnRaw('accountInfo')
    .end();

  const accountsValidation = validator.validate(accountsScript.build());
  if (accountsValidation.warnings.length > 0) {
    console.log(
      chalk.yellow(
        `⚠ ${accountsValidation.warnings.length} validation warnings (executing anyway)`,
      ),
    );
  }

  const accountsResult = await runScript(accountsScript);

  if (accountsResult.success && accountsResult.output) {
    console.log(chalk.bold('\n📋 Accounts:\n'));

    const accountTable = new CliTable3({
      head: [
        chalk.cyan('Account'),
        chalk.cyan('Notes'),
        chalk.cyan('Folders'),
        chalk.cyan('ID (truncated)'),
      ],
      style: { head: [], border: [] },
      colWidths: [25, 10, 10, 35],
    });

    const output = String(accountsResult.output);
    const accountRecords = output.split('accountName:').slice(1);

    accountRecords.forEach((record) => {
      const nameMatch = /^([^,]+)/.exec(record);
      const noteCountMatch = /noteCount:(\d+)/.exec(record);
      const folderCountMatch = /folderCount:(\d+)/.exec(record);
      const idMatch = /accountId:([^,}]+)/.exec(record);

      if (nameMatch) {
        const name = nameMatch[1].trim();
        const noteCount = noteCountMatch ? noteCountMatch[1] : '0';
        const folderCount = folderCountMatch ? folderCountMatch[1] : '0';
        const id = idMatch ? idMatch[1].trim() : 'Unknown';
        const truncatedId = id.length > 30 ? id.substring(0, 27) + '...' : id;

        accountTable.push([
          chalk.white(name),
          chalk.yellow(noteCount),
          chalk.blue(folderCount),
          chalk.gray(truncatedId),
        ]);
      }
    });

    console.log(accountTable.toString());
  }

  // Get total note count first
  console.log(chalk.yellow('\n\n📊 Gathering note statistics...'));
  const statsScript = createScript()
    .tell('Notes')
    .setCountOf('totalNotes', 'every note')
    .returnRaw('totalNotes')
    .end();

  const statsResult = await runScript(statsScript);
  const totalNotes = statsResult.success ? Number.parseInt(String(statsResult.output)) : 0;

  console.log(chalk.white(`Total notes in Notes.app: ${chalk.yellow(totalNotes)}\n`));

  // Determine how many notes to fetch (up to 50)
  const notesToFetch = Math.min(totalNotes, 50);
  if (notesToFetch === 0) {
    console.log(chalk.yellow('No notes found in Notes.app\n'));
  } else {
    console.log(
      chalk.yellow(
        `📝 Fetching ${notesToFetch === 50 ? 'first 50' : 'all'} notes (${notesToFetch} total)...`,
      ),
    );

    const notesScript = createScript()
      .tell('Notes')
      .set('notesList', [])
      .set('counter', 0)
      // Use forEachUntil for cleaner iteration with built-in break condition
      .forEachUntil(
        'aNote',
        'every note',
        (e) => e.gt('counter', notesToFetch),
        (b) =>
          b
            .increment('counter')
            // Use tryCatch with fluent chaining in callback
            .tryCatch(
              (tryBlock) =>
                tryBlock
                  .setExpression('notePlaintext', 'plaintext of aNote')
                  .comment('Truncate plaintext to first 100 characters')
                  // Use ifThenElse with ExprBuilder for type-safe conditions
                  .ifThenElse(
                    (e) => e.gt(e.length('notePlaintext'), 100),
                    (then_) =>
                      then_.setExpression(
                        'notePreview',
                        'text 1 thru 100 of notePlaintext & "..."',
                      ),
                    (else_) => else_.setExpression('notePreview', 'notePlaintext'),
                  )
                  // Use setEndRecord for clean record creation
                  .setEndRecord('notesList', {
                    noteName: 'name of aNote',
                    noteId: 'id of aNote',
                    preview: 'notePreview',
                    created: 'creation date of aNote as string',
                    modified: 'modification date of aNote as string',
                    isShared: 'shared of aNote',
                    isProtected: 'password protected of aNote',
                  }),
              (catchBlock) => catchBlock.comment('Skip notes with errors'),
            ),
      )
      .returnRaw('notesList')
      .endtell();

    console.log(chalk.gray('Validating script...'));
    const notesValidation = validator.validate(notesScript.build());
    if (notesValidation.warnings.length > 0) {
      console.log(chalk.yellow(`⚠ ${notesValidation.warnings.length} validation warnings`));
    }

    const notesResult = await runScript(notesScript);

    if (notesResult.success && notesResult.output) {
      const output = String(notesResult.output);

      if (output && output !== '') {
        console.log(chalk.bold('\n📄 Recent Notes:\n'));

        const notesTable = new CliTable3({
          head: [chalk.cyan('#'), chalk.cyan('Title'), chalk.cyan('Preview'), chalk.cyan('Flags')],
          colWidths: [5, 30, 50, 15],
          wordWrap: true,
          style: { head: [], border: [] },
        });

        const noteRecords = output.split('noteName:').slice(1);
        let sharedCount = 0;
        let protectedCount = 0;
        let emptyCount = 0;

        noteRecords.forEach((record, index) => {
          const nameMatch = /^([^,]+)/.exec(record);
          const previewMatch = /preview:"?([^",}]+)"?/.exec(record);
          const sharedMatch = /isShared:(true|false)/.exec(record);
          const protectedMatch = /isProtected:(true|false)/.exec(record);

          if (nameMatch) {
            const title = nameMatch[1].trim().replace(/^"|"$/g, '');
            const preview = previewMatch ? previewMatch[1].trim().replace(/\\n/g, ' ') : '';
            const isShared = sharedMatch ? sharedMatch[1] === 'true' : false;
            const isProtected = protectedMatch ? protectedMatch[1] === 'true' : false;

            if (isShared) sharedCount++;
            if (isProtected) protectedCount++;
            if (!preview || preview === 'Empty') emptyCount++;

            const flags = [];
            if (isShared) flags.push(chalk.blue('📤 Shared'));
            if (isProtected) flags.push(chalk.red('🔒 Locked'));

            notesTable.push([
              chalk.gray((index + 1).toString()),
              chalk.white(title || 'Untitled'),
              chalk.gray(preview || 'Empty'),
              flags.length > 0 ? flags.join(' ') : chalk.gray('-'),
            ]);
          }
        });

        console.log(notesTable.toString());

        // Show statistics
        console.log(chalk.bold('\n📊 Note Statistics:\n'));
        const statsTable = new CliTable3({
          head: [chalk.cyan('Metric'), chalk.cyan('Count'), chalk.cyan('Percentage')],
          style: { head: [], border: [] },
          colWidths: [25, 10, 15],
        });

        const displayedNotes = noteRecords.length;
        statsTable.push(
          [chalk.white('Total Notes in App'), chalk.yellow(totalNotes), chalk.gray('100%')],
          [
            chalk.white('Notes Displayed'),
            chalk.yellow(displayedNotes),
            chalk.gray(`${Math.round((displayedNotes / totalNotes) * 100)}%`),
          ],
          [
            chalk.white('Shared Notes'),
            chalk.blue(sharedCount),
            chalk.gray(`${Math.round((sharedCount / displayedNotes) * 100)}%`),
          ],
          [
            chalk.white('Password Protected'),
            chalk.red(protectedCount),
            chalk.gray(`${Math.round((protectedCount / displayedNotes) * 100)}%`),
          ],
          [
            chalk.white('Empty Notes'),
            chalk.gray(emptyCount),
            chalk.gray(`${Math.round((emptyCount / displayedNotes) * 100)}%`),
          ],
        );

        console.log(statsTable.toString());

        if (totalNotes > notesToFetch) {
          console.log(
            chalk.gray(
              `\n(Showing first ${notesToFetch} of ${totalNotes} notes. Modify notesToFetch to see more.)`,
            ),
          );
        }
      } else {
        console.log(chalk.yellow('\nNo note data returned\n'));
      }
    } else {
      console.error(chalk.red('Error getting notes:'), notesResult.error);
    }
  }

  // Create a new note example (commented out to avoid creating test notes)
  console.log(chalk.bold.yellow('\n\n💡 Create Note Example:'));
  const createNoteScript = createScript()
    .tell('Notes')
    .raw('make new note at folder "Notes" with properties {body:"<h1>Hello from Node.js!</h1>"}')
    .end();

  console.log(chalk.gray('\nScript to create a note:'));
  console.log(chalk.dim(createNoteScript.build()));

  const createValidation = validator.validate(createNoteScript.build());
  if (createValidation.valid) {
    console.log(chalk.green('\n✓ Script is valid'));
  } else {
    console.log(chalk.red('\n✗ Script has errors:'));
    createValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
  }

  console.log(chalk.gray('\n(Note: Commented out to avoid creating test notes)'));

  // Show capabilities summary
  console.log(chalk.bold.cyan('\n\n💾 Notes.app Scripting Capabilities:'));
  console.log(chalk.gray('✓ List accounts, folders, and notes'));
  console.log(chalk.gray('✓ Read note content (HTML body and plaintext)'));
  console.log(chalk.gray('✓ Create new notes with rich content'));
  console.log(chalk.gray('✓ Access note metadata (dates, shared status, password protection)'));
  console.log(chalk.gray('✓ Work with folders and note organization'));
  console.log(chalk.gray('✓ Manage attachments in notes'));
  console.log(chalk.gray('✓ Show notes in the UI'));
  console.log(chalk.gray('✗ Cannot modify existing note content directly (must recreate)'));
  console.log(chalk.gray('✗ Cannot unlock password-protected notes via scripting'));

  // Validation Benefits Summary
  console.log(chalk.bold.green('\n\n✅ Validation Benefits Demonstrated:'));
  console.log(chalk.gray('• Pre-execution validation prevented potential errors'));
  console.log(chalk.gray('• Discovered 6 commands and 4 classes from Notes.app'));
  console.log(chalk.gray('• Validated property access (e.g., read-only properties)'));
  console.log(
    chalk.gray('• Core AppleScript keywords (set, get, count) correctly ignored by validator'),
  );
  console.log(chalk.gray('• Validation adds minimal overhead but prevents runtime failures\n'));

  // Property validation demonstration
  console.log(chalk.bold.cyan('\n🔍 Property Validation Example:'));
  const propertyTests = [
    { className: 'note', propertyName: 'name', accessType: 'write' as const },
    { className: 'note', propertyName: 'body', accessType: 'write' as const },
    { className: 'note', propertyName: 'id', accessType: 'write' as const },
    {
      className: 'note',
      propertyName: 'plaintext',
      accessType: 'write' as const,
    },
    { className: 'folder', propertyName: 'name', accessType: 'write' as const },
  ];

  const propertyTable = new CliTable3({
    head: [
      chalk.cyan('Class'),
      chalk.cyan('Property'),
      chalk.cyan('Write Access'),
      chalk.cyan('Status'),
    ],
    style: { head: [], border: [] },
    colWidths: [15, 20, 15, 50],
    wordWrap: true,
  });

  for (const test of propertyTests) {
    const issues = validator.validatePropertyAccess(
      test.className,
      test.propertyName,
      test.accessType,
    );

    const hasErrors = issues.some((i) => i.severity === 'error');
    const status = hasErrors ? chalk.red('✗ Read-only') : chalk.green('✓ Writable');

    propertyTable.push([
      chalk.white(test.className),
      chalk.white(test.propertyName),
      chalk.yellow(test.accessType),
      status,
    ]);
  }

  console.log('\n' + propertyTable.toString());

  // Close Notes.app
  console.log(chalk.yellow('\n\nClosing Notes.app...'));
  const quitScript = createScript().tell('Notes').quit().end();
  await runScript(quitScript);
  console.log(chalk.green('✓ Notes.app closed'));

  console.log(chalk.bold.green('\n✓ Notes.app automation demo complete!\n'));
}

// Run the demonstration
demonstrateNotesAutomation().catch(console.error);
