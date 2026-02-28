# applescript-node

[![Test](https://github.com/mherod/applescript-node/actions/workflows/test.yml/badge.svg)](https://github.com/mherod/applescript-node/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/applescript-node.svg)](https://badge.fury.io/js/applescript-node)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://mherod.github.io/applescript-node/)

**Type-safe macOS automation from Node.js.** Control apps, manage windows, and automate workflows with a fluent API.

📖 **[Read the full documentation →](https://mherod.github.io/applescript-node/)**

```typescript
import { sources } from 'applescript-node';

// Get all open windows across apps
const windows = await sources.windows.getAll();
console.log(`Found ${windows.length} open windows`);

// Get the frontmost app
const frontmost = await sources.applications.getFrontmost();
console.log(`Active: ${frontmost.name}`);
```

## Install

```bash
npm install applescript-node
```

> **Requirements:** macOS 10.10+, Node.js 20+

## Quick Examples

### Get System Info

```typescript
import { sources } from 'applescript-node';

const info = await sources.system.getInfo();
console.log(`${info.computerName} running macOS ${info.osVersion}`);
```

### List Running Apps

```typescript
import { sources } from 'applescript-node';

const apps = await sources.applications.getAll();
apps.forEach((app) => {
  console.log(`${app.name} - ${app.windowCount} windows (PID: ${app.pid})`);
});
```

### Control Applications

```typescript
import { sources } from 'applescript-node';

// Activate an app (bring to front)
await sources.applications.activate('Finder');

// Check if running
const isRunning = await sources.applications.isRunning('Safari');

// Quit an app
await sources.applications.quit('TextEdit');
```

### Window Management

```typescript
import { sources } from 'applescript-node';

// Get windows for a specific app
const safariWindows = await sources.windows.getByApp('Safari');

// Get the frontmost window
const active = await sources.windows.getFrontmost();
console.log(`Active: ${active?.name} (${active?.app})`);

// Get window counts per app
const counts = await sources.windows.getCountByApp();
// { "Finder": 3, "Safari": 2, ... }
```

---

## Builder API

For custom automation scripts, use the fluent builder:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tellApp('Finder', (finder) => finder.get('name of every disk'));

const result = await runScript(script);
if (result.success) {
  console.log('Disks:', result.output);
}
```

### Keyboard Automation

```typescript
const script = createScript().tellApp(
  'System Events',
  (app) =>
    app
      .keystroke('n', ['command']) // Cmd+N
      .delay(0.5)
      .keystroke('Hello World!')
      .keystroke('s', ['command']), // Cmd+S
);

await runScript(script);
```

### Conditional Logic

```typescript
const script = createScript()
  .set('temp', 75)
  .ifThenElse(
    (e) => e.gt('temp', 80),
    (then_) => then_.displayDialog('Hot!'),
    (else_) => else_.displayDialog('Nice weather'),
  );
```

### Error Handling

```typescript
const script = createScript().tryCatch(
  (try_) => try_.tellApp('Notes', (notes) => notes.raw('get name of first note')),
  (catch_) => catch_.displayDialog('Could not access Notes'),
);
```

### Loops

```typescript
const script = createScript()
  .set('results', [])
  .forEach('item', '{1, 2, 3, 4, 5}', (loop) => loop.setEndRaw('results', 'item * 2'));
```

---

## Data Extraction

### Extract to JSON

The `mapToJson()` method makes data extraction simple:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .tell('Notes')
  .mapToJson(
    'aNote',
    'every note',
    {
      id: 'id',
      name: 'name',
      content: 'plaintext',
      created: 'creation date of aNote as string',
    },
    { limit: 10, skipErrors: true },
  )
  .endtell();

const result = await runScript(script);
const notes = JSON.parse(result.output);
```

### Handle Optional Fields

Use `PropertyExtractor` for fields that might not exist:

```typescript
const script = createScript()
  .tell('Contacts')
  .mapToJson(
    'person',
    'every person',
    {
      // Simple properties
      id: 'id',
      name: 'name',

      // Get first email (multi-value field)
      email: {
        property: (e) => e.property('person', 'emails'),
        firstOf: true,
      },

      // Optional field with type conversion
      birthday: {
        property: 'birth date',
        ifExists: true,
        asType: 'string',
      },
    },
    { limit: 50, skipErrors: true },
  )
  .endtell();
```

---

## Type Safety

### Typed Results

```typescript
interface DiskInfo {
  name: string;
  capacity: number;
}

const result = await runScript<DiskInfo[]>(
  'tell application "Finder" to get {name, capacity} of every disk',
);

if (result.success) {
  result.output.forEach((disk) => {
    console.log(`${disk.name}: ${disk.capacity} bytes`);
  });
}
```

### ExprBuilder for Conditions

Type-safe condition building with autocomplete:

```typescript
import { createScript } from 'applescript-node';

const script = createScript()
  .set('count', 10)
  .ifThen(
    (e) => e.and(e.gt('count', 5), e.lt('count', 20)),
    (then_) => then_.displayDialog('In range!'),
  );
```

**Available operators:**

- Comparison: `gt`, `lt`, `gte`, `lte`, `eq`, `ne`
- Logical: `and`, `or`, `not`
- String: `contains`, `startsWith`, `endsWith`, `length`
- Objects: `exists`, `count`, `property`

---

## Script Compilation

Compile scripts to `.scpt` files or stay-open applications:

```typescript
import { compileScript } from 'applescript-node';

// Compile a stay-open app
await compileScript(
  `
  on idle
    display notification "Still running!"
    return 60
  end idle
`,
  {
    outputPath: 'MyApp.app',
    stayOpen: true,
  },
);
```

---

## App Introspection

Discover what commands an app supports:

```typescript
import { getApplicationDictionary, findCommand } from 'applescript-node';

const dict = await getApplicationDictionary('/System/Applications/Messages.app');

// Find a specific command
const sendCmd = findCommand(dict, 'send');
if (sendCmd) {
  console.log(
    'Parameters:',
    sendCmd.parameters.map((p) => p.name),
  );
}

// List all available commands
const commands = getAllCommands(dict);
console.log(`Messages.app has ${commands.length} commands`);
```

---

## Validation

Validate scripts before running:

```typescript
import { ScriptValidator, createScript } from 'applescript-node';

const validator = await ScriptValidator.forApplication('/System/Applications/Messages.app');

const script = createScript()
  .tell('Messages')
  .raw('sen "Hello"') // Typo!
  .end();

const result = validator.validate(script.build());
if (!result.valid) {
  result.errors.forEach((err) => {
    console.log(`Error: ${err.message}`);
    if (err.suggestion) {
      console.log(`  Did you mean: ${err.suggestion}?`);
    }
  });
}
```

---

## Complex Examples

### Cross-App Data Pipeline

Extract contacts, process them, and create personalized notes:

```typescript
import { createScript, runScript } from 'applescript-node';

// Extract contacts with birthday information
const extractScript = createScript()
  .tell('Contacts')
  .mapToJson(
    'person',
    'every person',
    {
      id: 'id',
      name: 'name',
      email: {
        property: (e) => e.property('person', 'emails'),
        firstOf: true,
        default: 'missing value',
      },
      birthday: {
        property: 'birth date',
        ifExists: true,
        asType: 'string',
        default: 'missing value',
      },
      phone: {
        property: 'phones',
        firstOf: true,
        default: 'missing value',
      },
    },
    { limit: 100, skipErrors: true },
  )
  .endtell();

const contactsResult = await runScript(extractScript);
const contacts = JSON.parse(contactsResult.output);

// Process contacts and create notes for upcoming birthdays
const upcomingBirthdays = contacts.filter((c) => {
  if (c.birthday === 'missing value') return false;
  const birthday = new Date(c.birthday);
  const today = new Date();
  const daysUntil = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil >= 0 && daysUntil <= 30;
});

// Create a summary note in Notes.app
const birthdayLines = upcomingBirthdays.map((c) => `${c.name}: ${c.birthday}`).join('\\n');

const noteScript = createScript()
  .tell('Notes')
  .tryCatch(
    (try_) =>
      try_
        .raw(`set noteText to "Upcoming Birthdays (Next 30 Days)\\n\\n"`)
        .raw(`set noteText to noteText & "${birthdayLines}"`)
        .raw('make new note with properties {body:noteText}'),
    (catch_) => catch_.displayDialog('Failed to create note'),
  )
  .endtell();

await runScript(noteScript);
console.log(`Created note with ${upcomingBirthdays.length} upcoming birthdays`);
```

### Automated Workflow Orchestration

Complete workflow demonstrating window management, data extraction, and error handling:

```typescript
import { createScript, runScript, sources } from 'applescript-node';

async function automatedWorkflow() {
  // 1. Check if required apps are running
  const safariRunning = await sources.applications.isRunning('Safari');
  const notesRunning = await sources.applications.isRunning('Notes');

  if (!safariRunning || !notesRunning) {
    console.log('Starting required applications...');
    await sources.applications.activate('Safari');
    await sources.applications.activate('Notes');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for launch
  }

  // 2. Organize workspace - arrange windows side by side
  const windows = await sources.windows.getAll();
  const safariWindow = windows.find((w) => w.app === 'Safari');
  const notesWindow = windows.find((w) => w.app === 'Notes');

  if (safariWindow && notesWindow) {
    // Move Safari to left half of screen
    const moveScript = createScript()
      .tell('System Events')
      .tell('application process "Safari"')
      .raw('set position of window 1 to {0, 23}')
      .raw('set size of window 1 to {960, 1177}')
      .endtell()
      .tell('application process "Notes"')
      .raw('set position of window 1 to {960, 23}')
      .raw('set size of window 1 to {960, 1177}')
      .endtell()
      .endtell();

    await runScript(moveScript);
  }

  // 3. Extract browser tabs and create organized notes
  const tabsScript = createScript()
    .tell('Safari')
    .set('tabData', [])
    .repeatWith('aWindow', 'windows')
    .repeatWith('aTab', 'tabs of aWindow')
    .tryCatch(
      (try_) =>
        try_.setEndRecord('tabData', {
          title: 'name of aTab',
          url: 'URL of aTab',
        }),
      (catch_) => catch_.comment('Skip invalid tabs'),
    )
    .endrepeat()
    .endrepeat()
    .returnAsJson('tabData', {
      title: 'title',
      url: 'url',
    })
    .endtell();

  const tabsResult = await runScript(tabsScript);
  const tabs = JSON.parse(tabsResult.output);

  // 4. Create categorized notes based on tab URLs
  const categories = {
    development: tabs.filter(
      (t) => t.url.includes('github.com') || t.url.includes('stackoverflow'),
    ),
    documentation: tabs.filter((t) => t.url.includes('docs.') || t.url.includes('developer.')),
    other: tabs.filter(
      (t) =>
        !t.url.includes('github.com') &&
        !t.url.includes('stackoverflow') &&
        !t.url.includes('docs.') &&
        !t.url.includes('developer.'),
    ),
  };

  for (const [category, categoryTabs] of Object.entries(categories)) {
    if (categoryTabs.length === 0) continue;

    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    const tabLines = categoryTabs
      .map((t) => `${t.title}\\n${t.url}`)
      .join('\\n\\n')
      .replace(/"/g, '\\"');

    const createNoteScript = createScript()
      .tell('Notes')
      .raw(`set noteTitle to "Browser Tabs - ${categoryTitle}"`)
      .raw(`set noteBody to "${tabLines}"`)
      .raw('make new note with properties {name:noteTitle, body:noteBody}')
      .endtell();

    await runScript(createNoteScript);
  }

  // 5. Show completion notification
  await runScript(
    createScript().displayNotification(
      `Organized ${tabs.length} tabs into ${Object.keys(categories).length} categories`,
    ),
  );

  console.log('Workflow completed successfully');
  return {
    tabsProcessed: tabs.length,
    categoriesCreated: Object.keys(categories).length,
    windows: { safari: safariWindow, notes: notesWindow },
  };
}

// Run the workflow
automatedWorkflow().catch(console.error);
```

---

## API Reference

### High-Level Sources

```typescript
import { sources } from 'applescript-node';

// System
sources.system.getInfo();

// Applications
sources.applications.getAll();
sources.applications.getFrontmost();
sources.applications.getByName(name);
sources.applications.isRunning(name);
sources.applications.activate(name);
sources.applications.hide(name);
sources.applications.quit(name);

// Windows
sources.windows.getAll();
sources.windows.getByApp(appName);
sources.windows.getFrontmost();
sources.windows.getCountByApp();
```

### Script Execution

```typescript
import { runScript, runScriptFile, createScript } from 'applescript-node';

// Run a string
const result = await runScript('tell app "Finder" to activate');

// Run from file
const result = await runScriptFile('./my-script.applescript');

// Run a builder
const script = createScript().tell('Finder').activate().end();
const result = await runScript(script);
```

### Builder Methods

| Category      | Methods                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Blocks**    | `tell`, `tellApp`, `tellProcess`, `end`, `if`, `then`, `else`, `elseIf`, `repeat`, `repeatWith`, `forEach`, `try`, `onError` |
| **Apps**      | `activate`, `quit`, `launch`, `running`                                                                                      |
| **Windows**   | `closeWindow`, `minimizeWindow`, `zoomWindow`, `moveWindow`, `resizeWindow`                                                  |
| **UI**        | `click`, `keystroke`, `delay`, `pressKey`, `displayDialog`, `displayNotification`                                            |
| **Variables** | `set`, `setExpression`, `get`, `copy`, `count`, `exists`                                                                     |
| **Data**      | `mapToJson`, `setEndRecord`, `pickEndRecord`, `returnAsJson`                                                                 |
| **Utility**   | `raw`, `build`, `reset`                                                                                                      |

### Execution Options

```typescript
const result = await runScript(script, {
  language: 'AppleScript', // or 'JavaScript'
  humanReadable: true, // Format output
  errorToStdout: false, // Redirect errors
});
```

---

## Examples

Run the included examples:

```bash
# Basics
pnpm run example:basic
pnpm run example:builder

# Data extraction
pnpm run example:messages
pnpm run example:contacts

# Advanced
pnpm run example:sdef
pnpm run example:validation
```

---

## Development

```bash
# Setup
git clone https://github.com/mherod/applescript-node.git
cd applescript-node
pnpm install

# Commands
pnpm build          # Build
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm lint           # Lint
pnpm examples       # Run all examples
```

---

## License

MIT © [mherod](https://github.com/mherod)
