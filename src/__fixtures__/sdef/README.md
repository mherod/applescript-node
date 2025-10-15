# sdef Test Fixtures

This directory contains real sdef (scripting definition) XML files extracted from macOS system applications. These fixtures are used for testing the sdef parsing functionality with real-world data.

## Fixture Files

| Application   | File                | Size   | Description                                      |
| ------------- | ------------------- | ------ | ------------------------------------------------ |
| Calendar      | `Calendar.sdef`     | 14 KB  | Calendar app scripting dictionary                |
| Finder        | `Finder.sdef`       | 43 KB  | Finder scripting dictionary                      |
| Mail          | `Mail.sdef`         | 57 KB  | Mail app scripting dictionary                    |
| Messages      | `Messages.sdef`     | 8.9 KB | Messages app scripting dictionary                |
| Music         | `Music.sdef`        | 46 KB  | Music app (formerly iTunes) scripting dictionary |
| Notes         | `Notes.sdef`        | 8.6 KB | Notes app scripting dictionary                   |
| Reminders     | `Reminders.sdef`    | 7.8 KB | Reminders app scripting dictionary               |
| System Events | `SystemEvents.sdef` | 112 KB | System Events scripting dictionary (largest)     |
| TextEdit      | `TextEdit.sdef`     | 13 KB  | TextEdit scripting dictionary                    |

## Extraction

These fixtures were extracted using the `sdef` command:

```bash
sdef /System/Applications/Messages.app > Messages.sdef
sdef /System/Library/CoreServices/Finder.app > Finder.sdef
# ... etc
```

## Usage in Tests

These fixtures can be used in integration tests to verify that the sdef parser correctly handles real-world application dictionaries:

```typescript
import { readFileSync } from 'node:fs';
import { parseSdef } from '../sdef.js';

const messagesXml = readFileSync('src/__fixtures__/sdef/Messages.sdef', 'utf-8');
const dictionary = parseSdef(messagesXml);

// Test parsing results
expect(dictionary.suites.length).toBeGreaterThan(0);
```

## Maintenance

These fixtures represent the sdef output from macOS 15 (Sequoia). As macOS evolves, application scripting dictionaries may change. Fixtures should be updated periodically to reflect current macOS versions.

To regenerate all fixtures:

```bash
sdef /System/Applications/Messages.app > src/__fixtures__/sdef/Messages.sdef
sdef /System/Applications/Mail.app > src/__fixtures__/sdef/Mail.sdef
sdef /System/Applications/Music.app > src/__fixtures__/sdef/Music.sdef
sdef /System/Applications/Notes.app > src/__fixtures__/sdef/Notes.sdef
sdef /System/Applications/Calendar.app > src/__fixtures__/sdef/Calendar.sdef
sdef /System/Applications/Reminders.app > src/__fixtures__/sdef/Reminders.sdef
sdef /System/Applications/TextEdit.app > src/__fixtures__/sdef/TextEdit.sdef
sdef /System/Library/CoreServices/Finder.app > src/__fixtures__/sdef/Finder.sdef
sdef /System/Library/CoreServices/System\ Events.app > src/__fixtures__/sdef/SystemEvents.sdef
```

## License

These sdef files are extracted from macOS system applications and are property of Apple Inc. They are included here solely for testing purposes under fair use.
