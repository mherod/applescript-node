import { describe, expect, it } from 'vitest';
import { createScript } from './index.js';

describe('AppleScriptBuilder - Handler Support', () => {
  describe('Basic Handler Definition', () => {
    it('should create a simple handler with on syntax', () => {
      const script = createScript().on('sayHello').displayDialog('Hello World').endon().build();

      expect(script).toContain('on sayHello');
      expect(script).toContain('display dialog "Hello World"');
      expect(script).toContain('end sayHello');
    });

    it('should create a handler with parameters', () => {
      const script = createScript()
        .on('sayHello', ['name'])
        .displayDialog('Hello from handler')
        .endon()
        .build();

      expect(script).toContain('on sayHello name');
      expect(script).toContain('display dialog "Hello from handler"');
      expect(script).toContain('end sayHello');
    });

    it('should create a handler with multiple parameters', () => {
      const script = createScript()
        .on('displayError', ['message', 'buttons'])
        .log('Handler displayError called')
        .endon()
        .build();

      expect(script).toContain('on displayError message, buttons');
      expect(script).toContain('log "Handler displayError called"');
      expect(script).toContain('end displayError');
    });
  });

  describe('Handler Definition with to Syntax', () => {
    it('should create a handler using to syntax', () => {
      const script = createScript().to('sayHello').displayDialog('Hello World').endto().build();

      expect(script).toContain('to sayHello');
      expect(script).toContain('display dialog "Hello World"');
      expect(script).toContain('end sayHello');
    });

    it('should create a handler with parameters using to syntax', () => {
      const script = createScript()
        .to('sayHello', ['name'])
        .displayDialog('Hello from handler')
        .endto()
        .build();

      expect(script).toContain('to sayHello name');
      expect(script).toContain('display dialog "Hello from handler"');
      expect(script).toContain('end sayHello');
    });
  });

  describe('Handler Invocation', () => {
    it('should call a handler with callHandler', () => {
      const script = createScript().callHandler('sayHello', ['"John"']).build();

      expect(script).toContain('sayHello "John"');
    });

    it('should call a handler with multiple parameters', () => {
      const script = createScript()
        .callHandler('displayError', ['"Error message"', '{"OK", "Cancel"}'])
        .build();

      expect(script).toContain('displayError "Error message", {"OK", "Cancel"}');
    });

    it('should call a handler without parameters', () => {
      const script = createScript().callHandler('sayHello').build();

      expect(script).toContain('sayHello');
    });
  });

  describe('Handler Calls from Tell Blocks', () => {
    it('should call a handler using my keyword', () => {
      const script = createScript().tell('Finder').my('processFile', ['theFile']).endtell().build();

      expect(script).toContain('tell application "Finder"');
      expect(script).toContain('my processFile theFile');
      expect(script).toContain('end tell');
    });

    it('should call a handler using of me syntax', () => {
      const script = createScript()
        .tell('Finder')
        .ofMe('processFile', ['theFile'])
        .endtell()
        .build();

      expect(script).toContain('tell application "Finder"');
      expect(script).toContain('processFile theFile of me');
      expect(script).toContain('end tell');
    });
  });

  describe('Labeled Parameters', () => {
    it('should create a handler with labeled parameters using onLabeled', () => {
      const script = createScript()
        .onLabeled('displayError', { message: 'theErrorMessage', buttons: 'theButtons' })
        .log('Error handler called')
        .endon()
        .build();

      expect(script).toContain('on displayError message theErrorMessage, buttons theButtons');
      expect(script).toContain('log "Error handler called"');
      expect(script).toContain('end displayError');
    });

    it('should create a handler with labeled parameters using toLabeled', () => {
      const script = createScript()
        .toLabeled('displayError', { message: 'theErrorMessage', buttons: 'theButtons' })
        .log('Error handler called')
        .endto()
        .build();

      expect(script).toContain('to displayError message theErrorMessage, buttons theButtons');
      expect(script).toContain('log "Error handler called"');
      expect(script).toContain('end displayError');
    });
  });

  describe('Event Handlers', () => {
    it('should create a run handler (explicit)', () => {
      const script = createScript()
        .runHandler(true)
        .displayDialog('Script is running')
        .endrun()
        .build();

      expect(script).toContain('on run');
      expect(script).toContain('display dialog "Script is running"');
      expect(script).toContain('end run');
    });

    it('should create a quit handler', () => {
      const script = createScript()
        .quitHandler()
        .displayDialog('Script is quitting')
        .endquit()
        .build();

      expect(script).toContain('on quit');
      expect(script).toContain('display dialog "Script is quitting"');
      expect(script).toContain('end quit');
    });

    it('should create an open handler with default parameter', () => {
      const script = createScript()
        .openHandler()
        .repeatWith('aFile', 'theDroppedItems')
        .log('Processing file')
        .endrepeat()
        .endopen()
        .build();

      expect(script).toContain('on open theDroppedItems');
      expect(script).toContain('repeat with aFile in theDroppedItems');
      expect(script).toContain('log "Processing file"');
      expect(script).toContain('end repeat');
      expect(script).toContain('end open');
    });

    it('should create an open handler with custom parameter name', () => {
      const script = createScript()
        .openHandler('theFiles')
        .repeatWith('aFile', 'theFiles')
        .displayDialog('Processing: aFile')
        .endrepeat()
        .endopen()
        .build();

      expect(script).toContain('on open theFiles');
      expect(script).toContain('repeat with aFile in theFiles');
      expect(script).toContain('end open');
    });

    it('should create an idle handler', () => {
      const script = createScript()
        .idleHandler(5)
        .displayDialog('Idle processing')
        .return(5)
        .endidle()
        .build();

      expect(script).toContain('on idle');
      expect(script).toContain('display dialog "Idle processing"');
      expect(script).toContain('return 5');
      expect(script).toContain('end idle');
    });
  });

  describe('Complex Handler Examples', () => {
    it('should create a complete script with multiple handlers', () => {
      const script = createScript()
        .on('sayHello', ['name'])
        .displayDialog('Hello from handler')
        .endon()
        .on('displayError', ['message', 'buttons'])
        .log('Error handler called')
        .endon()
        .callHandler('sayHello', ['"John"'])
        .callHandler('displayError', ['"An error occurred"', '{"OK"}'])
        .build();

      expect(script).toContain('on sayHello name');
      expect(script).toContain('on displayError message, buttons');
      expect(script).toContain('sayHello "John"');
      expect(script).toContain('displayError "An error occurred", {"OK"}');
    });

    it('should create a script with handlers called from tell blocks', () => {
      const script = createScript()
        .on('processFile', ['theFile'])
        .displayDialog('Processing file')
        .endon()
        .tell('Finder')
        .my('processFile', ['theFile'])
        .endtell()
        .build();

      expect(script).toContain('on processFile theFile');
      expect(script).toContain('tell application "Finder"');
      expect(script).toContain('my processFile theFile');
      expect(script).toContain('end tell');
    });

    it('should create a stay-open application with idle handler', () => {
      const script = createScript()
        .runHandler(true)
        .displayDialog('Application started')
        .endrun()
        .idleHandler(10)
        .displayDialog('Idle check')
        .return(10)
        .endidle()
        .build();

      expect(script).toContain('on run');
      expect(script).toContain('on idle');
      expect(script).toContain('return 10');
    });
  });

  describe('Handler Return Values', () => {
    it('should create a handler that returns a value', () => {
      const script = createScript()
        .on('calculateSum', ['a', 'b'])
        .setExpression('result', 'a + b')
        .returnRaw('result')
        .endon()
        .build();

      expect(script).toContain('on calculateSum a, b');
      expect(script).toContain('set result to a + b');
      expect(script).toContain('return result');
      expect(script).toContain('end calculateSum');
    });

    it('should create a handler with conditional return', () => {
      const script = createScript()
        .on('isEven', ['number'])
        .if('number mod 2 = 0')
        .thenBlock()
        .returnRaw('true')
        .else()
        .returnRaw('false')
        .endif()
        .endon()
        .build();

      expect(script).toContain('on isEven number');
      expect(script).toContain('if number mod 2 = 0');
      expect(script).toContain('return true');
      expect(script).toContain('return false');
      expect(script).toContain('end isEven');
    });
  });

  describe('Error Handling in Handlers', () => {
    it('should create a handler with try-catch', () => {
      const script = createScript()
        .on('safeOperation', ['input'])
        .try()
        .setExpression('result', 'input * 2')
        .onError('errorMessage')
        .log('Error occurred')
        .endtry()
        .endon()
        .build();

      expect(script).toContain('on safeOperation input');
      expect(script).toContain('try');
      expect(script).toContain('on error errorMessage');
      expect(script).toContain('end try');
      expect(script).toContain('end safeOperation');
    });
  });
});
