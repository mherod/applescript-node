import { writeFileSync } from 'node:fs';
import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import { createScript, runScript } from '../src/index.js';

interface Contact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  phone: string;
}

async function searchContacts(
  searchTerm: string,
  field: 'name' | 'organization' = 'name',
  maxResults = 20,
) {
  console.log(chalk.yellow(`🔍 Searching contacts by ${field}: "${searchTerm}"...\n`));

  const searchExpression = `every person whose ${field} contains "${searchTerm}"`;

  const searchScript = createScript()
    .tell('Contacts')
    // First, get the filtered list of contacts
    .setExpression('matchingPeople', searchExpression)
    .set('results', [])
    .set('counter', 0)
    // Then iterate through the filtered list with limit
    .forEachUntil(
      'aPerson',
      'matchingPeople',
      (e) => e.gte('counter', maxResults),
      (b) =>
        b.increment('counter').tryCatch(
          (tryBlock) =>
            tryBlock
              // Handle optional email field
              .ifThenElse(
                (e) => e.gt(e.count('emails of aPerson'), 0),
                (then_) =>
                  then_.setExpression('personEmail', (e) => e.valueOfItem(1, 'emails of aPerson')),
                (else_) => else_.set('personEmail', 'missing value'),
              )
              // Handle optional phone field using ExprBuilder
              .ifThenElse(
                (e) => e.gt(e.count('phones of aPerson'), 0),
                (then_) =>
                  then_.setExpression('personPhone', (e) => e.valueOfItem(1, 'phones of aPerson')),
                (else_) => else_.set('personPhone', 'missing value'),
              )
              // Build contact record
              .setEndRecord('results', {
                id: 'id of aPerson',
                name: 'name of aPerson',
                firstName: 'first name of aPerson',
                lastName: 'last name of aPerson',
                organization: 'organization of aPerson',
                email: 'personEmail',
                phone: 'personPhone',
              }),
          (catchBlock) => catchBlock.comment('Skip contacts with errors'),
        ),
    )
    // Return as JSON for clean parsing
    .returnAsJson('results', {
      id: 'id',
      name: 'name',
      firstName: 'firstName',
      lastName: 'lastName',
      organization: 'organization',
      email: 'email',
      phone: 'phone',
    })
    .endtell();

  // Write generated script to output directory
  const scriptFilename = `contacts-search-${field}.applescript`;
  writeFileSync(`examples/output/${scriptFilename}`, searchScript.build());
  console.log(chalk.gray(`Generated: examples/output/${scriptFilename}\n`));

  const result = await runScript(searchScript);

  if (!(result.success && result.output)) {
    console.error(chalk.red('Search failed:'), result.error);
    return [];
  }

  const contacts = JSON.parse(String(result.output)) as Contact[];
  return contacts;
}

function displaySearchResults(contacts: Contact[], searchTerm: string, maxResults = 20) {
  if (contacts.length === 0) {
    console.log(chalk.yellow(`No contacts found matching "${searchTerm}"\n`));
    return;
  }

  const limitNote = contacts.length >= maxResults ? ` (limited to ${maxResults})` : '';
  console.log(chalk.green(`✓ Found ${contacts.length} contact(s)${limitNote}\n`));

  const table = new CliTable3({
    head: [
      chalk.cyan('#'),
      chalk.cyan('Name'),
      chalk.cyan('Organization'),
      chalk.cyan('Email'),
      chalk.cyan('Phone'),
    ],
    colWidths: [5, 25, 25, 30, 20],
    wordWrap: true,
    style: { head: [], border: [] },
  });

  contacts.forEach((contact, index) => {
    const name = contact.name || 'Untitled';
    const organization = contact.organization !== 'missing value' ? contact.organization : '';
    const email = contact.email !== 'missing value' ? contact.email : '';
    const phone = contact.phone !== 'missing value' ? contact.phone : '';

    table.push([
      chalk.gray((index + 1).toString()),
      chalk.white(name),
      organization ? chalk.yellow(organization) : chalk.gray('-'),
      email ? chalk.blue(email) : chalk.gray('-'),
      phone ? chalk.green(phone) : chalk.gray('-'),
    ]);
  });

  console.log(table.toString());
  console.log();
}

async function demonstrateContactSearch() {
  console.log(chalk.bold.blue('🔍 Contacts.app - Search Demo\n'));
  console.log(chalk.gray('Demonstrates searching and filtering contacts.\n'));

  // Example 1: Search by name
  console.log(chalk.bold.cyan('Example 1: Search by Name\n'));
  const nameResults = await searchContacts('Smith', 'name');
  displaySearchResults(nameResults, 'Smith');

  // Example 2: Search by organization
  console.log(chalk.bold.cyan('Example 2: Search by Organization\n'));
  const orgResults = await searchContacts('Google', 'organization');
  displaySearchResults(orgResults, 'Google');

  // Example 3: Advanced search with multiple criteria
  console.log(chalk.bold.cyan('Example 3: Advanced Search (Name AND Organization)\n'));
  console.log(chalk.yellow('🔍 Searching for "John" at "UNiDAYS"...\n'));

  const advancedScript = createScript()
    .tell('Contacts')
    .setExpression(
      'matchingPeople',
      'every person whose name contains "John" and organization contains "UNiDAYS"',
    )
    .set('results', [])
    .set('counter', 0)
    .forEachUntil(
      'aPerson',
      'matchingPeople',
      (e) => e.gte('counter', 10),
      (b) =>
        b.increment('counter').tryCatch(
          (tryBlock) =>
            tryBlock
              .ifThenElse(
                (e) => e.gt(e.count('emails of aPerson'), 0),
                (then_) =>
                  then_.setExpression('personEmail', (e) => e.valueOfItem(1, 'emails of aPerson')),
                (else_) => else_.set('personEmail', 'missing value'),
              )
              .setEndRecord('results', {
                name: 'name of aPerson',
                organization: 'organization of aPerson',
                jobTitle: 'job title of aPerson',
                email: 'personEmail',
              }),
          (catchBlock) => catchBlock.comment('Skip contacts with errors'),
        ),
    )
    .returnAsJson('results', {
      name: 'name',
      organization: 'organization',
      jobTitle: 'jobTitle',
      email: 'email',
    })
    .endtell();

  writeFileSync('examples/output/contacts-search-advanced.applescript', advancedScript.build());
  console.log(chalk.gray('Generated: examples/output/contacts-search-advanced.applescript\n'));

  const advancedResult = await runScript(advancedScript);

  if (advancedResult.success && advancedResult.output) {
    const advancedContacts = JSON.parse(String(advancedResult.output)) as Array<{
      name: string;
      organization: string;
      jobTitle: string;
      email: string;
    }>;

    if (advancedContacts.length === 0) {
      console.log(chalk.yellow('No contacts found matching both criteria\n'));
    } else {
      console.log(chalk.green(`✓ Found ${advancedContacts.length} contact(s)\n`));

      const advancedTable = new CliTable3({
        head: [chalk.cyan('#'), chalk.cyan('Name'), chalk.cyan('Job Title'), chalk.cyan('Email')],
        colWidths: [5, 25, 25, 35],
        wordWrap: true,
        style: { head: [], border: [] },
      });

      advancedContacts.forEach((contact, index) => {
        advancedTable.push([
          chalk.gray((index + 1).toString()),
          chalk.white(contact.name),
          contact.jobTitle !== 'missing value' ? chalk.cyan(contact.jobTitle) : chalk.gray('-'),
          contact.email !== 'missing value' ? chalk.blue(contact.email) : chalk.gray('-'),
        ]);
      });

      console.log(advancedTable.toString());
      console.log();
    }
  }

  // Show search capabilities
  console.log(chalk.bold.green('\n✅ Search Capabilities:\n'));
  console.log(chalk.gray('✓ Search by name (first name, last name, or full name)'));
  console.log(chalk.gray('✓ Search by organization'));
  console.log(chalk.gray('✓ Search by job title'));
  console.log(chalk.gray('✓ Search by nickname'));
  console.log(chalk.gray('✓ Combine multiple criteria with AND/OR'));
  console.log(chalk.gray('✓ Use "contains", "starts with", "ends with" operators'));
  console.log(chalk.gray('✓ Filter by properties (e.g., has email, has phone)'));

  console.log(chalk.bold.blue('\n💡 Search Syntax Examples:\n'));
  console.log(chalk.dim('  every person whose name contains "Smith"'));
  console.log(chalk.dim('  every person whose organization contains "Apple"'));
  console.log(
    chalk.dim('  every person whose name contains "John" and organization contains "Google"'),
  );
  console.log(chalk.dim('  every person whose emails ≠ {} -- contacts with email addresses'));

  console.log(chalk.bold.green('\n✓ Contact search demo complete!\n'));
}

// Run the demonstration
demonstrateContactSearch().catch(console.error);
