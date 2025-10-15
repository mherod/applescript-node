import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSdef, getAllCommands, getAllClasses, findCommand, findClass } from './sdef.js';

/**
 * Integration tests for sdef parsing using real application dictionaries
 * These tests verify that the parser correctly handles real-world sdef XML
 */

describe('sdef integration tests with real fixtures', () => {
  describe('Messages.app', () => {
    it('should parse Messages.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Messages.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      // Messages app should have common commands
      const commands = getAllCommands(dictionary);
      expect(commands.length).toBeGreaterThan(0);

      // Should have a 'send' command
      const sendCommand = findCommand(dictionary, 'send');
      expect(sendCommand).toBeDefined();
      expect(sendCommand?.name).toBe('send');
    });

    it('should find chat class in Messages.app', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Messages.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      const chatClass = findClass(dictionary, 'chat');
      expect(chatClass).toBeDefined();
      expect(chatClass?.name).toBe('chat');
      expect(chatClass?.properties.length).toBeGreaterThan(0);
    });
  });

  describe('Finder.app', () => {
    it('should parse Finder.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Finder.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const commands = getAllCommands(dictionary);
      expect(commands.length).toBeGreaterThan(0);

      const classes = getAllClasses(dictionary);
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should find common Finder classes', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Finder.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      // Finder should have file, folder, and window classes
      const fileClass = findClass(dictionary, 'file');
      expect(fileClass).toBeDefined();

      const folderClass = findClass(dictionary, 'folder');
      expect(folderClass).toBeDefined();
    });
  });

  describe('Mail.app', () => {
    it('should parse Mail.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Mail.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const commands = getAllCommands(dictionary);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should find mail-specific classes', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Mail.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      // Mail should have message and mailbox classes
      const messageClass = findClass(dictionary, 'message');
      expect(messageClass).toBeDefined();

      const mailboxClass = findClass(dictionary, 'mailbox');
      expect(mailboxClass).toBeDefined();
    });
  });

  describe('Music.app', () => {
    it('should parse Music.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Music.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const commands = getAllCommands(dictionary);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should find music-specific classes', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Music.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      // Music should have track and playlist classes
      const trackClass = findClass(dictionary, 'track');
      expect(trackClass).toBeDefined();

      const playlistClass = findClass(dictionary, 'playlist');
      expect(playlistClass).toBeDefined();
    });

    it('should find play command', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Music.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      const playCommand = findCommand(dictionary, 'play');
      expect(playCommand).toBeDefined();
      expect(playCommand?.name).toBe('play');
    });
  });

  describe('System Events.app', () => {
    it('should parse System Events sdef correctly (largest fixture)', () => {
      const xml = readFileSync('src/__fixtures__/sdef/SystemEvents.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      // System Events has many suites
      expect(dictionary.suites.length).toBeGreaterThan(5);

      const commands = getAllCommands(dictionary);
      expect(commands.length).toBeGreaterThan(10);

      const classes = getAllClasses(dictionary);
      expect(classes.length).toBeGreaterThan(10);
    });

    it('should find process class in System Events', () => {
      const xml = readFileSync('src/__fixtures__/sdef/SystemEvents.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      const processClass = findClass(dictionary, 'process');
      expect(processClass).toBeDefined();
      expect(processClass?.name).toBe('process');
      expect(processClass?.properties.length).toBeGreaterThan(0);
    });
  });

  describe('Notes.app', () => {
    it('should parse Notes.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Notes.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const noteClass = findClass(dictionary, 'note');
      expect(noteClass).toBeDefined();
    });
  });

  describe('Calendar.app', () => {
    it('should parse Calendar.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Calendar.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const eventClass = findClass(dictionary, 'event');
      expect(eventClass).toBeDefined();
    });
  });

  describe('Reminders.app', () => {
    it('should parse Reminders.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/Reminders.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const reminderClass = findClass(dictionary, 'reminder');
      expect(reminderClass).toBeDefined();
    });
  });

  describe('TextEdit.app', () => {
    it('should parse TextEdit.app sdef correctly', () => {
      const xml = readFileSync('src/__fixtures__/sdef/TextEdit.sdef', 'utf-8');
      const dictionary = parseSdef(xml);

      expect(dictionary.suites.length).toBeGreaterThan(0);

      const documentClass = findClass(dictionary, 'document');
      expect(documentClass).toBeDefined();
    });
  });

  describe('Cross-application patterns', () => {
    it('all apps should have at least one suite', () => {
      const apps = [
        'Messages',
        'Finder',
        'Mail',
        'Music',
        'SystemEvents',
        'Notes',
        'Calendar',
        'Reminders',
        'TextEdit',
      ];

      for (const app of apps) {
        const xml = readFileSync(`src/__fixtures__/sdef/${app}.sdef`, 'utf-8');
        const dictionary = parseSdef(xml);
        expect(dictionary.suites.length).toBeGreaterThan(0);
      }
    });

    it('should handle various suite structures', () => {
      // Test that parser handles different suite configurations
      const systemEventsXml = readFileSync('src/__fixtures__/sdef/SystemEvents.sdef', 'utf-8');
      const systemEventsDict = parseSdef(systemEventsXml);

      const messagesXml = readFileSync('src/__fixtures__/sdef/Messages.sdef', 'utf-8');
      const messagesDict = parseSdef(messagesXml);

      // Both should parse successfully but have different structures
      expect(systemEventsDict.suites.length).toBeGreaterThan(messagesDict.suites.length);
    });

    it('should correctly parse properties with different access levels', () => {
      const finderXml = readFileSync('src/__fixtures__/sdef/Finder.sdef', 'utf-8');
      const dictionary = parseSdef(finderXml);

      const classes = getAllClasses(dictionary);
      const classesWithProps = classes.filter((c) => c.properties.length > 0);

      expect(classesWithProps.length).toBeGreaterThan(0);

      // Should have properties with access levels defined
      const allProps = classesWithProps.flatMap((c) => c.properties);
      expect(allProps.length).toBeGreaterThan(0);

      // Verify properties have valid access levels
      for (const prop of allProps) {
        expect(['r', 'rw']).toContain(prop.access);
      }

      // At minimum, should have read-only properties
      const readOnlyProps = allProps.filter((p) => p.access === 'r');
      expect(readOnlyProps.length).toBeGreaterThan(0);
    });

    it('should correctly parse commands with various parameter configurations', () => {
      const musicXml = readFileSync('src/__fixtures__/sdef/Music.sdef', 'utf-8');
      const dictionary = parseSdef(musicXml);

      const commands = getAllCommands(dictionary);

      // Should have commands with no parameters
      const noParamCommands = commands.filter((c) => c.parameters.length === 0);
      expect(noParamCommands.length).toBeGreaterThan(0);

      // Should have commands with parameters
      const paramCommands = commands.filter((c) => c.parameters.length > 0);
      expect(paramCommands.length).toBeGreaterThan(0);

      // Should have commands with optional parameters
      const optionalParamCommands = commands.filter((c) => c.parameters.some((p) => p.optional));
      expect(optionalParamCommands.length).toBeGreaterThan(0);
    });
  });
});
