/**
 * High-level data source APIs for common macOS operations.
 *
 * These modules provide clean, succinct entry points for typical macOS data sourcing tasks.
 * Each module wraps the low-level builder API to provide simple, async functions.
 *
 * @example
 * // Get all open windows across all applications
 * import { windows } from 'applescript-node/sources';
 * const allWindows = await windows.getAll();
 *
 * @example
 * // Get all running applications
 * import { applications } from 'applescript-node/sources';
 * const apps = await applications.getAll();
 *
 * @example
 * // Get system information
 * import { system } from 'applescript-node/sources';
 * const info = await system.getInfo();
 *
 * @module sources
 */

export type { ApplicationInfo } from './applications.js';
export * as applications from './applications.js';
export type { DisplayInfo, SystemInfo, VolumeInfo } from './system.js';
export * as system from './system.js';
// Re-export types for convenience
export type { WindowInfo } from './windows.js';
export * as windows from './windows.js';
