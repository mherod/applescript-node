import { writeFileSync } from 'node:fs';
import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import { createScript, runScript, ScriptValidator } from '../src/index.js';

async function demonstrateContactsAutomation() {
  console.log(chalk.bold.blue('📇 Contacts.app - Automation Demo\n'));
  console.log(chalk.gray('Demonstrates Contacts.app scripting with validation.\n'));

  // Create validator for Contacts.app
  console.log(chalk.yellow('🔍 Loading Contacts.app scripting dictionary...'));
  const validator = await ScriptValidator.forApplication('/System/Applications/Contacts.app');
  console.log(chalk.green('✓ Validator ready\n'));

  // Show available capabilities
  const commands = validator.getAvailableCommands();
  const classes = validator.getAvailableClasses();
  console.log(chalk.gray(`Available: ${commands.length} commands, ${classes.length} classes\n`));

  // Activate Contacts.app
  console.log(chalk.yellow('Opening Contacts.app...'));
  const activateScript = createScript().tell('Contacts').activate().delay(1).end();

  const activateValidation = validator.validate(activateScript.build());
  if (!activateValidation.valid) {
    console.log(chalk.red('✗ Script validation failed:'));
    activateValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
    return;
  }

  await runScript(activateScript);
  console.log(chalk.green('✓ Contacts.app opened\n'));

  // Get total contact count first
  console.log(chalk.yellow('📊 Gathering contact statistics...'));
  const statsScript = createScript()
    .tell('Contacts')
    .setCountOf('totalContacts', 'every person')
    .returnRaw('totalContacts')
    .end();

  const statsResult = await runScript(statsScript);
  const totalContacts = statsResult.success ? Number.parseInt(String(statsResult.output)) : 0;

  console.log(chalk.white(`Total contacts in Contacts.app: ${chalk.yellow(totalContacts)}\n`));

  // Determine how many contacts to fetch (up to 50)
  const contactsToFetch = Math.min(totalContacts, 50);
  if (contactsToFetch === 0) {
    console.log(chalk.yellow('No contacts found in Contacts.app\n'));
  } else {
    console.log(
      chalk.yellow(
        `📋 Fetching ${contactsToFetch === 50 ? 'first 50' : 'all'} contacts (${contactsToFetch} total)...`,
      ),
    );

    const contactsScript = createScript()
      .tell('Contacts')
      .set('contactsList', [])
      .set('counter', 0)
      // Use forEachUntil for cleaner iteration with built-in break condition
      .forEachUntil(
        'aPerson',
        'every person',
        (e) => e.gt('counter', contactsToFetch),
        (b) =>
          b
            .increment('counter')
            // Use tryCatch with fluent chaining in callback
            .tryCatch(
              (tryBlock) =>
                tryBlock
                  .setExpression('personFirstName', 'first name of aPerson')
                  .setExpression('personLastName', 'last name of aPerson')
                  .setExpression('personOrganization', 'organization of aPerson')
                  .setExpression('personJobTitle', 'job title of aPerson')
                  .setExpression('personCompany', 'company of aPerson')
                  .ifThenElse(
                    (e) => e.gt(e.count('emails of aPerson'), 0),
                    (then_) =>
                      then_.setExpression('personEmail', 'value of item 1 of emails of aPerson'),
                    (else_) => else_.setExpression('personEmail', '"missing value"'),
                  )
                  .ifThenElse(
                    (e) => e.gt(e.count('phones of aPerson'), 0),
                    (then_) =>
                      then_.setExpression('personPhone', 'value of item 1 of phones of aPerson'),
                    (else_) => else_.setExpression('personPhone', '"missing value"'),
                  )
                  .ifThenElse(
                    (e) => e.exists('birth date of aPerson'),
                    (then_) =>
                      then_.setExpression('personBirthday', 'birth date of aPerson as string'),
                    (else_) => else_.setExpression('personBirthday', '"missing value"'),
                  )
                  .setEndRecord('contactsList', {
                    id: 'id of aPerson',
                    name: 'name of aPerson',
                    firstName: 'personFirstName',
                    lastName: 'personLastName',
                    organization: 'personOrganization',
                    jobTitle: 'personJobTitle',
                    email: 'personEmail',
                    phone: 'personPhone',
                    birthday: 'personBirthday',
                    isCompany: 'personCompany',
                  }),
              (catchBlock) => catchBlock.comment('Skip contacts with errors'),
            ),
      )
      .returnRaw('contactsList')
      .endtell();

    // Write generated script to output directory
    writeFileSync('examples/output/contacts-list.applescript', contactsScript.build());

    console.log(chalk.gray('Validating script...'));
    const contactsValidation = validator.validate(contactsScript.build());
    if (contactsValidation.warnings.length > 0) {
      console.log(chalk.yellow(`⚠ ${contactsValidation.warnings.length} validation warnings`));
    }

    const contactsResult = await runScript(contactsScript);

    if (contactsResult.success && contactsResult.output) {
      const output = String(contactsResult.output);

      if (output && output !== '') {
        console.log(chalk.bold('\n📋 Contacts:\n'));

        const contactsTable = new CliTable3({
          head: [
            chalk.cyan('#'),
            chalk.cyan('Name'),
            chalk.cyan('Email'),
            chalk.cyan('Phone'),
            chalk.cyan('Organization'),
          ],
          colWidths: [5, 25, 30, 20, 25],
          wordWrap: true,
          style: { head: [], border: [] },
        });

        const contactRecords = output.split('id:').slice(1);
        let companyCount = 0;
        let emailCount = 0;
        let phoneCount = 0;
        let birthdayCount = 0;

        contactRecords.forEach((record, index) => {
          const nameMatch = /name:"?([^",}]+)"?/.exec(record);
          const emailMatch = /email:"?([^",}]+)"?/.exec(record);
          const phoneMatch = /phone:"?([^",}]+)"?/.exec(record);
          const organizationMatch = /organization:"?([^",}]+)"?/.exec(record);
          const companyMatch = /isCompany:(true|false)/.exec(record);
          const birthdayMatch = /birthday:/.exec(record);

          if (nameMatch) {
            const name = nameMatch[1].trim().replace(/^"|"$/g, '');
            const email = emailMatch ? emailMatch[1].trim().replace(/^"|"$/g, '') : '';
            const phone = phoneMatch ? phoneMatch[1].trim().replace(/^"|"$/g, '') : '';
            const organization = organizationMatch
              ? organizationMatch[1].trim().replace(/^"|"$/g, '')
              : '';
            const isCompany = companyMatch ? companyMatch[1] === 'true' : false;

            if (isCompany) companyCount++;
            if (email) emailCount++;
            if (phone) phoneCount++;
            if (birthdayMatch) birthdayCount++;

            contactsTable.push([
              chalk.gray((index + 1).toString()),
              chalk.white(name || 'Untitled'),
              email ? chalk.blue(email) : chalk.gray('-'),
              phone ? chalk.green(phone) : chalk.gray('-'),
              organization ? chalk.yellow(organization) : chalk.gray('-'),
            ]);
          }
        });

        console.log(contactsTable.toString());

        // Show statistics
        console.log(chalk.bold('\n📊 Contact Statistics:\n'));
        const statsTable = new CliTable3({
          head: [chalk.cyan('Metric'), chalk.cyan('Count'), chalk.cyan('Percentage')],
          style: { head: [], border: [] },
          colWidths: [25, 10, 15],
        });

        const displayedContacts = contactRecords.length;
        statsTable.push(
          [chalk.white('Total Contacts in App'), chalk.yellow(totalContacts), chalk.gray('100%')],
          [
            chalk.white('Contacts Displayed'),
            chalk.yellow(displayedContacts),
            chalk.gray(`${Math.round((displayedContacts / totalContacts) * 100)}%`),
          ],
          [
            chalk.white('Contacts with Email'),
            chalk.blue(emailCount),
            chalk.gray(`${Math.round((emailCount / displayedContacts) * 100)}%`),
          ],
          [
            chalk.white('Contacts with Phone'),
            chalk.green(phoneCount),
            chalk.gray(`${Math.round((phoneCount / displayedContacts) * 100)}%`),
          ],
          [chalk.white('Company Entries'), chalk.cyan(companyCount), chalk.gray('—')],
          [chalk.white('Birthdays'), chalk.magenta(birthdayCount), chalk.gray('—')],
        );

        console.log(statsTable.toString());

        if (totalContacts > contactsToFetch) {
          console.log(
            chalk.gray(
              `\n(Showing first ${contactsToFetch} of ${totalContacts} contacts. Modify contactsToFetch to see more.)`,
            ),
          );
        }
      } else {
        console.log(chalk.yellow('\nNo contact data returned\n'));
      }
    } else {
      console.error(chalk.red('Error getting contacts:'), contactsResult.error);
    }
  }

  // Create a new contact example (commented out to avoid creating test contacts)
  console.log(chalk.bold.yellow('\n\n💡 Create Contact Example:'));
  const createContactScript = createScript()
    .tell('Contacts')
    .raw(
      'make new person with properties {first name:"John", last name:"Doe", organization:"ACME Corp"}',
    )
    .end();

  // Write generated script to output directory
  writeFileSync('examples/output/contacts-create.applescript', createContactScript.build());

  console.log(chalk.gray('\nScript to create a contact:'));
  console.log(chalk.dim(createContactScript.build()));

  const createValidation = validator.validate(createContactScript.build());
  if (createValidation.valid) {
    console.log(chalk.green('\n✓ Script is valid'));
  } else {
    console.log(chalk.red('\n✗ Script has errors:'));
    createValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
  }

  console.log(chalk.gray('\n(Note: Commented out to avoid creating test contacts)'));

  // Show capabilities summary
  console.log(chalk.bold.cyan('\n\n💾 Contacts.app Scripting Capabilities:'));
  console.log(chalk.gray('✓ List all contacts and companies'));
  console.log(chalk.gray('✓ Access contact details (name, email, phone, addresses)'));
  console.log(chalk.gray('✓ Read organisation and job title information'));
  console.log(chalk.gray('✓ Access birth dates and custom date fields'));
  console.log(chalk.gray('✓ Export contact information as vCard format'));
  console.log(chalk.gray('✓ Create new contacts with properties'));
  console.log(chalk.gray('✓ Work with contact groups'));
  console.log(chalk.gray('✓ Read notes and additional information'));
  console.log(chalk.gray('✓ Handle multiple email/phone addresses per contact'));
  console.log(chalk.gray('✗ Cannot directly modify existing contact details'));
  console.log(chalk.gray('✗ Cannot delete contacts via AppleScript (security restriction)'));

  // Validation Benefits Summary
  console.log(chalk.bold.green('\n\n✅ Validation Benefits Demonstrated:'));
  console.log(chalk.gray('• Pre-execution validation prevented potential errors'));
  console.log(chalk.gray('• Discovered available commands and classes'));
  console.log(chalk.gray('• Validated property access for each contact field'));
  console.log(chalk.gray('• Core AppleScript keywords correctly ignored'));
  console.log(chalk.gray('• Validation adds minimal overhead but prevents runtime failures\n'));

  // Close Contacts.app
  console.log(chalk.yellow('\n\nClosing Contacts.app...'));
  const quitScript = createScript().tell('Contacts').quit().end();
  await runScript(quitScript);
  console.log(chalk.green('✓ Contacts.app closed'));

  console.log(chalk.bold.green('\n✓ Contacts.app automation demo complete!\n'));
}

// Run the demonstration
demonstrateContactsAutomation().catch(console.error);
