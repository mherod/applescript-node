import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import { sources } from '../src/index.js';

/**
 * Demonstrates the high-level data source APIs for common macOS operations.
 * These APIs provide clean, succinct entry points without needing to build scripts manually.
 */
async function demonstrateDataSources() {
  console.log(chalk.bold.blue('🎯 applescript-node Data Sources Demo\n'));
  console.log(
    chalk.gray('Demonstrating high-level APIs for common macOS data sourcing operations.\n'),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('💻 System Information\n'));

  try {
    const systemInfo = await sources.system.getInfo();

    const systemTable = new CliTable3({
      head: [chalk.cyan('Property'), chalk.cyan('Value')],
      style: { head: [], border: [] },
      colWidths: [25, 55],
    });

    systemTable.push(
      [chalk.white('Computer Name'), chalk.yellow(systemInfo.computerName)],
      [chalk.white('Hostname'), chalk.yellow(systemInfo.hostname)],
      [chalk.white('OS Version'), chalk.yellow(systemInfo.osVersion)],
      [chalk.white('User'), chalk.yellow(systemInfo.userName)],
      [chalk.white('Home Directory'), chalk.gray(systemInfo.homeDirectory)],
      [chalk.white('Architecture'), chalk.yellow(systemInfo.architecture)],
    );

    console.log(systemTable.toString());

    // Check dark mode
    const isDarkMode = await sources.system.isDarkMode();
    console.log(
      chalk.gray(
        `\nDark Mode: ${isDarkMode ? chalk.green('✓ Enabled') : chalk.yellow('✗ Disabled')}`,
      ),
    );

    // Get uptime
    const uptime = await sources.system.getUptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    console.log(chalk.gray(`System Uptime: ${hours}h ${minutes}m`));
  } catch (error) {
    console.error(chalk.red('✗ Failed to get system info:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOLUMES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('\n\n💾 Mounted Volumes\n'));

  try {
    const volumes = await sources.system.getVolumes();

    const volumesTable = new CliTable3({
      head: [
        chalk.cyan('Name'),
        chalk.cyan('Capacity'),
        chalk.cyan('Used'),
        chalk.cyan('Free'),
        chalk.cyan('Format'),
      ],
      style: { head: [], border: [] },
      colWidths: [20, 15, 15, 15, 15],
    });

    volumes.forEach((vol) => {
      const capacityGB = (vol.capacity / 1e9).toFixed(1);
      const usedGB = (vol.usedSpace / 1e9).toFixed(1);
      const freeGB = (vol.freeSpace / 1e9).toFixed(1);
      const usedPercent = Math.round((vol.usedSpace / vol.capacity) * 100);

      volumesTable.push([
        chalk.white(vol.name),
        chalk.yellow(`${capacityGB} GB`),
        chalk.blue(`${usedGB} GB (${usedPercent}%)`),
        chalk.green(`${freeGB} GB`),
        chalk.gray(vol.format || 'Unknown'),
      ]);
    });

    console.log(volumesTable.toString());
  } catch (error) {
    console.error(chalk.red('✗ Failed to get volumes:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('\n\n📱 Running Applications\n'));

  try {
    const apps = await sources.applications.getAll();

    const appsTable = new CliTable3({
      head: [
        chalk.cyan('Name'),
        chalk.cyan('Windows'),
        chalk.cyan('PID'),
        chalk.cyan('Status'),
        chalk.cyan('Bundle ID'),
      ],
      style: { head: [], border: [] },
      colWidths: [20, 10, 8, 15, 35],
      wordWrap: true,
    });

    // Sort by frontmost first, then by name
    const sortedApps = apps.sort((a, b) => {
      if (a.frontmost) return -1;
      if (b.frontmost) return 1;
      return a.name.localeCompare(b.name);
    });

    sortedApps.slice(0, 15).forEach((app) => {
      const status = app.frontmost
        ? chalk.green('● Active')
        : app.visible
          ? chalk.blue('○ Visible')
          : chalk.gray('○ Hidden');

      appsTable.push([
        app.frontmost ? chalk.bold.white(app.name) : chalk.white(app.name),
        chalk.yellow(app.windowCount.toString()),
        chalk.gray(app.pid.toString()),
        status,
        chalk.gray(app.bundleId || '-'),
      ]);
    });

    console.log(appsTable.toString());

    if (apps.length > 15) {
      console.log(chalk.gray(`\n(Showing 15 of ${apps.length} applications)`));
    }

    // Show frontmost application
    const frontmost = await sources.applications.getFrontmost();
    console.log(
      chalk.gray(
        `\nFrontmost Application: ${chalk.bold.white(frontmost.name)} (${frontmost.windowCount} windows)`,
      ),
    );
  } catch (error) {
    console.error(chalk.red('✗ Failed to get applications:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WINDOWS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('\n\n🪟 Open Windows\n'));

  try {
    const windows = await sources.windows.getAll();

    const windowsTable = new CliTable3({
      head: [
        chalk.cyan('#'),
        chalk.cyan('Window Name'),
        chalk.cyan('Application'),
        chalk.cyan('Position'),
        chalk.cyan('Size'),
      ],
      style: { head: [], border: [] },
      colWidths: [5, 30, 20, 15, 15],
      wordWrap: true,
    });

    windows.slice(0, 15).forEach((win, idx) => {
      const position = `${win.bounds.x}, ${win.bounds.y}`;
      const size = `${win.bounds.width}×${win.bounds.height}`;

      windowsTable.push([
        chalk.gray((idx + 1).toString()),
        chalk.white(win.name || 'Untitled'),
        chalk.blue(win.app),
        chalk.yellow(position),
        chalk.green(size),
      ]);
    });

    console.log(windowsTable.toString());

    if (windows.length > 15) {
      console.log(chalk.gray(`\n(Showing 15 of ${windows.length} windows)`));
    }

    // Show window count by application
    const windowCounts = await sources.windows.getCountByApp();
    const topApps = Object.entries(windowCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(chalk.bold.white('\n📊 Top 5 Applications by Window Count:'));
    topApps.forEach(([app, count], idx) => {
      console.log(chalk.gray(`  ${idx + 1}. ${app}: ${chalk.yellow(count)} windows`));
    });

    // Show frontmost window
    const frontmostWindow = await sources.windows.getFrontmost();
    if (frontmostWindow) {
      console.log(
        chalk.gray(
          `\nFrontmost Window: ${chalk.bold.white(frontmostWindow.name)} (${frontmostWindow.app})`,
        ),
      );
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to get windows:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAYS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('\n\n🖥️  Displays\n'));

  try {
    const displays = await sources.system.getDisplays();

    const displaysTable = new CliTable3({
      head: [chalk.cyan('Display'), chalk.cyan('Resolution'), chalk.cyan('Position')],
      style: { head: [], border: [] },
      colWidths: [10, 20, 20],
    });

    displays.forEach((display) => {
      displaysTable.push([
        chalk.white(`Display ${display.id}`),
        chalk.yellow(`${display.bounds.width}×${display.bounds.height}`),
        chalk.gray(`(${display.bounds.x}, ${display.bounds.y})`),
      ]);
    });

    console.log(displaysTable.toString());
  } catch (error) {
    console.error(chalk.red('✗ Failed to get displays:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIPBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.cyan('\n\n📋 Clipboard\n'));

  try {
    const clipboard = await sources.system.getClipboard();
    const preview = clipboard.length > 100 ? clipboard.slice(0, 100) + '...' : clipboard;
    console.log(chalk.gray(`Clipboard contents (${clipboard.length} chars):`));
    console.log(chalk.white(`  ${preview}\n`));

    // Test setting clipboard
    const testText = `applescript-node test ${Date.now()}`;
    await sources.system.setClipboard(testText);
    console.log(chalk.green('✓ Successfully set clipboard'));

    const verifyClipboard = await sources.system.getClipboard();
    if (verifyClipboard === testText) {
      console.log(chalk.green('✓ Clipboard verified\n'));
    }

    // Restore original clipboard
    await sources.system.setClipboard(clipboard);
  } catch (error) {
    console.error(chalk.red('✗ Failed to access clipboard:'), error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(chalk.bold.green('\n\n✅ Data Sources API Benefits:\n'));
  console.log(chalk.gray('• Simple, async functions for common operations'));
  console.log(chalk.gray('• No need to manually build AppleScript code'));
  console.log(chalk.gray('• Fully typed return values with TypeScript'));
  console.log(chalk.gray('• Automatic JSON parsing and error handling'));
  console.log(chalk.gray('• Clean, discoverable API surface'));
  console.log(chalk.gray('• Still have access to low-level builder API when needed\n'));

  console.log(chalk.bold.blue('💡 Example Usage:\n'));
  console.log(chalk.dim('  import { sources } from "applescript-node";\n'));
  console.log(chalk.dim('  // Get all open windows'));
  console.log(chalk.dim('  const windows = await sources.windows.getAll();\n'));
  console.log(chalk.dim('  // Get running applications'));
  console.log(chalk.dim('  const apps = await sources.applications.getAll();\n'));
  console.log(chalk.dim('  // Get system information'));
  console.log(chalk.dim('  const info = await sources.system.getInfo();\n'));

  console.log(chalk.bold.green('✓ Data sources demo complete!\n'));
}

// Run the demonstration
demonstrateDataSources().catch(console.error);
