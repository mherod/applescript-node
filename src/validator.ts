import { findClass, findCommand, getAllClasses, getApplicationDictionary } from './sdef.js';
import type { ApplicationDictionary, Class, Command, Property } from './types.js';

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue found in a script
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
}

/**
 * Result of script validation
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

/**
 * Options for script validation
 */
export interface ValidationOptions {
  /**
   * Strictness level for validation
   * - 'strict': Treat warnings as errors
   * - 'normal': Standard validation (default)
   * - 'lenient': Only report errors, skip warnings
   */
  strictness?: 'strict' | 'normal' | 'lenient';

  /**
   * Whether to provide suggestions for fixes
   */
  provideSuggestions?: boolean;

  /**
   * Custom dictionary to validate against (otherwise fetched from appPath)
   */
  dictionary?: ApplicationDictionary;
}

/**
 * Script validator for AppleScript validation against application sdef
 */
export class ScriptValidator {
  private dictionary: ApplicationDictionary;
  private appName: string;

  constructor(dictionary: ApplicationDictionary, appName: string) {
    this.dictionary = dictionary;
    this.appName = appName;
  }

  /**
   * Create a validator for a specific application
   */
  static async forApplication(appPath: string): Promise<ScriptValidator> {
    const dictionary = await getApplicationDictionary(appPath);
    // Extract app name from path
    const appName =
      appPath
        .split('/')
        .pop()
        ?.replace(/\.app$/, '') ?? 'Unknown';
    return new ScriptValidator(dictionary, appName);
  }

  /**
   * Validate a script string
   */
  validate(script: string, options: ValidationOptions = {}): ValidationResult {
    const { strictness = 'normal', provideSuggestions = true } = options;

    const issues: ValidationIssue[] = [];

    // Extract tell blocks to identify target application
    const tellBlocks = this.extractTellBlocks(script);

    for (const block of tellBlocks) {
      // Validate commands in this block
      this.validateCommands(block.content, issues, provideSuggestions);

      // Validate property access
      this.validateProperties(block.content, issues, provideSuggestions);
    }

    // Categorize issues
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const info = issues.filter((i) => i.severity === 'info');

    // Determine if valid based on strictness
    let valid = errors.length === 0;
    if (strictness === 'strict') {
      valid = valid && warnings.length === 0;
    }

    return {
      valid,
      issues,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Extract tell application blocks from script
   */
  private extractTellBlocks(script: string): { target: string; content: string }[] {
    const blocks: { target: string; content: string }[] = [];
    const lines = script.split('\n');

    let currentBlock: { target: string; content: string; depth: number } | null = null;
    let blockDepth = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Match tell application "AppName" or tell application "System Events"
      const tellMatch = /^tell\s+application\s+"([^"]+)"/i.exec(trimmed);
      if (tellMatch) {
        const target = tellMatch[1];
        if (currentBlock) {
          blockDepth++;
        } else {
          currentBlock = { target, content: '', depth: 0 };
        }
        continue;
      }

      // Match end tell
      if (/^end\s+tell/i.test(trimmed)) {
        if (blockDepth > 0) {
          blockDepth--;
        } else if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Add content to current block
      if (currentBlock) {
        currentBlock.content += line + '\n';
      }
    }

    return blocks;
  }

  /**
   * Validate commands in script content
   */
  private validateCommands(
    content: string,
    issues: ValidationIssue[],
    provideSuggestions: boolean,
  ): void {
    // Look for command-like patterns
    // This is a simplified parser - a full parser would be more complex

    // Pattern: words at the start of a line (potential commands)
    // Exclude keywords like if, then, else, repeat, etc.
    const lines = content.split('\n');
    const keywords = new Set([
      'if',
      'then',
      'else',
      'end',
      'repeat',
      'tell',
      'to',
      'of',
      'on',
      'return',
      'try',
      'error',
      'set',
      'get',
      'copy',
      'count',
      'exit',
      'considering',
      'ignoring',
      'with',
      'without',
      'using',
      'my',
      'its',
      'a',
      'an',
      'the',
      'some',
      'every',
      'whose',
    ]);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      // Extract first word (potential command)
      const words = trimmed.split(/\s+/);
      if (words.length === 0) continue;

      const potentialCommand = words[0].toLowerCase();

      // Skip keywords
      if (keywords.has(potentialCommand)) continue;

      // Check if this looks like a command (not a variable assignment pattern)
      if (/^[a-z_][a-z0-9_]*$/i.test(potentialCommand)) {
        // Check if command exists in sdef
        const command = findCommand(this.dictionary, potentialCommand);

        if (!command) {
          const issue: ValidationIssue = {
            severity: 'warning',
            message: `Command '${potentialCommand}' might not exist in ${this.appName}`,
            code: 'unknown-command',
          };

          if (provideSuggestions) {
            const suggestion = this.suggestSimilarCommand(potentialCommand);
            if (suggestion) {
              issue.suggestion = `Did you mean '${suggestion.name}'? ${suggestion.description ?? ''}`;
            }
          }

          issues.push(issue);
        }
      }
    }
  }

  /**
   * Validate property access in script content
   */
  private validateProperties(
    content: string,
    issues: ValidationIssue[],
    _provideSuggestions: boolean,
  ): void {
    // Look for property set operations
    // Pattern: set property [of object] to value
    // Matches: "set id of chat "test" to "new-id""
    // Captures the property name before "of" or "to"
    const setPattern = /set\s+([\w\s]+?)\s+(?:of\s+|to\s+)/gi;

    let match: RegExpExecArray | null;
    while ((match = setPattern.exec(content)) !== null) {
      const propertyName = match[1].trim();

      // Skip if this looks like a variable name (no spaces usually)
      // Property names in AppleScript can have spaces like "full name"
      if (propertyName && propertyName.length > 0) {
        // Check if this property is read-only in any class
        const readOnlyProp = this.findReadOnlyProperty(propertyName);

        if (readOnlyProp) {
          issues.push({
            severity: 'error',
            message: `Property '${propertyName}' is read-only and cannot be set`,
            code: 'readonly-property',
            suggestion: `Property '${propertyName}' in class '${readOnlyProp.className}' has access level 'r' (read-only)`,
          });
        }
      }
    }
  }

  /**
   * Find a read-only property by name across all classes
   */
  private findReadOnlyProperty(
    propertyName: string,
  ): { className: string; property: Property } | null {
    const classes = getAllClasses(this.dictionary);

    for (const cls of classes) {
      const prop = cls.properties.find(
        (p) => p.name.toLowerCase() === propertyName.toLowerCase() && p.access === 'r',
      );
      if (prop) {
        return { className: cls.name, property: prop };
      }
    }

    return null;
  }

  /**
   * Suggest a similar command name using string similarity
   */
  private suggestSimilarCommand(commandName: string): Command | undefined {
    const allCommands = this.dictionary.suites.flatMap((suite) => suite.commands);

    // Simple Levenshtein-like matching
    let bestMatch: Command | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const cmd of allCommands) {
      const distance = this.levenshteinDistance(commandName.toLowerCase(), cmd.name.toLowerCase());

      // Only suggest if reasonably similar (distance <= 3)
      if (distance < bestScore && distance <= 3) {
        bestScore = distance;
        bestMatch = cmd;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Validate a command and its parameters
   */
  validateCommand(
    commandName: string,
    parameters: Record<string, unknown> = {},
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const command = findCommand(this.dictionary, commandName);

    if (!command) {
      issues.push({
        severity: 'error',
        message: `Command '${commandName}' does not exist in ${this.appName}`,
        code: 'unknown-command',
      });
      return issues;
    }

    // Check required parameters
    const requiredParams = command.parameters.filter((p) => !p.optional);
    for (const param of requiredParams) {
      if (!(param.name in parameters)) {
        issues.push({
          severity: 'error',
          message: `Required parameter '${param.name}' is missing for command '${commandName}'`,
          code: 'missing-parameter',
          suggestion: param.description,
        });
      }
    }

    // Check for unknown parameters
    for (const paramName of Object.keys(parameters)) {
      const paramDef = command.parameters.find((p) => p.name === paramName);
      if (!paramDef) {
        issues.push({
          severity: 'warning',
          message: `Unknown parameter '${paramName}' for command '${commandName}'`,
          code: 'unknown-parameter',
        });
      }
    }

    return issues;
  }

  /**
   * Validate property access on a class
   */
  validatePropertyAccess(
    className: string,
    propertyName: string,
    accessType: 'read' | 'write',
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const cls = findClass(this.dictionary, className);

    if (!cls) {
      issues.push({
        severity: 'error',
        message: `Class '${className}' does not exist in ${this.appName}`,
        code: 'unknown-class',
      });
      return issues;
    }

    const property = cls.properties.find((p) => p.name === propertyName);

    if (!property) {
      issues.push({
        severity: 'error',
        message: `Property '${propertyName}' does not exist on class '${className}'`,
        code: 'unknown-property',
      });
      return issues;
    }

    if (accessType === 'write' && property.access === 'r') {
      issues.push({
        severity: 'error',
        message: `Property '${propertyName}' is read-only on class '${className}'`,
        code: 'readonly-property',
        suggestion: `Property has access level 'r'. Available properties with write access: ${cls.properties
          .filter((p) => p.access === 'rw')
          .map((p) => p.name)
          .join(', ')}`,
      });
    }

    return issues;
  }

  /**
   * Get all available commands in the application
   */
  getAvailableCommands(): Command[] {
    return this.dictionary.suites.flatMap((suite) => suite.commands);
  }

  /**
   * Get all available classes in the application
   */
  getAvailableClasses(): Class[] {
    return getAllClasses(this.dictionary);
  }
}

/**
 * Quick validation helper function
 */
export async function validateScript(
  script: string,
  appPath: string,
  options?: ValidationOptions,
): Promise<ValidationResult> {
  const validator = await ScriptValidator.forApplication(appPath);
  return validator.validate(script, options);
}
