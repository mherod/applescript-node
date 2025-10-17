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
          b.increment('counter').tryCatch(
            (tryBlock) =>
              tryBlock
                // Handle optional email field using first-or-default pattern
                .setFirstOf('personEmail', (e) => e.property('aPerson', 'emails'), 'missing value')
                // Handle optional phone field using first-or-default pattern
                .setFirstOf('personPhone', (e) => e.property('aPerson', 'phones'), 'missing value')
                // Handle optional birthday field using if-exists pattern
                .setIfExists(
                  'personBirthday',
                  (e) => e.property('aPerson', 'birth date'),
                  'missing value',
                  'string',
                )
                // Build contact record (mix of properties and variables)
                .setEndRecord('contactsList', {
                  id: 'id of aPerson',
                  name: 'name of aPerson',
                  firstName: 'first name of aPerson',
                  lastName: 'last name of aPerson',
                  organization: 'organization of aPerson',
                  jobTitle: 'job title of aPerson',
                  email: 'personEmail',
                  phone: 'personPhone',
                  birthday: 'personBirthday',
                  isCompany: 'company of aPerson',
                }),
            (catchBlock) => catchBlock.comment('Skip contacts with errors'),
          ),
      )
      // Return contacts as JSON for clean parsing
      .returnAsJson('contactsList', {
        id: 'id',
        name: 'name',
        firstName: 'firstName',
        lastName: 'lastName',
        organization: 'organization',
        jobTitle: 'jobTitle',
        email: 'email',
        phone: 'phone',
        birthday: 'birthday',
        isCompany: 'isCompany',
      })
      .endtell();

    // Write generated script to output directory
    writeFileSync('examples/output/contacts-list.applescript', contactsScript.build());

    console.log(chalk.gray('Validating script...'));
    const contactsValidation = validator.validate(contactsScript.build());
    if (contactsValidation.warnings.length > 0) {
      console.log(chalk.yellow(`⚠ ${contactsValidation.warnings.length} validation warnings`));
    }

    const contactsResult = await runScript(contactsScript);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime safety check for script execution
    if (contactsResult.success && contactsResult.output) {
      // The output is automatically parsed from JSON by runScript
      const contacts = contactsResult.output;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime safety check for empty arrays
      if (contacts && contacts.length > 0) {
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

        let companyCount = 0;
        let emailCount = 0;
        let phoneCount = 0;
        let birthdayCount = 0;

        contacts.forEach((contact, index) => {
          const name = contact.name || 'Untitled';
          const email = contact.email !== 'missing value' ? contact.email : '';
          const phone = contact.phone !== 'missing value' ? contact.phone : '';
          const organization = contact.organization !== 'missing value' ? contact.organization : '';
          const isCompany = contact.isCompany;

          if (isCompany) companyCount++;
          if (email) emailCount++;
          if (phone) phoneCount++;
          if (contact.birthday !== 'missing value') birthdayCount++;

          contactsTable.push([
            chalk.gray((index + 1).toString()),
            chalk.white(name),
            email ? chalk.blue(email) : chalk.gray('-'),
            phone ? chalk.green(phone) : chalk.gray('-'),
            organization ? chalk.yellow(organization) : chalk.gray('-'),
          ]);
        });

        console.log(contactsTable.toString());

        // Show statistics
        console.log(chalk.bold('\n📊 Contact Statistics:\n'));
        const statsTable = new CliTable3({
          head: [chalk.cyan('Metric'), chalk.cyan('Count'), chalk.cyan('Percentage')],
          style: { head: [], border: [] },
          colWidths: [25, 10, 15],
        });

        const displayedContacts = contacts.length;
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
