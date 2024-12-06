import { runScript } from 'applescript-node';

async function main() {
  // Simple script execution
  const result = await runScript('tell application "Finder" to get name of every disk');

  if (result.success) {
    console.log('Mounted disks:', result.output);
  } else {
    console.error('Error:', result.error);
  }

  // With type safety
  interface FileInfo {
    name: string;
    size: number;
  }

  const filesResult = await runScript<string>(
    'tell application "Finder" to get (name of every file of desktop) & ", " & (size of every file of desktop) as string',
  );

  if (filesResult.success) {
    console.log('\nDesktop files:');
    const files: FileInfo[] = [];
    const [names, sizes] = filesResult.output.split(', ').reduce<[string[], number[]]>(
      ([names, sizes]: [string[], number[]], value: string, index: number) => {
        if (index % 2 === 0) {
          names.push(value);
        } else {
          sizes.push(Number(value));
        }
        return [names, sizes];
      },
      [[], []],
    );

    // Create FileInfo objects
    for (let i = 0; i < names.length; i++) {
      files.push({
        name: names[i],
        size: sizes[i],
      });
    }

    // Use the typed FileInfo objects for output
    for (const file of files) {
      console.log(`${file.name}: ${file.size} bytes`);
    }
  }
}

main().catch(console.error);
