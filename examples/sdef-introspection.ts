import CliTable3 from 'cli-table3';
import chalk from 'chalk';
import {
  getApplicationDictionary,
  getAllCommands,
  getAllClasses,
  findCommand,
  findClass,
} from '../src/index.js';

async function exploreApplicationScriptingDefinition() {
  console.log(chalk.bold.blue('📖 Application Scripting Definition Explorer\n'));

  const appPath = '/System/Applications/Messages.app';
  console.log(chalk.yellow(`Loading scripting definition for: ${chalk.white(appPath)}\n`));

  try {
    // Get the application dictionary
    const dictionary = await getApplicationDictionary(appPath);

    // Display suite information
    console.log(chalk.bold('📦 Suites:\n'));
    const suitesTable = new CliTable3({
      head: [chalk.cyan('Suite Name'), chalk.cyan('Code'), chalk.cyan('Description')],
      style: { head: [], border: [] },
      colWidths: [25, 10, 55],
      wordWrap: true,
    });

    for (const suite of dictionary.suites) {
      suitesTable.push([
        chalk.white(suite.name),
        chalk.gray(suite.code),
        chalk.gray(suite.description ?? 'N/A'),
      ]);
    }

    console.log(suitesTable.toString());

    // Display commands
    const commands = getAllCommands(dictionary);
    console.log(chalk.bold(`\n\n💬 Commands (${commands.length} total):\n`));

    const commandsTable = new CliTable3({
      head: [
        chalk.cyan('Command'),
        chalk.cyan('Code'),
        chalk.cyan('Parameters'),
        chalk.cyan('Description'),
      ],
      style: { head: [], border: [] },
      colWidths: [20, 10, 20, 40],
      wordWrap: true,
    });

    for (const command of commands) {
      const paramCount = command.parameters.length;
      const hasDirectParam = command.directParameter ? ' + direct' : '';
      commandsTable.push([
        chalk.white(command.name),
        chalk.gray(command.code),
        chalk.yellow(`${paramCount}${hasDirectParam}`),
        chalk.gray(command.description ?? 'N/A'),
      ]);
    }

    console.log(commandsTable.toString());

    // Display classes
    const classes = getAllClasses(dictionary);
    console.log(chalk.bold(`\n\n📋 Classes (${classes.length} total):\n`));

    const classesTable = new CliTable3({
      head: [
        chalk.cyan('Class'),
        chalk.cyan('Code'),
        chalk.cyan('Properties'),
        chalk.cyan('Elements'),
        chalk.cyan('Description'),
      ],
      style: { head: [], border: [] },
      colWidths: [20, 10, 12, 12, 36],
      wordWrap: true,
    });

    for (const cls of classes) {
      classesTable.push([
        chalk.white(cls.name),
        chalk.gray(cls.code),
        chalk.yellow(cls.properties.length.toString()),
        chalk.yellow(cls.elements.length.toString()),
        chalk.gray(cls.description ?? 'N/A'),
      ]);
    }

    console.log(classesTable.toString());

    // Deep dive into a specific command
    console.log(chalk.bold('\n\n🔍 Command Deep Dive: "send"\n'));
    const sendCommand = findCommand(dictionary, 'send');

    if (sendCommand) {
      console.log(chalk.white(`Name: ${chalk.bold(sendCommand.name)}`));
      console.log(chalk.white(`Code: ${chalk.gray(sendCommand.code)}`));
      console.log(chalk.white(`Description: ${chalk.gray(sendCommand.description ?? 'N/A')}`));

      if (sendCommand.directParameter) {
        console.log(
          chalk.white(`\nDirect Parameter: ${chalk.yellow(sendCommand.directParameter.type)}`),
        );
        if (sendCommand.directParameter.description) {
          console.log(chalk.gray(`  ${sendCommand.directParameter.description}`));
        }
      }

      if (sendCommand.parameters.length > 0) {
        console.log(chalk.white('\nParameters:'));
        for (const param of sendCommand.parameters) {
          const optional = param.optional ? chalk.gray(' (optional)') : '';
          console.log(
            chalk.white(`  ${chalk.bold(param.name)}: ${chalk.yellow(param.type.type)}${optional}`),
          );
          if (param.description) {
            console.log(chalk.gray(`    ${param.description}`));
          }
        }
      }

      if (sendCommand.result) {
        console.log(chalk.white(`\nResult: ${chalk.yellow(sendCommand.result.type)}`));
        if (sendCommand.result.description) {
          console.log(chalk.gray(`  ${sendCommand.result.description}`));
        }
      }
    }

    // Deep dive into a specific class
    console.log(chalk.bold('\n\n🔍 Class Deep Dive: "chat"\n'));
    const chatClass = findClass(dictionary, 'chat');

    if (chatClass) {
      console.log(chalk.white(`Name: ${chalk.bold(chatClass.name)}`));
      console.log(chalk.white(`Code: ${chalk.gray(chatClass.code)}`));
      console.log(chalk.white(`Description: ${chalk.gray(chatClass.description ?? 'N/A')}`));
      if (chatClass.plural) {
        console.log(chalk.white(`Plural: ${chalk.gray(chatClass.plural)}`));
      }
      if (chatClass.inherits) {
        console.log(chalk.white(`Inherits: ${chalk.yellow(chatClass.inherits)}`));
      }

      if (chatClass.properties.length > 0) {
        console.log(chalk.white('\nProperties:'));
        const propsTable = new CliTable3({
          head: [
            chalk.cyan('Property'),
            chalk.cyan('Type'),
            chalk.cyan('Access'),
            chalk.cyan('Description'),
          ],
          style: { head: [], border: [] },
          colWidths: [20, 15, 8, 47],
          wordWrap: true,
        });

        for (const prop of chatClass.properties) {
          propsTable.push([
            chalk.white(prop.name),
            chalk.yellow(prop.type.type),
            chalk.gray(prop.access),
            chalk.gray(prop.description ?? 'N/A'),
          ]);
        }

        console.log(propsTable.toString());
      }

      if (chatClass.elements.length > 0) {
        console.log(chalk.white('\nElements:'));
        for (const elem of chatClass.elements) {
          const access = elem.access ? chalk.gray(` (${elem.access})`) : '';
          console.log(chalk.white(`  ${chalk.yellow(elem.type)}${access}`));
        }
      }
    }

    // Summary
    console.log(chalk.bold.cyan('\n\n📊 Summary:\n'));
    console.log(chalk.white(`Total Suites: ${chalk.yellow(dictionary.suites.length)}`));
    console.log(chalk.white(`Total Commands: ${chalk.yellow(commands.length)}`));
    console.log(chalk.white(`Total Classes: ${chalk.yellow(classes.length)}`));

    const totalProperties = classes.reduce((sum, cls) => sum + cls.properties.length, 0);
    console.log(chalk.white(`Total Properties: ${chalk.yellow(totalProperties)}`));

    console.log(chalk.bold.green('\n✓ Introspection complete!\n'));
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  }
}

// Run the example
exploreApplicationScriptingDefinition().catch(console.error);
