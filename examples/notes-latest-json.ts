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
  // Ultra-concise! mapToJson handles iteration, property extraction, error handling, and JSON conversion
  const notesScript = createScript()
    .tell('Notes')
    .mapToJson(
      'aNote',
      'every note',
      {
        id: 'id',
        name: 'name',
        content: 'plaintext',
        created: 'creation date of aNote as string',
        modified: 'modification date of aNote as string',
        shared: 'shared',
        passwordProtected: 'password protected',
      },
      { limit: 10, skipErrors: true },
    )
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
