import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';

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

export async function getInstalledLanguages(): Promise<OsaLanguageInfo[]> {
  const { stdout } = await exec('osalang -L');
  const lines = stdout.trim().split('\n');

  return lines.map((line) => {
    // Format: name manu flags  description
    const [name, manufacturer, flags, ...descParts] = line.split(/\s+/);
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
