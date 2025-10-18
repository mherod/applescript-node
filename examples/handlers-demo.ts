import { createScript, runScript } from 'applescript-node';

/**
 * Comprehensive demonstration of AppleScript handler functionality
 * Based on Apple's documentation: https://developer.apple.com/library/archive/documentation/LanguagesUtilities/Conceptual/MacAutomationScriptingGuide/UseHandlersFunctions.html
 */

function basicHandlers() {
  console.log('=== Basic Handler Examples ===');

  // Simple handler with no parameters
  const simpleHandler = createScript()
    .on('sayHello')
    .displayDialog('Hello World!')
    .endon()
    .callHandler('sayHello')
    .build();

  console.log('Simple Handler:');
  console.log(simpleHandler);
  console.log();

  // Handler with parameters
  const parameterHandler = createScript()
    .on('sayHello', ['name'])
    .displayDialog('Hello name')
    .endon()
    .callHandler('sayHello', ['"John"'])
    .build();

  console.log('Handler with Parameters:');
  console.log(parameterHandler);
  console.log();

  // Handler with multiple parameters
  const multiParamHandler = createScript()
    .on('displayError', ['message', 'buttons'])
    .displayDialog('message', { buttons: ['buttons'] })
    .endon()
    .callHandler('displayError', ['"An error occurred"', '{"OK", "Cancel"}'])
    .build();

  console.log('Handler with Multiple Parameters:');
  console.log(multiParamHandler);
  console.log();
}

function handlerSyntaxVariations() {
  console.log('=== Handler Syntax Variations ===');

  // Using 'to' syntax instead of 'on'
  const toSyntaxHandler = createScript()
    .to('sayHello', ['name'])
    .displayDialog('Hello name')
    .endto()
    .callHandler('sayHello', ['"Jane"'])
    .build();

  console.log('Handler with "to" syntax:');
  console.log(toSyntaxHandler);
  console.log();

  // Labeled parameters (interleaved syntax)
  const labeledHandler = createScript()
    .onLabeled('displayError', { message: 'theErrorMessage', buttons: 'theButtons' })
    .displayDialog('theErrorMessage', { buttons: ['theButtons'] })
    .endon()
    .callHandler('displayError', ['"Error message"', '{"OK"}'])
    .build();

  console.log('Handler with Labeled Parameters:');
  console.log(labeledHandler);
  console.log();
}

function handlersInTellBlocks() {
  console.log('=== Handlers Called from Tell Blocks ===');

  // Handler called using 'my' keyword
  const myHandler = createScript()
    .on('processFile', ['theFile'])
    .displayDialog('Processing: theFile')
    .endon()
    .tell('Finder')
    .my('processFile', ['theFile'])
    .endtell()
    .build();

  console.log('Handler called with "my" keyword:');
  console.log(myHandler);
  console.log();

  // Handler called using 'of me' syntax
  const ofMeHandler = createScript()
    .on('processFile', ['theFile'])
    .displayDialog('Processing: theFile')
    .endon()
    .tell('Finder')
    .ofMe('processFile', ['theFile'])
    .endtell()
    .build();

  console.log('Handler called with "of me" syntax:');
  console.log(ofMeHandler);
  console.log();
}

function eventHandlers() {
  console.log('=== Event Handlers ===');

  // Run handler (explicit)
  const runHandler = createScript()
    .runHandler(true)
    .displayDialog('Script is running!')
    .endrun()
    .build();

  console.log('Explicit Run Handler:');
  console.log(runHandler);
  console.log();

  // Quit handler
  const quitHandler = createScript()
    .quitHandler()
    .displayDialog('Script is quitting!')
    .endquit()
    .build();

  console.log('Quit Handler:');
  console.log(quitHandler);
  console.log();

  // Open handler (drag-and-drop support)
  const openHandler = createScript()
    .openHandler('theDroppedItems')
    .repeatWith('aFile', 'theDroppedItems')
    .log('Processing file')
    .endrepeat()
    .endopen()
    .build();

  console.log('Open Handler (Drag-and-Drop):');
  console.log(openHandler);
  console.log();

  // Idle handler (stay-open applications)
  const idleHandler = createScript()
    .idleHandler(5)
    .displayDialog('Idle processing...')
    .return(5) // Return 5 seconds for next idle call
    .endidle()
    .build();

  console.log('Idle Handler (Stay-Open App):');
  console.log(idleHandler);
  console.log();
}

function handlersWithReturnValues() {
  console.log('=== Handlers with Return Values ===');

  // Handler that returns a calculated value
  const calculatorHandler = createScript()
    .on('calculateSum', ['a', 'b'])
    .set('result', 'a + b')
    .return('result')
    .endon()
    .set('sum', 'calculateSum(5, 3)')
    .log('Calculation complete')
    .build();

  console.log('Handler with Return Value:');
  console.log(calculatorHandler);
  console.log();

  // Handler with conditional return
  const conditionalHandler = createScript()
    .on('isEven', ['number'])
    .if('number mod 2 = 0')
    .thenBlock()
    .return('true')
    .else()
    .return('false')
    .endif()
    .endon()
    .set('isEvenResult', 'isEven(4)')
    .log('Even check complete')
    .build();

  console.log('Handler with Conditional Return:');
  console.log(conditionalHandler);
  console.log();
}

function complexHandlerExample() {
  console.log('=== Complex Handler Example ===');

  // A complete script with multiple handlers and error handling
  const complexScript = createScript()
    // Define a utility handler
    .on('safeDivide', ['numerator', 'denominator'])
    .try()
    .set('result', 'numerator / denominator')
    .onError('errorMessage')
    .displayDialog('Division error: errorMessage')
    .set('result', '0')
    .endtry()
    .return('result')
    .endon()
    // Define a main processing handler
    .on('processNumbers', ['numbers'])
    .set('results', '[]')
    .repeatWith('aNumber', 'numbers')
    .set('half', 'safeDivide(aNumber, 2)')
    .setEndRecord('results', { original: 'aNumber', half: 'half' })
    .endrepeat()
    .return('results')
    .endon()
    // Main script logic
    .set('inputNumbers', '[10, 20, 0, 30]')
    .set('processedResults', 'processNumbers(inputNumbers)')
    .displayDialog('Processing complete!')
    .build();

  console.log('Complex Handler Example:');
  console.log(complexScript);
  console.log();
}

function stayOpenApplication() {
  console.log('=== Stay-Open Application Example ===');

  // A complete stay-open application with all event handlers
  const stayOpenApp = createScript()
    .runHandler(true)
    .displayDialog('Stay-Open Application Started!')
    .endrun()
    .openHandler('theDroppedFiles')
    .log('Files dropped')
    .endopen()
    .idleHandler(30)
    .displayDialog('Idle check - application is still running')
    .return(30) // Check again in 30 seconds
    .endidle()
    .quitHandler()
    .displayDialog('Application is quitting!')
    .endquit()
    .build();

  console.log('Stay-Open Application:');
  console.log(stayOpenApp);
  console.log();
}

async function main() {
  console.log('AppleScript Handler Demonstration');
  console.log('==================================\n');

  basicHandlers();
  handlerSyntaxVariations();
  handlersInTellBlocks();
  eventHandlers();
  handlersWithReturnValues();
  complexHandlerExample();
  stayOpenApplication();

  console.log('=== Running a Simple Handler Example ===');

  // Run a simple example to demonstrate execution
  const simpleExample = createScript()
    .on('greet', ['name'])
    .return('"Hello, " & name & "!"')
    .endon()
    .set('greeting', 'greet("World")')
    .returnRaw('greeting')
    .build();

  try {
    const result = await runScript(simpleExample);
    console.log('Execution result:', result);
  } catch (error) {
    console.error('Error running script:', error);
  }
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
