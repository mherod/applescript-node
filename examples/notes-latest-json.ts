import { createScript, runScript } from '../src/index.js';

interface Note {
  id: string;
  name: string;
  preview: string;
  created: string;
  modified: string;
  shared: boolean;
  passwordProtected: boolean;
}

async function getLatestNotesAsJson(): Promise<Note[]> {
  // Fetch latest 10 notes
  const notesScript = createScript()
    .tell('Notes')
    .set('notesList', [])
    .set('counter', 0)
    // Use forEachUntil to stop after 10 notes
    .forEachUntil(
      'aNote',
      'every note',
      (e) => e.gte('counter', 10),
      (b) =>
        b.increment('counter').tryCatch(
          (tryBlock) =>
            tryBlock
              // Get plaintext and create preview
              .setExpression('notePlaintext', 'plaintext of aNote')
              .ifThenElse(
                (e) => e.gt(e.length('notePlaintext'), 100),
                (then_) =>
                  then_.setExpression('notePreview', 'text 1 thru 100 of notePlaintext & "..."'),
                (else_) => else_.setExpression('notePreview', 'notePlaintext'),
              )
              // Build record with full expressions
              .setEndRecord('notesList', {
                noteId: 'id of aNote',
                noteName: 'name of aNote',
                notePreview: 'notePreview',
                noteCreated: 'creation date of aNote as string',
                noteModified: 'modification date of aNote as string',
                noteShared: 'shared of aNote',
                noteProtected: 'password protected of aNote',
              }),
          (catchBlock) => catchBlock.comment('Skip notes with errors'),
        ),
    )
    .returnRaw('notesList')
    .endtell();

  const result = await runScript(notesScript);

  if (!(result.success && result.output)) {
    throw new Error(`Failed to fetch notes: ${result.error}`);
  }

  // Parse AppleScript record format to JSON
  const output = String(result.output);
  const notes: Note[] = [];

  // Split by record boundaries
  const noteRecords = output.split('noteId:').slice(1);

  for (const record of noteRecords) {
    // Extract fields using regex
    const idMatch = /^([^,]+)/.exec(record);
    const nameMatch = /noteName:([^,]+)/.exec(record);
    const previewMatch = /notePreview:"?([^",}]+)"?/.exec(record);
    const createdMatch = /noteCreated:"?([^",}]+)"?/.exec(record);
    const modifiedMatch = /noteModified:"?([^",}]+)"?/.exec(record);
    const sharedMatch = /noteShared:(true|false)/.exec(record);
    const protectedMatch = /noteProtected:(true|false)/.exec(record);

    if (idMatch && nameMatch) {
      notes.push({
        id: idMatch[1].trim(),
        name: nameMatch[1].trim().replace(/^"|"$/g, ''),
        preview: previewMatch
          ? previewMatch[1].trim().replace(/\\n/g, ' ').replace(/^"|"$/g, '')
          : '',
        created: createdMatch ? createdMatch[1].trim().replace(/^"|"$/g, '') : '',
        modified: modifiedMatch ? modifiedMatch[1].trim().replace(/^"|"$/g, '') : '',
        shared: sharedMatch ? sharedMatch[1] === 'true' : false,
        passwordProtected: protectedMatch ? protectedMatch[1] === 'true' : false,
      });
    }
  }

  return notes;
}

// Main execution
async function main() {
  try {
    const notes = await getLatestNotesAsJson();
    console.log(JSON.stringify(notes, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
