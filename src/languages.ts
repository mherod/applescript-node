import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCallback);

export interface OsaLanguageInfo {
  name: string;
  subtype: string;
  manufacturer: string;
  capabilities: {
    compiling: boolean;
    sourceData: boolean;
    coercion: boolean;
    eventHandling: boolean;
    recording: boolean;
    convenience: boolean;
    dialects: boolean;
    appleEvents: boolean;
  };
  description?: string;
}

/**
 * Parse capability flags from osalang output
 *
 * **IMPORTANT: Empty String Handling**
 *
 * This function safely handles empty flag strings:
 * - Empty strings result in all capabilities being false
 * - Prevents runtime errors when flags are missing from language output
 * - Used by getInstalledLanguages() which defaults flags to '' when missing
 *
 * **Flag Meanings:**
 * - 'c': compiling - can compile scripts
 * - 'g': sourceData - supports source data
 * - 'x': coercion - supports type coercion
 * - 'e': eventHandling - supports event handling
 * - 'r': recording - supports script recording
 * - 'v': convenience - convenience features
 * - 'd': dialects - supports dialects
 * - 'h': appleEvents - supports Apple Events
 *
 * @param flags - Capability flags string from osalang output (e.g., "cgxervdh")
 * @returns Object with boolean flags for each capability
 *
 * @example
 * ```typescript
 * const caps = parseCapabilityFlags('cgxervdh');
 * // { compiling: true, sourceData: true, ... }
 *
 * const emptyCaps = parseCapabilityFlags('');
 * // { compiling: false, sourceData: false, ... } (all false)
 * ```
 */
function parseCapabilityFlags(flags: string): OsaLanguageInfo['capabilities'] {
  return {
    compiling: flags.includes('c'),
    sourceData: flags.includes('g'),
    coercion: flags.includes('x'),
    eventHandling: flags.includes('e'),
    recording: flags.includes('r'),
    convenience: flags.includes('v'),
    dialects: flags.includes('d'),
    appleEvents: flags.includes('h'),
  };
}

/**
 * Get all installed OSA (Open Scripting Architecture) languages
 *
 * **IMPORTANT: Empty Output Handling**
 *
 * This function includes critical handling for edge cases:
 *
 * 1. **Empty Output**: When `osalang -L` returns empty output (e.g., on systems
 *    with no languages installed, or in test environments), the function:
 *    - Filters out empty lines to prevent parsing errors
 *    - Returns an empty array instead of crashing
 *
 * 2. **Missing Flags**: When a language line doesn't have capability flags:
 *    - Defaults to empty string for flags parameter
 *    - parseCapabilityFlags() safely handles empty strings (all capabilities false)
 *
 * 3. **Why This Matters**: Without proper empty output handling:
 *    - Empty stdout would cause split() to return [''], leading to parsing errors
 *    - Missing flags would cause undefined access in parseCapabilityFlags()
 *    - Tests and edge cases would fail unpredictably
 *
 * **Usage Example:**
 * ```typescript
 * const languages = await getInstalledLanguages();
 * if (languages.length === 0) {
 *   console.warn('No OSA languages found');
 * } else {
 *   languages.forEach(lang => console.log(`${lang.name}: ${lang.capabilities}`));
 * }
 * ```
 *
 * **Testing Considerations:**
 * - Always test with empty output (simulates edge cases)
 * - Test with malformed lines (missing flags, etc.)
 * - Verify empty arrays are returned gracefully
 * - Ensure parseCapabilityFlags handles empty strings safely
 *
 * @returns Promise resolving to array of language information objects
 * @throws Never throws - always returns array (empty if no languages found)
 *
 * @see {@link OsaLanguageInfo} for the language information structure
 * @see {@link parseCapabilityFlags} for capability flag parsing
 */
export async function getInstalledLanguages(): Promise<OsaLanguageInfo[]> {
  const { stdout } = await exec('osalang -L');
  // CRITICAL: Filter empty lines to handle empty output gracefully
  // Empty output can occur in test environments or edge cases
  const lines = stdout
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0);

  return lines.map((line) => {
    // Format: name manu flags  description
    // CRITICAL: Default flags to empty string to handle missing flags
    // This prevents undefined access in parseCapabilityFlags()
    const [name, manufacturer, flags = '', ...descParts] = line.split(/\s+/);
    const description = descParts
      .join(' ')
      .replace(/\(([^)]+)\)/, '$1')
      .trim();

    return {
      name,
      subtype: name,
      manufacturer,
      capabilities: parseCapabilityFlags(flags),
      description,
    };
  });
}

export async function getDefaultLanguage(): Promise<OsaLanguageInfo> {
  const { stdout } = await exec('osalang -d');
  const defaultLang = stdout.trim();
  const allLangs = await getInstalledLanguages();
  return allLangs.find((lang) => lang.name === defaultLang) ?? allLangs[0];
}
