import { createScript, runScript } from 'applescript-node';

/**
 * Deep dive into UI element details to find where process names are stored
 */

async function exploreElementDetails() {
  console.log('Creating element detail exploration script...\n');

  const exploreScript = createScript()
    .tell('Activity Monitor')
    .activate()
    .delay(1.5)
    .endtell()
    .tellProcess('Activity Monitor')
    .tellTarget('window 1')
    .tellTarget('group 1')
    .tellTarget('scroll area 1')
    .tellTarget('outline 1')
    .comment('Focus on first row elements')
    .set('report', '"=== ROW 1 ELEMENT DETAILS ===" & linefeed & linefeed')
    .repeatWithRange('j', 1, 10)
    .tryCatchError(
      (tryB) =>
        tryB
          .appendTo('report', '"ELEMENT " & j & ":" & linefeed')
          .comment('Get class')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('elemClass', (e) => e.property('UI element j of row 1', 'class'))
                .appendTo('report', '"  Class: " & elemClass & linefeed'),
            (innerCatch) => innerCatch.appendTo('report', '"  Class: (unknown)" & linefeed'),
          )
          .comment('Get role')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('elemRole', (e) => e.property('UI element j of row 1', 'role'))
                .appendTo('report', '"  Role: " & elemRole & linefeed'),
            (innerCatch) => innerCatch.appendTo('report', '"  Role: (unknown)" & linefeed'),
          )
          .comment('Get role description')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('elemRoleDesc', 'role description of UI element j of row 1')
                .appendTo('report', '"  Role Desc: " & elemRoleDesc & linefeed'),
            (innerCatch) => innerCatch.appendTo('report', '"  Role Desc: (unknown)" & linefeed'),
          )
          .comment('Get value')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('elemValue', (e) => e.property('UI element j of row 1', 'value'))
                .ifThenElse(
                  (e) => e.ne('elemValue', 'missing value'),
                  (thenB) => thenB.appendTo('report', '"  Value: " & elemValue & linefeed'),
                  (elseB) => elseB.appendTo('report', '"  Value: missing value" & linefeed'),
                ),
            (innerCatch) => innerCatch.appendTo('report', '"  Value: (error)" & linefeed'),
          )
          .comment('Get title')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('elemTitle', (e) => e.property('UI element j of row 1', 'title'))
                .appendTo('report', '"  Title: " & elemTitle & linefeed'),
            (innerCatch) => innerCatch.appendTo('report', '"  Title: (none)" & linefeed'),
          )
          .comment('Check if its a text field or static text')
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('textFieldCount', (e) =>
                  e.count('text fields of UI element j of row 1'),
                )
                .ifThen(
                  (e) => e.gt('textFieldCount', 0),
                  (thenB) =>
                    thenB
                      .setExpression('tfValue', 'value of text field 1 of UI element j of row 1')
                      .appendTo('report', '"  Text Field Value: " & tfValue & linefeed'),
                ),
            (innerCatch) => innerCatch.comment('skip'),
          )
          .tryCatch(
            (innerTry) =>
              innerTry
                .setExpression('staticTextCount', (e) =>
                  e.count('static texts of UI element j of row 1'),
                )
                .ifThen(
                  (e) => e.gt('staticTextCount', 0),
                  (thenB) =>
                    thenB
                      .setExpression('stValue', 'value of static text 1 of UI element j of row 1')
                      .appendTo('report', '"  Static Text Value: " & stValue & linefeed'),
                ),
            (innerCatch) => innerCatch.comment('skip'),
          )
          .appendTo('report', 'linefeed'),
      'errMsg',
      (catchB) => catchB.appendTo('report', '"ERROR: " & errMsg & linefeed & linefeed'),
    )
    .endrepeat()
    .returnRaw('report')
    .endtell()
    .endtell()
    .endtell()
    .endtell()
    .endtell()
    .build();

  console.log('Executing element detail exploration...\n');
  try {
    const result = await runScript<string>(exploreScript);

    if (result.success && result.output) {
      console.log('Element Details:');
      console.log('='.repeat(80));
      console.log(result.output);
      console.log('='.repeat(80));
    } else {
      console.error('Error:', result.error);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

exploreElementDetails();
