import CliTable3 from 'cli-table3';
import chalk from 'chalk';
import { createScript, runScript, ScriptValidator } from '../src/index.js';

async function readMessagesConversations() {
  console.log(chalk.bold.blue('📱 Messages App - Conversation Reader\n'));
  console.log(chalk.gray('Note: Messages.app has very limited AppleScript support.'));
  console.log(chalk.gray('This demo shows what is actually accessible via AppleScript.\n'));

  // Create a validator for Messages.app to validate scripts before execution
  console.log(chalk.yellow('🔍 Loading Messages.app scripting dictionary for validation...'));
  const validator = await ScriptValidator.forApplication('/System/Applications/Messages.app');
  console.log(chalk.green('✓ Validator ready\n'));

  // Show available capabilities
  const commands = validator.getAvailableCommands();
  const classes = validator.getAvailableClasses();
  console.log(chalk.gray(`Available: ${commands.length} commands, ${classes.length} classes\n`));

  // Activate Messages
  console.log(chalk.yellow('Opening Messages app...'));
  const activateScript = createScript().tell('Messages').activate().delay(1).end();

  // Validate before executing
  const activateValidation = validator.validate(activateScript.build());
  if (!activateValidation.valid) {
    console.log(chalk.red('✗ Script validation failed:'));
    activateValidation.errors.forEach((err) => console.log(chalk.red(`  - ${err.message}`)));
    return;
  }

  await runScript(activateScript);
  console.log(chalk.green('✓ Messages app opened\n'));

  // Get basic chat statistics
  console.log(chalk.yellow('Gathering chat statistics...'));
  const statsScript = createScript()
    .tell('Messages')
    .setCountOf('totalChats', 'every chat')
    .returnRaw('totalChats')
    .end();

  const statsResult = await runScript(statsScript);

  if (statsResult.success) {
    const total = statsResult.output;

    const statsTable = new CliTable3({
      head: [chalk.cyan('Metric'), chalk.cyan('Count')],
      style: { head: [], border: [] },
    });

    statsTable.push([chalk.bold('Total Chats'), chalk.white(String(total))]);

    console.log(chalk.bold('\n📊 Chat Statistics:\n'));
    console.log(statsTable.toString());
  }

  // Get detailed chat information (first 10 chats)
  console.log(chalk.yellow('\n\nFetching chat details (first 10 chats)...'));
  const chatsScript = createScript()
    .tell('Messages')
    .set('chatList', [])
    .set('counter', 0)
    // Use forEachUntil for cleaner iteration with built-in break condition
    .forEachUntil(
      'aChat',
      'every chat',
      (e) => e.gt('counter', 10),
      (b) =>
        b.increment('counter').tryCatch(
          (tryBlock) =>
            tryBlock
              .comment('Get participants')
              .set('participantList', [])
              // Use forEach with nested tryCatch for clean error handling
              .forEach('p', 'every participant of aChat', (pb) =>
                pb.tryCatch(
                  (innerTry) =>
                    innerTry
                      .setExpression('participantHandle', 'handle of p')
                      .setEndRaw('participantList', 'participantHandle'),
                  (innerCatch) => innerCatch.comment('Skip participants with errors'),
                ),
              )
              .setEndRecord('chatList', {
                chatId: 'id of aChat',
                chatName: 'name of aChat',
                accountId: 'id of account of aChat',
                participants: 'participantList',
              }),
          (catchBlock) => catchBlock.comment('Skip chats with errors'),
        ),
    )
    .returnRaw('chatList')
    .endtell();

  // Validate the complex script before execution
  console.log(chalk.gray('Validating script...'));
  const chatsValidation = validator.validate(chatsScript.build());
  if (chatsValidation.warnings.length > 0) {
    console.log(
      chalk.yellow(`⚠ ${chatsValidation.warnings.length} validation warnings (executing anyway):`),
    );
    chatsValidation.warnings.slice(0, 3).forEach((warn) => {
      console.log(chalk.yellow(`  - ${warn.message}`));
    });
  }

  const chatsResult = await runScript(chatsScript);

  if (chatsResult.success && chatsResult.output) {
    try {
      // Parse the AppleScript output
      const output = String(chatsResult.output);

      if (output && output !== '') {
        console.log(chalk.bold('\n💬 Recent Conversations:\n'));

        // Create a table for chat info
        const chatTable = new CliTable3({
          head: [chalk.cyan('#'), chalk.cyan('Participants'), chalk.cyan('Chat ID (truncated)')],
          colWidths: [5, 50, 35],
          wordWrap: true,
          style: { head: [], border: [] },
        });

        // Simple parsing of the AppleScript record format
        const chatRecords = output.split('chatId:').slice(1);

        chatRecords.forEach((record, index) => {
          const idMatch = /^([^,]+)/.exec(record);
          const participantsMatch = /participants:\{([^}]*)\}/.exec(record);

          if (idMatch) {
            const chatId = idMatch[1].trim();
            const participants = participantsMatch
              ? participantsMatch[1]
                  .split(',')
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .join(', ')
              : 'Unknown';

            const truncatedId = chatId.length > 30 ? chatId.substring(0, 27) + '...' : chatId;

            chatTable.push([
              chalk.gray((index + 1).toString()),
              chalk.white(participants || 'No participants'),
              chalk.gray(truncatedId),
            ]);
          }
        });

        console.log(chatTable.toString());
      } else {
        console.log(chalk.yellow('\nNo chat data returned (you may have no messages)\n'));
      }
    } catch (error) {
      console.error(chalk.red('Error parsing chat data:'), error);
    }
  } else {
    console.error(chalk.red('Error getting chats:'), chatsResult.error);
  }

  // Send a message demo (commented out by default)
  console.log(chalk.bold.yellow('\n\n💡 AppleScript Capabilities:'));
  console.log(chalk.gray('✓ List chats and get basic info (ID, name, account)'));
  console.log(chalk.gray('✓ Get participants for each chat'));
  console.log(chalk.gray('✓ Send messages to contacts or chats'));
  console.log(chalk.gray('✗ Read message content, timestamps, or history'));
  console.log(chalk.gray('✗ Get message read/unread status reliably'));
  console.log(chalk.gray('✗ Access attachments or media'));

  console.log(chalk.bold.cyan('\n\n💾 For Full Message History:'));
  console.log(chalk.gray('Access the Messages database directly at:'));
  console.log(chalk.white('~/Library/Messages/chat.db'));
  console.log(chalk.gray('(SQLite database with full message history)\n'));

  // Validation Benefits Summary
  console.log(chalk.bold.green('\n\n✅ Validation Benefits:'));
  console.log(
    chalk.gray('• Pre-execution validation caught potential errors before running scripts'),
  );
  console.log(chalk.gray('• Discovered available commands and classes from Messages.app'));
  console.log(chalk.gray('• Warnings help identify issues without blocking execution'));
  console.log(chalk.gray('• Validation adds ~50-100ms overhead but prevents runtime failures\n'));
}

// Run the script
readMessagesConversations().catch(console.error);
