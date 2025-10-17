import { ScriptExecutor } from '../executor.js';
import { createScript } from '../index.js';

/**
 * Window information returned from macOS
 */
export interface WindowInfo {
  name: string;
  app: string;
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  minimized: boolean;
  zoomed: boolean;
  visible: boolean;
}

/**
 * Get all open windows across all applications
 * @returns Array of window information for all visible windows
 *
 * @example
 * import { windows } from 'applescript-node/sources';
 * const allWindows = await windows.getAll();
 * console.log(`Found ${allWindows.length} open windows`);
 */
export async function getAll(): Promise<WindowInfo[]> {
  const script = createScript()
    .tell('System Events')
    .set('windowsList', [])
    .forEach('proc', 'every process whose visible is true', (b) =>
      b
        .setExpression('appName', (e) => e.property('proc', 'name'))
        .forEach('win', 'windows of proc', (inner) =>
          inner.tryCatch(
            (tryBlock) =>
              tryBlock
                .setExpression('winName', (e) => e.property('win', 'name'))
                .setExpression('winId', (e) => e.property('win', 'id'))
                .setExpression('winBounds', (e) => e.property('win', 'position'))
                .setExpression('winSize', (e) => e.property('win', 'size'))
                .setExpression('winMinimized', (e) =>
                  e.property('win', 'value of attribute "AXMinimized"'),
                )
                .setExpression('winZoomed', (e) =>
                  e.property('win', 'value of attribute "AXFullScreen"'),
                )
                // Build window record using setEndRecord with full expressions
                .setEndRecord('windowsList', {
                  name: 'winName',
                  app: 'appName',
                  id: 'winId',
                  x: 'item 1 of winBounds',
                  y: 'item 2 of winBounds',
                  width: 'item 1 of winSize',
                  height: 'item 2 of winSize',
                  minimized: 'winMinimized',
                  zoomed: 'winZoomed',
                  visible: 'true',
                }),
            (catchBlock) => catchBlock.comment('Skip windows with errors'),
          ),
        ),
    )
    .returnAsJson('windowsList', {
      name: 'name',
      app: 'app',
      id: 'id',
      x: 'x',
      y: 'y',
      width: 'width',
      height: 'height',
      minimized: 'minimized',
      zoomed: 'zoomed',
      visible: 'visible',
    })
    .endtell();

  const result = await ScriptExecutor.execute(script.build());

  if (!result.success) {
    throw new Error(`Failed to get windows: ${result.error}`);
  }

  // Parse JSON output
  const windows = JSON.parse(result.output ?? '[]') as unknown[];

  return windows.map((win: unknown) => {
    const w = win as Record<string, unknown>;
    return {
      name: (w.name as string | undefined) ?? '',
      app: (w.app as string | undefined) ?? '',
      id: Number(w.id ?? 0),
      bounds: {
        x: Number(w.x ?? 0),
        y: Number(w.y ?? 0),
        width: Number(w.width ?? 0),
        height: Number(w.height ?? 0),
      },
      minimized: Boolean(w.minimized),
      zoomed: Boolean(w.zoomed),
      visible: Boolean(w.visible),
    };
  });
}

/**
 * Get all windows for a specific application
 * @param appName - Name of the application (e.g., 'Safari', 'Chrome', 'Finder')
 * @returns Array of window information for the specified application
 *
 * @example
 * import { windows } from 'applescript-node/sources';
 * const safariWindows = await windows.getByApp('Safari');
 * console.log(`Safari has ${safariWindows.length} windows open`);
 */
export async function getByApp(appName: string): Promise<WindowInfo[]> {
  const allWindows = await getAll();
  return allWindows.filter((win) => win.app === appName);
}

/**
 * Get the frontmost (focused) window across all applications
 * @returns The currently focused window, or null if no window is focused
 *
 * @example
 * import { windows } from 'applescript-node/sources';
 * const activeWindow = await windows.getFrontmost();
 * if (activeWindow) {
 *   console.log(`Active window: ${activeWindow.name} (${activeWindow.app})`);
 * }
 */
export async function getFrontmost(): Promise<WindowInfo | null> {
  const script = `
    tell application "System Events"
      set frontApp to name of first process whose frontmost is true
      tell process frontApp
        try
          set frontWin to front window
          set winName to name of frontWin
          set winBounds to position of frontWin
          set winSize to size of frontWin
          set winMinimized to value of attribute "AXMinimized" of frontWin
          set winZoomed to value of attribute "AXFullScreen" of frontWin

          return "{" & ¬
            "\\"name\\":\\"" & winName & "\\"," & ¬
            "\\"app\\":\\"" & frontApp & "\\"," & ¬
            "\\"x\\":" & (item 1 of winBounds) & "," & ¬
            "\\"y\\":" & (item 2 of winBounds) & "," & ¬
            "\\"width\\":" & (item 1 of winSize) & "," & ¬
            "\\"height\\":" & (item 2 of winSize) & "," & ¬
            "\\"minimized\\":" & winMinimized & "," & ¬
            "\\"zoomed\\":" & winZoomed & "," & ¬
            "\\"visible\\":true" & ¬
            "}"
        on error
          return ""
        end try
      end tell
    end tell
  `;

  const result = await ScriptExecutor.execute(script);

  if (!(result.success && result.output)) {
    return null;
  }

  try {
    const win = JSON.parse(result.output) as Record<string, unknown>;
    return {
      name: (win.name as string | undefined) ?? '',
      app: (win.app as string | undefined) ?? '',
      id: 0, // Frontmost window query doesn't include ID
      bounds: {
        x: Number(win.x ?? 0),
        y: Number(win.y ?? 0),
        width: Number(win.width ?? 0),
        height: Number(win.height ?? 0),
      },
      minimized: Boolean(win.minimized),
      zoomed: Boolean(win.zoomed),
      visible: Boolean(win.visible),
    };
  } catch {
    return null;
  }
}

/**
 * Get window count by application
 * @returns Map of application names to window counts
 *
 * @example
 * import { windows } from 'applescript-node/sources';
 * const counts = await windows.getCountByApp();
 * console.log('Window counts:', counts);
 * // { 'Safari': 3, 'Chrome': 2, 'Terminal': 1 }
 */
export async function getCountByApp(): Promise<Record<string, number>> {
  const allWindows = await getAll();
  const counts: Record<string, number> = {};

  for (const win of allWindows) {
    counts[win.app] = (counts[win.app] || 0) + 1;
  }

  return counts;
}
