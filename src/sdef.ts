import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { XMLParser } from 'fast-xml-parser';
import type {
  ApplicationDictionary,
  Class,
  Command,
  Element,
  Enumeration,
  Enumerator,
  Parameter,
  Property,
  Suite,
  TypeInfo,
} from './types.js';

const exec = promisify(execCallback);

// Cache for sdef results to avoid repeated parsing
const sdefCache = new Map<string, ApplicationDictionary>();

/**
 * Extract the scripting definition (sdef) XML for a macOS application
 * @param appPath - Path to the application (e.g., '/System/Applications/Messages.app')
 * @returns Promise resolving to the sdef XML string
 */
export async function getSdef(appPath: string): Promise<string> {
  try {
    const { stdout } = await exec(`sdef "${appPath}"`);
    return stdout;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get sdef for ${appPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse sdef XML into a structured ApplicationDictionary
 * @param xml - The sdef XML string to parse
 * @returns Parsed ApplicationDictionary
 */
export function parseSdef(xml: string): ApplicationDictionary {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false,
    trimValues: true,
    isArray: (name) => {
      // These elements can appear multiple times
      return [
        'suite',
        'class',
        'command',
        'enumeration',
        'property',
        'element',
        'parameter',
        'enumerator',
        'type',
      ].includes(name);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsed = parser.parse(xml);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const dictionary = parsed.dictionary;

  if (!dictionary) {
    throw new Error('Invalid sdef XML: missing dictionary root element');
  }

  const suites: Suite[] = [];

  // Handle suites (can be an array or single object)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const suitesData = Array.isArray(dictionary.suite)
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      dictionary.suite
    : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      dictionary.suite
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        [dictionary.suite]
      : [];

  for (const suiteData of suitesData) {
    const suite: Suite = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      name: suiteData['@_name'] ?? '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      code: suiteData['@_code'] ?? '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      description: suiteData['@_description'],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      classes: parseClasses(suiteData.class),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      commands: parseCommands(suiteData.command),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      enumerations: parseEnumerations(suiteData.enumeration),
    };
    suites.push(suite);
  }

  return { suites };
}

// XML parsing helper functions - these work with dynamic XML parser output
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

function parseClasses(classesData: unknown): Class[] {
  if (!classesData) return [];
  const classes = Array.isArray(classesData) ? classesData : [classesData];

  return classes.map((cls: any) => ({
    name: cls['@_name'] ?? '',
    code: cls['@_code'] ?? '',
    description: cls['@_description'],
    plural: cls['@_plural'],
    inherits: cls['@_inherits'],
    properties: parseProperties(cls.property),
    elements: parseElements(cls.element),
  }));
}

function parseProperties(propertiesData: unknown): Property[] {
  if (!propertiesData) return [];
  const properties = Array.isArray(propertiesData) ? propertiesData : [propertiesData];

  return properties.map((prop: any) => ({
    name: prop['@_name'] ?? '',
    code: prop['@_code'] ?? '',
    type: parseTypeInfo(prop['@_type'], prop.type),
    access: (prop['@_access'] as 'r' | 'rw' | undefined) ?? 'rw',
    description: prop['@_description'],
  }));
}

function parseElements(elementsData: unknown): Element[] {
  if (!elementsData) return [];
  const elements = Array.isArray(elementsData) ? elementsData : [elementsData];

  return elements.map((elem: any) => ({
    type: elem['@_type'] ?? '',
    access: elem['@_access'] as 'r' | 'rw' | undefined,
  }));
}

function parseCommands(commandsData: unknown): Command[] {
  if (!commandsData) return [];
  const commands = Array.isArray(commandsData) ? commandsData : [commandsData];

  return commands.map((cmd: any) => ({
    name: cmd['@_name'] ?? '',
    code: cmd['@_code'] ?? '',
    description: cmd['@_description'],
    directParameter: cmd['direct-parameter']
      ? {
          type: cmd['direct-parameter']['@_type'] ?? '',
          description: cmd['direct-parameter']['@_description'],
        }
      : undefined,
    parameters: parseParameters(cmd.parameter),
    result: cmd.result
      ? {
          type: cmd.result['@_type'] ?? '',
          description: cmd.result['@_description'],
        }
      : undefined,
  }));
}

function parseParameters(parametersData: unknown): Parameter[] {
  if (!parametersData) return [];
  const parameters = Array.isArray(parametersData) ? parametersData : [parametersData];

  return parameters.map((param: any) => ({
    name: param['@_name'] ?? '',
    code: param['@_code'] ?? '',
    type: parseTypeInfo(param['@_type'], param.type),
    optional: param['@_optional'] === 'yes',
    description: param['@_description'],
  }));
}

function parseEnumerations(enumerationsData: unknown): Enumeration[] {
  if (!enumerationsData) return [];
  const enumerations = Array.isArray(enumerationsData) ? enumerationsData : [enumerationsData];

  return enumerations.map((enumData: any) => ({
    name: enumData['@_name'] ?? '',
    code: enumData['@_code'] ?? '',
    enumerators: parseEnumerators(enumData.enumerator),
  }));
}

function parseEnumerators(enumeratorsData: unknown): Enumerator[] {
  if (!enumeratorsData) return [];
  const enumerators = Array.isArray(enumeratorsData) ? enumeratorsData : [enumeratorsData];

  return enumerators.map((enumer: any) => ({
    name: enumer['@_name'] ?? '',
    code: enumer['@_code'] ?? '',
    description: enumer['@_description'],
  }));
}

function parseTypeInfo(typeAttr: string | undefined, typeElement: any): TypeInfo {
  // If type is specified as an attribute
  if (typeAttr) {
    return { type: typeAttr };
  }

  // If type is specified as a nested element
  if (typeElement) {
    const types = Array.isArray(typeElement) ? typeElement : [typeElement];
    // For now, use the first type if multiple are specified
    const firstType = types[0];
    return {
      type: firstType['@_type'] ?? 'any',
      list: firstType['@_list'] === 'yes',
    };
  }

  return { type: 'any' };
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

/**
 * Get and parse the application dictionary for a macOS application
 * @param appPath - Path to the application (e.g., '/System/Applications/Messages.app')
 * @param useCache - Whether to use cached results (default: true)
 * @returns Promise resolving to the parsed ApplicationDictionary
 */
export async function getApplicationDictionary(
  appPath: string,
  useCache = true,
): Promise<ApplicationDictionary> {
  // Check cache first
  if (useCache && sdefCache.has(appPath)) {
    const cached = sdefCache.get(appPath);
    if (cached) return cached;
  }

  // Get and parse sdef
  const xml = await getSdef(appPath);
  const dictionary = parseSdef(xml);

  // Cache the result
  if (useCache) {
    sdefCache.set(appPath, dictionary);
  }

  return dictionary;
}

/**
 * Clear the sdef cache
 */
export function clearSdefCache(): void {
  sdefCache.clear();
}

/**
 * Get a list of all commands in an application dictionary
 * @param dictionary - The application dictionary
 * @returns Array of all commands from all suites
 */
export function getAllCommands(dictionary: ApplicationDictionary): Command[] {
  return dictionary.suites.flatMap((suite) => suite.commands);
}

/**
 * Get a list of all classes in an application dictionary
 * @param dictionary - The application dictionary
 * @returns Array of all classes from all suites
 */
export function getAllClasses(dictionary: ApplicationDictionary): Class[] {
  return dictionary.suites.flatMap((suite) => suite.classes);
}

/**
 * Find a command by name in an application dictionary
 * @param dictionary - The application dictionary
 * @param commandName - The name of the command to find
 * @returns The command if found, undefined otherwise
 */
export function findCommand(
  dictionary: ApplicationDictionary,
  commandName: string,
): Command | undefined {
  for (const suite of dictionary.suites) {
    const command = suite.commands.find((cmd) => cmd.name === commandName);
    if (command) return command;
  }
  return;
}

/**
 * Find a class by name in an application dictionary
 * @param dictionary - The application dictionary
 * @param className - The name of the class to find
 * @returns The class if found, undefined otherwise
 */
export function findClass(dictionary: ApplicationDictionary, className: string): Class | undefined {
  for (const suite of dictionary.suites) {
    const cls = suite.classes.find((c) => c.name === className);
    if (cls) return cls;
  }
  return;
}
