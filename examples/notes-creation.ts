import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import { createScript, runScript, ScriptValidator } from '../src/index.js';

async function demonstrateNoteCreation() {
  console.log(chalk.bold.blue('📝 Notes.app - Note Creation Demo\n'));
  console.log(chalk.gray('Demonstrates creating notes with various content types.\n'));

  // Create validator for Notes.app
  console.log(chalk.yellow('🔍 Loading Notes.app scripting dictionary...'));
  const validator = await ScriptValidator.forApplication('/System/Applications/Notes.app');
  console.log(chalk.green('✓ Validator ready\n'));

  // Activate Notes.app
  console.log(chalk.yellow('Opening Notes.app...'));
  await runScript(createScript().tell('Notes').activate().delay(1).end());
  console.log(chalk.green('✓ Notes.app opened\n'));

  // Get default account and folder
  console.log(chalk.yellow('🔍 Finding default account and folder...'));
  const defaultInfoScript = createScript()
    .tell('Notes')
    .setExpression('defaultAcc', 'default account')
    .setExpression('defaultFol', 'default folder of defaultAcc')
    .setExpression('accName', 'name of defaultAcc')
    .setExpression('folName', 'name of defaultFol')
    .returnRaw('{accountName:accName, folderName:folName}')
    .end();

  const defaultInfoResult = await runScript(defaultInfoScript);
  const defaultInfo = String(defaultInfoResult.output);
  const accMatch = /accountName:([^,}]+)/.exec(defaultInfo);
  const folMatch = /folderName:([^,}]+)/.exec(defaultInfo);

  const accountName = accMatch ? accMatch[1].trim() : 'iCloud';
  const folderName = folMatch ? folMatch[1].trim() : 'Notes';

  console.log(chalk.green(`✓ Using account: ${chalk.white(accountName)}`));
  console.log(chalk.green(`✓ Using folder: ${chalk.white(folderName)}\n`));

  // Array to track created note IDs for cleanup
  const createdNoteIds: string[] = [];

  // Example 1: Simple plain text note
  console.log(chalk.bold.cyan('📄 Example 1: Simple Plain Text Note\n'));

  const timestamp = new Date().toLocaleString();
  const plainTextContent = `Hello from applescript-node!

This note was created programmatically at ${timestamp}.

Features demonstrated:
• Simple text content
• Multi-line support
• Unicode characters: ✓ ✗ ★ ♥
• Emoji support: 🎉 🚀 💻 📝`;

  const plainTextScript = createScript()
    .tell('Notes')
    .raw(
      `tell account "${accountName}"
  tell folder "${folderName}"
    make new note with properties {body:"${plainTextContent.replace(/\n/g, '\\n')}"}
  end tell
end tell`,
    )
    .delay(0.5)
    .setExpression('latestNote', `note 1 of folder "${folderName}" of account "${accountName}"`)
    .returnJsonObject({
      noteId: 'id of latestNote',
      noteName: 'name of latestNote',
    })
    .end();

  console.log(chalk.gray('Creating plain text note...'));
  const plainTextValidation = validator.validate(plainTextScript.build());
  if (plainTextValidation.valid) {
    const plainTextResult = await runScript(plainTextScript);
    if (plainTextResult.success && plainTextResult.output) {
      const result = plainTextResult.output as { noteId: string; noteName: string };
      createdNoteIds.push(result.noteId);
      console.log(chalk.green(`✓ Plain text note created successfully: "${result.noteName}"\n`));
    } else {
      console.log(chalk.red(`✗ Failed: ${plainTextResult.error}\n`));
    }
  } else {
    console.log(chalk.red('✗ Validation failed:'));
    plainTextValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
  }

  // Example 2: HTML formatted note
  console.log(chalk.bold.cyan('📄 Example 2: HTML Formatted Note\n'));

  const htmlContent = `<h1>📊 Project Status Report</h1>

<h2>Overview</h2>
<p>This note demonstrates <strong>HTML formatting</strong> capabilities in Notes.app.</p>

<h2>Features</h2>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li><u>Underlined text</u></li>
  <li><span style="color: red;">Colored text</span></li>
</ul>

<h2>Code Example</h2>
<pre><code>const script = createScript()
  .tell('Notes')
    .activate()
  .end();</code></pre>

<h2>Links</h2>
<p>Visit <a href="https://github.com">GitHub</a> for more information.</p>

<hr>
<p><small>Generated at ${timestamp}</small></p>`;

  const htmlScript = createScript()
    .tell('Notes')
    .raw(
      `tell account "${accountName}"
  tell folder "${folderName}"
    make new note with properties {body:"${htmlContent.replace(/"/g, '\\"')}"}
  end tell
end tell`,
    )
    .delay(0.5)
    .setExpression('latestNote', `note 1 of folder "${folderName}" of account "${accountName}"`)
    .returnJsonObject({
      noteId: 'id of latestNote',
      noteName: 'name of latestNote',
    })
    .end();

  console.log(chalk.gray('Creating HTML formatted note...'));
  const htmlResult = await runScript(htmlScript);
  if (htmlResult.success && htmlResult.output) {
    const result = htmlResult.output as { noteId: string; noteName: string };
    createdNoteIds.push(result.noteId);
    console.log(chalk.green(`✓ HTML formatted note created successfully: "${result.noteName}"\n`));
  } else {
    console.log(chalk.red(`✗ Failed: ${htmlResult.error}\n`));
  }

  // Example 3: Checklist note
  console.log(chalk.bold.cyan('📄 Example 3: Checklist Note\n'));

  const checklistContent = `<h2>✅ Development Checklist</h2>

<ul>
  <li>☐ Set up development environment</li>
  <li>☐ Install dependencies</li>
  <li>☐ Write tests</li>
  <li>☐ Implement features</li>
  <li>☐ Code review</li>
  <li>☐ Deploy to production</li>
</ul>

<h2>📋 Testing Checklist</h2>

<ul>
  <li>☑ Unit tests</li>
  <li>☑ Integration tests</li>
  <li>☐ End-to-end tests</li>
  <li>☐ Performance tests</li>
</ul>

<p><em>Created: ${timestamp}</em></p>`;

  const checklistScript = createScript()
    .tell('Notes')
    .raw(
      `tell account "${accountName}"
  tell folder "${folderName}"
    make new note with properties {body:"${checklistContent.replace(/"/g, '\\"')}"}
  end tell
end tell`,
    )
    .delay(0.5)
    .setExpression('latestNote', `note 1 of folder "${folderName}" of account "${accountName}"`)
    .returnJsonObject({
      noteId: 'id of latestNote',
      noteName: 'name of latestNote',
    })
    .end();

  console.log(chalk.gray('Creating checklist note...'));
  const checklistResult = await runScript(checklistScript);
  if (checklistResult.success && checklistResult.output) {
    const result = checklistResult.output as { noteId: string; noteName: string };
    createdNoteIds.push(result.noteId);
    console.log(chalk.green(`✓ Checklist note created successfully: "${result.noteName}"\n`));
  } else {
    console.log(chalk.red(`✗ Failed: ${checklistResult.error}\n`));
  }

  // Example 4: Table note
  console.log(chalk.bold.cyan('📄 Example 4: Table Note\n'));

  const tableContent = `<h2>📊 Project Metrics</h2>

<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Value</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Code Coverage</td>
      <td>85%</td>
      <td>✓ Good</td>
    </tr>
    <tr>
      <td>Build Time</td>
      <td>2.5 min</td>
      <td>✓ Good</td>
    </tr>
    <tr>
      <td>Test Pass Rate</td>
      <td>98%</td>
      <td>✓ Excellent</td>
    </tr>
    <tr>
      <td>Bundle Size</td>
      <td>245 KB</td>
      <td>⚠ Warning</td>
    </tr>
  </tbody>
</table>

<p><em>Last updated: ${timestamp}</em></p>`;

  const tableScript = createScript()
    .tell('Notes')
    .raw(
      `tell account "${accountName}"
  tell folder "${folderName}"
    make new note with properties {body:"${tableContent.replace(/"/g, '\\"')}"}
  end tell
end tell`,
    )
    .delay(0.5)
    .setExpression('latestNote', `note 1 of folder "${folderName}" of account "${accountName}"`)
    .returnJsonObject({
      noteId: 'id of latestNote',
      noteName: 'name of latestNote',
    })
    .end();

  console.log(chalk.gray('Creating table note...'));
  const tableResult = await runScript(tableScript);
  if (tableResult.success && tableResult.output) {
    const result = tableResult.output as { noteId: string; noteName: string };
    createdNoteIds.push(result.noteId);
    console.log(chalk.green(`✓ Table note created successfully: "${result.noteName}"\n`));
  } else {
    console.log(chalk.red(`✗ Failed: ${tableResult.error}\n`));
  }

  // Example 5: Code snippet note
  console.log(chalk.bold.cyan('📄 Example 5: Code Snippet Note\n'));

  const codeContent = `<h2>💻 Code Snippets</h2>

<h3>TypeScript Function</h3>
<pre><code>async function createNote(title: string, body: string) {
  const script = createScript()
    .tell('Notes')
      .activate()
    .end();

  await runScript(script);
}</code></pre>

<h3>AppleScript Example</h3>
<pre><code>tell application "Notes"
  tell account "iCloud"
    tell folder "Notes"
      make new note with properties {body:"Hello World"}
    end tell
  end tell
end tell</code></pre>

<h3>Shell Command</h3>
<pre><code># Activate Notes.app
osascript -e 'tell app "Notes" to activate'

# Count notes
osascript -e 'tell app "Notes" to count notes'</code></pre>

<p><em>Created: ${timestamp}</em></p>`;

  const codeScript = createScript()
    .tell('Notes')
    .raw(
      `tell account "${accountName}"
  tell folder "${folderName}"
    make new note with properties {body:"${codeContent.replace(/"/g, '\\"')}"}
  end tell
end tell`,
    )
    .delay(0.5)
    .setExpression('latestNote', `note 1 of folder "${folderName}" of account "${accountName}"`)
    .returnJsonObject({
      noteId: 'id of latestNote',
      noteName: 'name of latestNote',
    })
    .end();

  console.log(chalk.gray('Creating code snippet note...'));
  const codeResult = await runScript(codeScript);
  if (codeResult.success && codeResult.output) {
    const result = codeResult.output as { noteId: string; noteName: string };
    createdNoteIds.push(result.noteId);
    console.log(chalk.green(`✓ Code snippet note created successfully: "${result.noteName}"\n`));
  } else {
    console.log(chalk.red(`✗ Failed: ${codeResult.error}\n`));
  }

  // Verify created notes using modern mapToJson approach
  console.log(chalk.bold.cyan('\n🔍 Verifying Created Notes\n'));

  const verifyScript = createScript()
    .tell('Notes')
    .mapToJson(
      'aNote',
      `every note of folder "${folderName}" of account "${accountName}"`,
      {
        title: 'name',
        noteId: 'id',
        content: 'plaintext',
        created: {
          property: 'creation date',
          ifExists: true,
          asType: 'string',
        },
        modified: {
          property: 'modification date',
          ifExists: true,
          asType: 'string',
        },
        shared: {
          property: 'shared',
          ifExists: true,
          default: 'false',
        },
        passwordProtected: {
          property: 'password protected',
          ifExists: true,
          default: 'false',
        },
      },
      { limit: 10, skipErrors: true },
    )
    .endtell();

  const verifyResult = await runScript(verifyScript);

  if (verifyResult.success && verifyResult.output) {
    // The output is automatically parsed from JSON by runScript
    const notes = verifyResult.output as unknown as Array<{
      title: string;
      noteId: string;
      content: string;
      created: string;
      modified: string;
      shared: string;
      passwordProtected: string;
    }>;

    if (notes && notes.length > 0) {
      console.log(chalk.bold('\n📋 Created Notes:\n'));

      const notesTable = new CliTable3({
        head: [
          chalk.cyan('#'),
          chalk.cyan('Title'),
          chalk.cyan('Content Preview'),
          chalk.cyan('Created'),
        ],
        colWidths: [5, 25, 50, 20],
        wordWrap: true,
        style: { head: [], border: [] },
      });

      notes.forEach((note, index) => {
        const title = note.title || 'Untitled';
        const content = note.content || '';
        const preview = content.length > 80 ? content.substring(0, 77) + '...' : content;
        const created =
          note.created !== 'missing value'
            ? new Date(note.created).toLocaleDateString()
            : 'Unknown';

        notesTable.push([
          chalk.yellow((index + 1).toString()),
          chalk.white(title),
          chalk.gray(preview),
          chalk.blue(created),
        ]);
      });

      console.log(notesTable.toString());

      // Show additional statistics
      const statsTable = new CliTable3({
        head: [chalk.cyan('Metric'), chalk.cyan('Count'), chalk.cyan('Percentage')],
        style: { head: [], border: [] },
        colWidths: [25, 10, 15],
      });

      const totalNotes = notes.length;
      const sharedNotes = notes.filter((n) => n.shared === 'true').length;
      const protectedNotes = notes.filter((n) => n.passwordProtected === 'true').length;
      const notesWithContent = notes.filter((n) => n.content && n.content.trim().length > 0).length;

      statsTable.push(
        [chalk.white('Total Notes'), chalk.yellow(totalNotes), chalk.gray('100%')],
        [
          chalk.white('Shared Notes'),
          chalk.blue(sharedNotes),
          chalk.gray(`${Math.round((sharedNotes / totalNotes) * 100)}%`),
        ],
        [
          chalk.white('Password Protected'),
          chalk.red(protectedNotes),
          chalk.gray(`${Math.round((protectedNotes / totalNotes) * 100)}%`),
        ],
        [
          chalk.white('With Content'),
          chalk.green(notesWithContent),
          chalk.gray(`${Math.round((notesWithContent / totalNotes) * 100)}%`),
        ],
      );

      console.log(chalk.bold('\n📊 Note Statistics:\n'));
      console.log(statsTable.toString());
      console.log(chalk.green(`\n✓ Successfully verified ${totalNotes} notes\n`));
    } else {
      console.log(chalk.yellow('\nNo notes found in the folder\n'));
    }
  }

  // Summary
  console.log(chalk.bold.cyan('\n📊 Creation Summary\n'));

  const summaryTable = new CliTable3({
    head: [chalk.cyan('Example'), chalk.cyan('Type'), chalk.cyan('Status')],
    style: { head: [], border: [] },
    colWidths: [10, 25, 15],
  });

  summaryTable.push(
    ['1', chalk.white('Plain Text'), chalk.green('✓ Created')],
    ['2', chalk.white('HTML Formatted'), chalk.green('✓ Created')],
    ['3', chalk.white('Checklist'), chalk.green('✓ Created')],
    ['4', chalk.white('Table'), chalk.green('✓ Created')],
    ['5', chalk.white('Code Snippets'), chalk.green('✓ Created')],
  );

  console.log(summaryTable.toString());

  // Cleanup option
  console.log(chalk.bold.yellow('\n\n🗑️  Cleanup Option\n'));
  console.log(
    chalk.gray('To delete the created test notes, you can use the following AppleScript:\n'),
  );

  const cleanupScript = `tell application "Notes"
  tell account "${accountName}"
    tell folder "${folderName}"
      repeat with i from 1 to ${createdNoteIds.length}
        try
          delete note 1
        end try
      end repeat
    end tell
  end tell
end tell`;

  console.log(chalk.dim(cleanupScript));
  console.log(chalk.gray('\n(Run this manually if you want to clean up the test notes)'));

  // Key learnings
  console.log(chalk.bold.green('\n\n✅ Key Learnings:\n'));
  console.log(chalk.gray('• Notes.app supports rich HTML content'));
  console.log(chalk.gray('• Can create notes with tables, lists, and formatted text'));
  console.log(chalk.gray('• Code snippets can be embedded using <pre><code> tags'));
  console.log(chalk.gray('• Notes are created in the default folder by default'));
  console.log(chalk.gray('• Note titles are auto-generated from the first line'));
  console.log(chalk.gray('• Validation ensures scripts are correct before execution'));
  console.log(chalk.gray('• New notes appear at the top of the folder (note 1)'));
  console.log(
    chalk.gray('• mapToJson() provides clean JSON output with PropertyExtractor support'),
  );
  console.log(chalk.gray('• returnJsonObject() simplifies structured data return'));
  console.log(
    chalk.gray('• PropertyExtractor handles optional fields with ifExists and type conversion\n'),
  );

  // Close Notes.app
  console.log(chalk.yellow('Closing Notes.app...'));
  const quitScript = createScript().tell('Notes').quit().end();
  await runScript(quitScript);
  console.log(chalk.green('✓ Notes.app closed\n'));

  console.log(chalk.bold.blue('✓ Note creation demo complete!\n'));
}

// Run the demonstration
demonstrateNoteCreation().catch(console.error);
