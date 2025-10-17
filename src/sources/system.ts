import { ScriptExecutor } from '../executor.js';
import { createScript } from '../index.js';

/**
 * System information returned from macOS
 */
export interface SystemInfo {
  computerName: string;
  hostname: string;
  osVersion: string;
  systemVersion: string;
  userName: string;
  homeDirectory: string;
  architecture: string;
}

/**
 * Volume information for mounted drives
 */
export interface VolumeInfo {
  name: string;
  capacity: number;
  freeSpace: number;
  usedSpace: number;
  format: string;
  ejectable: boolean;
}

/**
 * Display information
 */
export interface DisplayInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Get system information
 * @returns System information including computer name, OS version, etc.
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const info = await system.getInfo();
 * console.log(`Computer: ${info.computerName}`);
 * console.log(`OS: ${info.osVersion}`);
 */
export async function getInfo(): Promise<SystemInfo> {
  const script = `
    set computerName to computer name of (system info)
    set userName to short user name of (system info)
    set osVersion to system version of (system info)

    set homeDir to POSIX path of (path to home folder)

    -- Get hostname via shell
    set hostname to do shell script "hostname"

    -- Get architecture via shell
    set arch to do shell script "uname -m"

    return "{" & ¬
      "\\"computerName\\":\\"" & computerName & "\\"," & ¬
      "\\"hostname\\":\\"" & hostname & "\\"," & ¬
      "\\"osVersion\\":\\"" & osVersion & "\\"," & ¬
      "\\"systemVersion\\":\\"" & osVersion & "\\"," & ¬
      "\\"userName\\":\\"" & userName & "\\"," & ¬
      "\\"homeDirectory\\":\\"" & homeDir & "\\"," & ¬
      "\\"architecture\\":\\"" & arch & "\\"" & ¬
      "}"
  `;

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`Failed to get system info: ${result.error}`);
  }

  return JSON.parse(result.output ?? '{}') as SystemInfo;
}

/**
 * Get information about mounted volumes
 * @returns Array of volume information for all mounted drives
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const volumes = await system.getVolumes();
 * volumes.forEach(vol => {
 *   console.log(`${vol.name}: ${vol.freeSpace}GB free of ${vol.capacity}GB`);
 * });
 */
export async function getVolumes(): Promise<VolumeInfo[]> {
  const script = createScript()
    .tell('Finder')
    .set('volumesList', [])
    .forEach('aDisk', 'every disk', (b) =>
      b.tryCatch(
        (tryBlock) =>
          tryBlock
            .setExpression('diskName', (e) => e.property('aDisk', 'name'))
            .setExpression('diskCapacity', (e) => e.property('aDisk', 'capacity'))
            .setExpression('diskFreeSpace', (e) => e.property('aDisk', 'free space'))
            .setExpression('diskFormat', (e) => e.property('aDisk', 'format'))
            .setExpression('diskEjectable', (e) => e.property('aDisk', 'ejectable'))
            .raw('set diskUsed to diskCapacity - diskFreeSpace')
            .setEndRecord('volumesList', {
              name: 'diskName',
              capacity: 'diskCapacity',
              freeSpace: 'diskFreeSpace',
              usedSpace: 'diskUsed',
              format: 'diskFormat',
              ejectable: 'diskEjectable',
            }),
        (catchBlock) => catchBlock.comment('Skip disks with errors'),
      ),
    )
    .returnAsJson('volumesList', {
      name: 'name',
      capacity: 'capacity',
      freeSpace: 'freeSpace',
      usedSpace: 'usedSpace',
      format: 'format',
      ejectable: 'ejectable',
    })
    .endtell();

  const result = await ScriptExecutor.execute(script.build());

  if (!result.success) {
    throw new Error(`Failed to get volumes: ${result.error}`);
  }

  // Parse JSON output
  return JSON.parse(result.output ?? '[]') as VolumeInfo[];
}

/**
 * Get display information for all connected displays
 * @returns Array of display information
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const displays = await system.getDisplays();
 * console.log(`Found ${displays.length} display(s)`);
 */
export async function getDisplays(): Promise<DisplayInfo[]> {
  // Use shell command to get display information as macOS API has changed
  const script = `
    do shell script "system_profiler SPDisplaysDataType | grep Resolution"
  `;

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    // Return a default display if we can't get real data
    return [
      {
        id: 1,
        bounds: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      },
    ];
  }

  // Parse resolution from system_profiler output
  // Format: "Resolution: 2560 x 1600 (2x)"
  const lines = (result.output ?? '').split('\n');
  const displays: DisplayInfo[] = lines
    .map((line, idx) => {
      const match = /Resolution:\s+(\d+)\s+x\s+(\d+)/.exec(line);
      if (match) {
        return {
          id: idx + 1,
          bounds: {
            x: 0,
            y: 0,
            width: Number.parseInt(match[1], 10),
            height: Number.parseInt(match[2], 10),
          },
        };
      }
      return null;
    })
    .filter((d): d is DisplayInfo => d !== null);

  return displays.length > 0
    ? displays
    : [
        {
          id: 1,
          bounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
        },
      ];
}

/**
 * Get the current clipboard contents
 * @returns Clipboard text content
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const clipboardText = await system.getClipboard();
 * console.log('Clipboard:', clipboardText);
 */
export async function getClipboard(): Promise<string> {
  const script = `
    try
      return the clipboard as text
    on error
      return ""
    end try
  `;

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    return '';
  }

  return result.output ?? '';
}

/**
 * Set the clipboard contents
 * @param text - Text to set in clipboard
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * await system.setClipboard('Hello, World!');
 */
export async function setClipboard(text: string): Promise<void> {
  const script = createScript()
    .raw(`set the clipboard to "${text.replace(/"/g, '\\"')}"`)
    .build();

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`Failed to set clipboard: ${result.error}`);
  }
}

/**
 * Get path to common system folders
 * @param folder - Folder identifier (e.g., 'home', 'desktop', 'documents', 'downloads', 'applications', 'library', 'temporary items')
 * @returns POSIX path to the folder
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const desktop = await system.getPath('desktop');
 * console.log('Desktop path:', desktop);
 */
export async function getPath(
  folder:
    | 'home'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'applications'
    | 'library'
    | 'temporary items'
    | 'music'
    | 'pictures'
    | 'movies'
    | 'public',
): Promise<string> {
  const folderMap: Record<string, string> = {
    home: 'home folder',
    desktop: 'desktop folder',
    documents: 'documents folder',
    downloads: 'downloads folder',
    applications: 'applications folder',
    library: 'library folder',
    'temporary items': 'temporary items folder',
    music: 'music folder',
    pictures: 'pictures folder',
    movies: 'movies folder',
    public: 'public folder',
  };

  const folderName = folderMap[folder] || 'home folder';

  const script = `POSIX path of (path to ${folderName})`;

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`Failed to get path for ${folder}: ${result.error}`);
  }

  return (result.output ?? '').trim();
}

/**
 * Check if the system is in dark mode
 * @returns True if dark mode is enabled
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * if (await system.isDarkMode()) {
 *   console.log('Dark mode is enabled');
 * }
 */
export async function isDarkMode(): Promise<boolean> {
  const script =
    'tell application "System Events" to tell appearance preferences to return dark mode';

  const result = await ScriptExecutor.execute(script);

  return result.success && (result.output ?? '').trim() === 'true';
}

/**
 * Get system uptime in seconds
 * @returns Number of seconds since last boot
 *
 * @example
 * import { system } from 'applescript-node/sources';
 * const uptime = await system.getUptime();
 * console.log(`System uptime: ${Math.floor(uptime / 3600)} hours`);
 */
export async function getUptime(): Promise<number> {
  const script = "do shell script \"sysctl -n kern.boottime | awk '{print $4}' | sed 's/,//'\"";

  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`Failed to get uptime: ${result.error}`);
  }

  const bootTime = Number.parseInt((result.output ?? '0').trim(), 10);
  const now = Math.floor(Date.now() / 1000);

  return now - bootTime;
}
