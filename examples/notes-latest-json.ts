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
  // ALWAYS KEEP THE TYPE IN THE PROMISE<TYPE>
  // Ultra-concise! mapToJson handles iteration, property extraction, error handling, and JSON conversion
  const notesScript = createScript()
    .tell('Notes')
    .mapToJson(
      'aNote',
      'every note',
      {
        // Simple properties
        id: 'id',
        name: 'name',
        content: 'plaintext',
        // PropertyExtractor: Optional fields with type conversion
        created: {
          property: (e) => e.property('aNote', 'creation date'),
          ifExists: true,
          asType: 'string',
        },
        modified: {
          property: (e) => e.property('aNote', 'modification date'),
          ifExists: true,
          asType: 'string',
        },
        shared: {
          property: 'shared',
          asType: 'boolean' as const,
        },
        passwordProtected: {
          property: (e) => e.property('aNote', 'password protected'),
          ifExists: true,
          asType: 'boolean' as const,
        },
      },
      { limit: 10, skipErrors: true },
    )
    .endtell();

  const builtScript = notesScript.build();

  // Write generated script to output directory
  writeFileSync('examples/output/notes-latest-json.applescript', builtScript);

  const result = await runScript(notesScript);

  if (!(result.success && result.output)) {
    throw new Error(`Failed to fetch notes: ${result.error}`);
  }

  // The output is automatically parsed from JSON by runScript
  return result.output; // DO NOT CAST BECAUSE IT SHOULD BE ALREADY THE CORRECT TYPE
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
