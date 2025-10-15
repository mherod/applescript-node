import { writeFileSync } from 'node:fs';
import { createScript, runScript } from '../src/index.js';

interface Note {
  id: string;
  name: string;
  content: string;
  created: string;
  modified: string;
  shared: boolean;
  passwordProtected: boolean;
}

async function getLatestNotesAsJson(): Promise<Note[]> {
  // Fetch latest 10 notes with full content
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
              // Use pickEndRecord for intuitive property picking
              // Simple properties get "of aNote" automatically, complex expressions used as-is
              .pickEndRecord('notesList', 'aNote', {
                noteId: 'id',
                noteName: 'name',
                noteContent: 'plaintext',
                noteCreated: 'creation date of aNote as string', // Full expression (has 'as')
                noteModified: 'modification date of aNote as string',
                noteShared: 'shared',
                noteProtected: 'password protected',
              }),
          (catchBlock) => catchBlock.comment('Skip notes with errors'),
        ),
    )
    .returnAsJson('notesList', {
      id: 'noteId',
      name: 'noteName',
      content: 'noteContent',
      created: 'noteCreated',
      modified: 'noteModified',
      shared: 'noteShared',
      passwordProtected: 'noteProtected',
    })
    .endtell();

  // Write generated script to output directory
  writeFileSync('examples/output/notes-latest-json.applescript', notesScript.build());

  const result = await runScript(notesScript);

  if (!(result.success && result.output)) {
    throw new Error(`Failed to fetch notes: ${result.error}`);
  }

  // Parse JSON output directly (AppleScript generates JSON via returnAsJson())
  return JSON.parse(String(result.output)) as Note[];
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
