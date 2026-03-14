import { ScriptExecutor } from '../executor.js';
import { createScript } from '../index.js';
import { executeJsonScript, executeScriptOrThrow } from './shared.js';

/**
 * Application information returned from macOS
 */
export interface ApplicationInfo {
  name: string;
  bundleId: string;
  pid: number;
  visible: boolean;
  frontmost: boolean;
  windowCount: number;
}

/**
 * Get all running applications
 * @param includeBackgroundApps - Include background-only applications (default: false)
 * @returns Array of running application information
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * const apps = await applications.getAll();
 * console.log(`Found ${apps.length} running applications`);
 */
export async function getAll(includeBackgroundApps = false): Promise<ApplicationInfo[]> {
  const whereClause = includeBackgroundApps ? '' : ' whose background only is false';

  const script = createScript()
    .tell('System Events')
    .set('appsList', [])
    .forEach('proc', `every process${whereClause}`, (b) =>
      b.tryCatch(
        (tryBlock) =>
          tryBlock
            .setExpression('procName', (e) => e.property('proc', 'name'))
            .setExpression('procBundleId', (e) => e.property('proc', 'bundle identifier'))
            .setExpression('procPid', (e) => e.property('proc', 'unix id'))
            .setExpression('procVisible', (e) => e.property('proc', 'visible'))
            .setExpression('procFrontmost', (e) => e.property('proc', 'frontmost'))
            .setExpression('procWindowCount', (e) => e.count(e.property('proc', 'windows')))
            .pickEndRecord('appsList', 'proc', {
              name: 'procName',
              bundleId: 'procBundleId',
              pid: 'procPid',
              visible: 'procVisible',
              frontmost: 'procFrontmost',
              windowCount: 'procWindowCount',
            }),
        (catchBlock) => catchBlock.comment('Skip processes with errors'),
      ),
    )
    .returnAsJson('appsList', {
      name: 'name',
      bundleId: 'bundleId',
      pid: 'pid',
      visible: 'visible',
      frontmost: 'frontmost',
      windowCount: 'windowCount',
    })
    .endtell();

  return executeJsonScript<ApplicationInfo[]>(script.build(), {
    errorPrefix: 'Failed to get applications',
    fallbackJson: '[]',
  });
}

/**
 * Get the frontmost (focused) application
 * @returns The currently focused application
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * const frontApp = await applications.getFrontmost();
 * console.log(`Active application: ${frontApp.name}`);
 */
export async function getFrontmost(): Promise<ApplicationInfo> {
  const script = createScript()
    .tell('System Events')
    .setExpression('frontProc', 'first process whose frontmost is true')
    .returnJsonObject({
      name: 'name of frontProc',
      bundleId: 'bundle identifier of frontProc',
      pid: 'unix id of frontProc',
      visible: 'visible of frontProc',
      frontmost: 'true',
      windowCount: 'count of windows of frontProc',
    })
    .endtell();

  return executeJsonScript<ApplicationInfo>(script.build(), {
    errorPrefix: 'Failed to get frontmost application',
    fallbackJson: '{}',
  });
}

/**
 * Check if an application is running
 * @param appName - Name of the application to check
 * @returns True if the application is running, false otherwise
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * if (await applications.isRunning('Safari')) {
 *   console.log('Safari is running');
 * }
 */
export async function isRunning(appName: string): Promise<boolean> {
  const escapedAppName = escapeAppleScriptString(appName);
  const script = `
    tell application "System Events"
      return exists (processes where name is "${escapedAppName}")
    end tell
  `;

  const result = await ScriptExecutor.execute(script);
  return result.success && result.output === 'true';
}

/**
 * Get application by name
 * @param appName - Name of the application
 * @returns Application information, or null if not running
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * const safari = await applications.getByName('Safari');
 * if (safari) {
 *   console.log(`Safari PID: ${safari.pid}`);
 * }
 */
export async function getByName(appName: string): Promise<ApplicationInfo | null> {
  const allApps = await getAll(true);
  return allApps.find((app) => app.name === appName) ?? null;
}

/**
 * Activate (bring to front) an application
 * @param appName - Name of the application to activate
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * await applications.activate('Safari');
 */
export async function activate(appName: string): Promise<void> {
  const script = createScript().tell(appName).activate().endtell();
  await executeScriptOrThrow(script.build(), `Failed to activate ${appName}`);
}

/**
 * Launch an application without activating it
 * @param appName - Name of the application to launch
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * await applications.launch('Calendar');
 */
export async function launch(appName: string): Promise<void> {
  const script = createScript().tell(appName).launch().endtell();
  await executeScriptOrThrow(script.build(), `Failed to launch ${appName}`);
}

/**
 * Quit an application
 * @param appName - Name of the application to quit
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * await applications.quit('TextEdit');
 */
export async function quit(appName: string): Promise<void> {
  const script = createScript().tell(appName).quit().endtell();
  await executeScriptOrThrow(script.build(), `Failed to quit ${appName}`);
}

/**
 * Hide an application
 * @param appName - Name of the application to hide
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * await applications.hide('Safari');
 */
export async function hide(appName: string): Promise<void> {
  await setApplicationVisibility(appName, false);
}

/**
 * Show (unhide) an application
 * @param appName - Name of the application to show
 *
 * @example
 * import { applications } from 'applescript-node/sources';
 * await applications.show('Safari');
 */
export async function show(appName: string): Promise<void> {
  await setApplicationVisibility(appName, true);
}

function escapeAppleScriptString(value: string): string {
  return value.replace(/"/g, '\\"');
}

function buildVisibilityScript(appName: string, visible: boolean): string {
  const script = createScript()
    .tell('System Events')
    .tell(`process "${escapeAppleScriptString(appName)}"`)
    .raw(`set visible to ${visible}`)
    .endtell()
    .endtell();

  return script.build();
}

async function setApplicationVisibility(appName: string, visible: boolean): Promise<void> {
  const action = visible ? 'show' : 'hide';
  await executeScriptOrThrow(
    buildVisibilityScript(appName, visible),
    `Failed to ${action} ${appName}`,
  );
}
