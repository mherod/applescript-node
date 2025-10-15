import { exec } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSdefCache,
  findClass,
  findCommand,
  getAllClasses,
  getAllCommands,
  getApplicationDictionary,
  getSdef,
  parseSdef,
} from './sdef.js';

// Mock the exec function
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

// Sample sdef XML for testing
const mockSdefXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE dictionary SYSTEM "file://localhost/System/Library/DTDs/sdef.dtd">
<dictionary>
  <suite name="Test Suite" code="test" description="A test suite">
    <command name="test command" code="tstc" description="A test command">
      <direct-parameter type="text" description="The text to test"/>
      <parameter name="with option" code="wopt" type="boolean" optional="yes" description="An optional parameter"/>
      <result type="integer" description="The result"/>
    </command>

    <enumeration name="test enum" code="tenu">
      <enumerator name="value one" code="val1" description="First value"/>
      <enumerator name="value two" code="val2" description="Second value"/>
    </enumeration>

    <class name="test class" code="tcls" description="A test class" plural="test classes">
      <property name="test property" code="tprp" type="text" access="rw" description="A test property"/>
      <property name="readonly property" code="ropr" type="integer" access="r" description="A readonly property"/>
      <element type="item" access="r"/>
    </class>

    <class name="child class" code="chcl" description="A child class" inherits="test class">
      <property name="child property" code="chpr" type="text" access="r" description="A child property"/>
    </class>
  </suite>

  <suite name="Another Suite" code="ano2" description="Another test suite">
    <command name="another command" code="anoc" description="Another command">
      <result type="text" description="Text result"/>
    </command>

    <class name="another class" code="ancl" description="Another class">
      <property name="another property" code="anpr" type="boolean" access="rw" description="Another property"/>
    </class>
  </suite>
</dictionary>`;

describe('sdef module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSdefCache();
  });

  afterEach(() => {
    clearSdefCache();
  });

  describe('getSdef', () => {
    it('should execute sdef command and return XML', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, { stdout: mockSdefXml, stderr: '' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      const result = await getSdef('/System/Applications/Test.app');
      expect(result).toBe(mockSdefXml);
      expect(mockExec).toHaveBeenCalledWith(
        'sdef "/System/Applications/Test.app"',
        expect.any(Function),
      );
    });

    it('should handle errors from sdef command', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(new Error('sdef failed'), { stdout: '', stderr: 'error' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      await expect(getSdef('/System/Applications/Test.app')).rejects.toThrow('Failed to get sdef');
    });
  });

  describe('parseSdef', () => {
    it('should parse sdef XML into ApplicationDictionary', () => {
      const dictionary = parseSdef(mockSdefXml);

      expect(dictionary.suites).toHaveLength(2);
      expect(dictionary.suites[0].name).toBe('Test Suite');
      expect(dictionary.suites[0].code).toBe('test');
      expect(dictionary.suites[0].description).toBe('A test suite');
    });

    it('should parse commands correctly', () => {
      const dictionary = parseSdef(mockSdefXml);
      const testSuite = dictionary.suites[0];

      expect(testSuite.commands).toHaveLength(1);
      const command = testSuite.commands[0];
      expect(command.name).toBe('test command');
      expect(command.code).toBe('tstc');
      expect(command.description).toBe('A test command');
      expect(command.directParameter).toBeDefined();
      expect(command.directParameter?.type).toBe('text');
      expect(command.parameters).toHaveLength(1);
      expect(command.parameters[0].name).toBe('with option');
      expect(command.parameters[0].optional).toBe(true);
      expect(command.result).toBeDefined();
      expect(command.result?.type).toBe('integer');
    });

    it('should parse classes correctly', () => {
      const dictionary = parseSdef(mockSdefXml);
      const testSuite = dictionary.suites[0];

      expect(testSuite.classes).toHaveLength(2);
      const testClass = testSuite.classes[0];
      expect(testClass.name).toBe('test class');
      expect(testClass.code).toBe('tcls');
      expect(testClass.description).toBe('A test class');
      expect(testClass.plural).toBe('test classes');
      expect(testClass.properties).toHaveLength(2);
      expect(testClass.elements).toHaveLength(1);
    });

    it('should parse properties correctly', () => {
      const dictionary = parseSdef(mockSdefXml);
      const testClass = dictionary.suites[0].classes[0];

      expect(testClass.properties[0].name).toBe('test property');
      expect(testClass.properties[0].code).toBe('tprp');
      expect(testClass.properties[0].type.type).toBe('text');
      expect(testClass.properties[0].access).toBe('rw');
      expect(testClass.properties[1].access).toBe('r');
    });

    it('should parse enumerations correctly', () => {
      const dictionary = parseSdef(mockSdefXml);
      const testSuite = dictionary.suites[0];

      expect(testSuite.enumerations).toHaveLength(1);
      const enumeration = testSuite.enumerations[0];
      expect(enumeration.name).toBe('test enum');
      expect(enumeration.code).toBe('tenu');
      expect(enumeration.enumerators).toHaveLength(2);
      expect(enumeration.enumerators[0].name).toBe('value one');
      expect(enumeration.enumerators[0].code).toBe('val1');
    });

    it('should handle class inheritance', () => {
      const dictionary = parseSdef(mockSdefXml);
      const childClass = dictionary.suites[0].classes[1];

      expect(childClass.name).toBe('child class');
      expect(childClass.inherits).toBe('test class');
    });

    it('should handle multiple suites', () => {
      const dictionary = parseSdef(mockSdefXml);

      expect(dictionary.suites).toHaveLength(2);
      expect(dictionary.suites[1].name).toBe('Another Suite');
      expect(dictionary.suites[1].commands).toHaveLength(1);
      expect(dictionary.suites[1].classes).toHaveLength(1);
    });

    it('should throw error for invalid XML', () => {
      expect(() => parseSdef('<invalid>xml</invalid>')).toThrow('Invalid sdef XML');
    });
  });

  describe('getApplicationDictionary', () => {
    it('should get and parse sdef for an application', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, { stdout: mockSdefXml, stderr: '' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      const dictionary = await getApplicationDictionary('/System/Applications/Test.app');

      expect(dictionary.suites).toHaveLength(2);
      expect(mockExec).toHaveBeenCalledWith(
        'sdef "/System/Applications/Test.app"',
        expect.any(Function),
      );
    });

    it('should cache results by default', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, { stdout: mockSdefXml, stderr: '' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      const appPath = '/System/Applications/Test.app';

      // First call
      await getApplicationDictionary(appPath);
      expect(mockExec).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await getApplicationDictionary(appPath);
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when useCache is false', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, { stdout: mockSdefXml, stderr: '' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      const appPath = '/System/Applications/Test.app';

      // First call
      await getApplicationDictionary(appPath, false);
      expect(mockExec).toHaveBeenCalledTimes(1);

      // Second call with useCache=false should not use cache
      await getApplicationDictionary(appPath, false);
      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearSdefCache', () => {
    it('should clear the cache', async () => {
      const mockExec = vi.mocked(exec);

      mockExec.mockImplementation((cmd, callback: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, { stdout: mockSdefXml, stderr: '' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {} as any;
      });

      const appPath = '/System/Applications/Test.app';

      // First call
      await getApplicationDictionary(appPath);
      expect(mockExec).toHaveBeenCalledTimes(1);

      // Clear cache
      clearSdefCache();

      // Second call should not use cache
      await getApplicationDictionary(appPath);
      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllCommands', () => {
    it('should return all commands from all suites', () => {
      const dictionary = parseSdef(mockSdefXml);
      const commands = getAllCommands(dictionary);

      expect(commands).toHaveLength(2);
      expect(commands[0].name).toBe('test command');
      expect(commands[1].name).toBe('another command');
    });
  });

  describe('getAllClasses', () => {
    it('should return all classes from all suites', () => {
      const dictionary = parseSdef(mockSdefXml);
      const classes = getAllClasses(dictionary);

      expect(classes).toHaveLength(3);
      expect(classes[0].name).toBe('test class');
      expect(classes[1].name).toBe('child class');
      expect(classes[2].name).toBe('another class');
    });
  });

  describe('findCommand', () => {
    it('should find a command by name', () => {
      const dictionary = parseSdef(mockSdefXml);
      const command = findCommand(dictionary, 'test command');

      expect(command).toBeDefined();
      expect(command?.name).toBe('test command');
      expect(command?.code).toBe('tstc');
    });

    it('should find commands in any suite', () => {
      const dictionary = parseSdef(mockSdefXml);
      const command = findCommand(dictionary, 'another command');

      expect(command).toBeDefined();
      expect(command?.name).toBe('another command');
    });

    it('should return undefined for non-existent command', () => {
      const dictionary = parseSdef(mockSdefXml);
      const command = findCommand(dictionary, 'nonexistent');

      expect(command).toBeUndefined();
    });
  });

  describe('findClass', () => {
    it('should find a class by name', () => {
      const dictionary = parseSdef(mockSdefXml);
      const cls = findClass(dictionary, 'test class');

      expect(cls).toBeDefined();
      expect(cls?.name).toBe('test class');
      expect(cls?.code).toBe('tcls');
    });

    it('should find classes in any suite', () => {
      const dictionary = parseSdef(mockSdefXml);
      const cls = findClass(dictionary, 'another class');

      expect(cls).toBeDefined();
      expect(cls?.name).toBe('another class');
    });

    it('should return undefined for non-existent class', () => {
      const dictionary = parseSdef(mockSdefXml);
      const cls = findClass(dictionary, 'nonexistent');

      expect(cls).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty suites', () => {
      const emptySdef = `<?xml version="1.0" encoding="UTF-8"?>
<dictionary>
  <suite name="Empty Suite" code="empt" description="An empty suite">
  </suite>
</dictionary>`;

      const dictionary = parseSdef(emptySdef);
      expect(dictionary.suites).toHaveLength(1);
      expect(dictionary.suites[0].commands).toHaveLength(0);
      expect(dictionary.suites[0].classes).toHaveLength(0);
      expect(dictionary.suites[0].enumerations).toHaveLength(0);
    });

    it('should handle commands without parameters', () => {
      const simpleSdef = `<?xml version="1.0" encoding="UTF-8"?>
<dictionary>
  <suite name="Simple Suite" code="simp">
    <command name="simple command" code="simc" description="A simple command"/>
  </suite>
</dictionary>`;

      const dictionary = parseSdef(simpleSdef);
      const command = dictionary.suites[0].commands[0];
      expect(command.parameters).toHaveLength(0);
      expect(command.directParameter).toBeUndefined();
      expect(command.result).toBeUndefined();
    });

    it('should handle classes without properties or elements', () => {
      const simpleSdef = `<?xml version="1.0" encoding="UTF-8"?>
<dictionary>
  <suite name="Simple Suite" code="simp">
    <class name="simple class" code="sicl" description="A simple class"/>
  </suite>
</dictionary>`;

      const dictionary = parseSdef(simpleSdef);
      const cls = dictionary.suites[0].classes[0];
      expect(cls.properties).toHaveLength(0);
      expect(cls.elements).toHaveLength(0);
    });
  });
});
