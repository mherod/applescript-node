import { writeFileSync } from 'node:fs';
import { createScript, runScript } from 'applescript-node';

/**
 * Terminal & iTerm2 Text Input Automation
 *
 * Demonstrates two approaches for sending commands to terminal applications:
 *
 * 1. **Native Application Scripting** (recommended)
 *    - Terminal.app: `do script` — sends commands directly via the app's API
 *    - iTerm2: `write text` — targets specific sessions, tabs, or panes
 *    - Works in the background, doesn't steal focus, no input collision
 *
 * 2. **UI Scripting via System Events** (fallback)
 *    - Uses `keystroke` to simulate physical keyboard input
 *    - Universal (works with any app) but fragile — requires foreground focus
 *    - Risk of input interleaving if the user types simultaneously
 *
 * Security note: Both approaches require Automation permissions under
 * System Settings > Privacy & Security > Automation.
 * UI scripting additionally requires Accessibility permissions.
 */

const out = console.log.bind(console);

async function main() {
  out('Terminal & iTerm2 Input Automation\n');

  // ──────────────────────────────────────────────────────────────────
  // 1. Terminal.app — Native scripting with `do script`
  // ──────────────────────────────────────────────────────────────────
  // `do script` sends a shell command directly to a Terminal window.
  // It works in the background — no focus required, no keystroke simulation.

  out('--- Example 1: Terminal.app — do script (single command) ---');
  const terminalSingle = createScript()
    .tell('Terminal')
    .activate()
    .comment('Send a command to the frontmost Terminal window')
    .do('echo "Hello from applescript-node"')
    .end();

  const terminalSingleScript = terminalSingle.build();
  writeFileSync('examples/output/terminal-do-script.applescript', terminalSingleScript);
  out('Generated script:');
  out(terminalSingleScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 2. Terminal.app — Open a new window with a command
  // ──────────────────────────────────────────────────────────────────
  // When `do script` is called without specifying a window, Terminal
  // opens a new window and runs the command there.

  out('--- Example 2: Terminal.app — new window with command ---');
  const terminalNewWindow = createScript()
    .tell('Terminal')
    .activate()
    .comment('Open a new window by omitting the "in" clause')
    .raw('do script "uptime"')
    .end();

  const terminalNewWindowScript = terminalNewWindow.build();
  writeFileSync('examples/output/terminal-new-window.applescript', terminalNewWindowScript);
  out('Generated script:');
  out(terminalNewWindowScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 3. Terminal.app — Run in a specific window
  // ──────────────────────────────────────────────────────────────────
  // Target a specific window by referencing it. This keeps your
  // automation contained to one session.

  out('--- Example 3: Terminal.app — target front window ---');
  const terminalTargetWindow = createScript()
    .tell('Terminal')
    .activate()
    .comment('Run command in the front window specifically')
    .raw('do script "pwd && ls -la" in front window')
    .end();

  const terminalTargetWindowScript = terminalTargetWindow.build();
  writeFileSync('examples/output/terminal-target-window.applescript', terminalTargetWindowScript);
  out('Generated script:');
  out(terminalTargetWindowScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 4. Terminal.app — Multiple sequential commands
  // ──────────────────────────────────────────────────────────────────

  out('--- Example 4: Terminal.app — multiple commands ---');
  const terminalMulti = createScript()
    .tell('Terminal')
    .activate()
    .comment('Chain multiple commands in the front window')
    .raw('do script "echo \'Step 1: checking directory\'" in front window')
    .delay(0.5)
    .raw('do script "pwd" in front window')
    .delay(0.5)
    .raw('do script "echo \'Step 2: listing files\'" in front window')
    .delay(0.5)
    .raw('do script "ls" in front window')
    .end();

  const terminalMultiScript = terminalMulti.build();
  writeFileSync('examples/output/terminal-multi-commands.applescript', terminalMultiScript);
  out('Generated script:');
  out(terminalMultiScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 5. iTerm2 — Native scripting with `write text`
  // ──────────────────────────────────────────────────────────────────
  // iTerm2 exposes a rich scripting dictionary. `write text` sends
  // input to a specific session — it can target individual tabs,
  // split panes, and windows without requiring focus.

  out('--- Example 5: iTerm2 — write text (current session) ---');
  const itermBasic = createScript()
    .tell('iTerm')
    .activate()
    .comment('Send text to the current session of the current window')
    .tellTarget('current session of current window')
    .raw('write text "echo \\"Hello from iTerm2 scripting\\""')
    .end()
    .end();

  const itermBasicScript = itermBasic.build();
  writeFileSync('examples/output/iterm-write-text.applescript', itermBasicScript);
  out('Generated script:');
  out(itermBasicScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 6. iTerm2 — Create a new tab and send commands
  // ──────────────────────────────────────────────────────────────────

  out('--- Example 6: iTerm2 — new tab with commands ---');
  const itermNewTab = createScript()
    .tell('iTerm')
    .activate()
    .comment('Create a new tab in the current window')
    .tellTarget('current window')
    .raw('set newTab to (create tab with default profile)')
    .comment('Send commands to the new tab session')
    .tellTarget('current session of newTab')
    .raw('write text "echo \\"Running in a new tab\\""')
    .delay(0.5)
    .raw('write text "date"')
    .end()
    .end()
    .end();

  const itermNewTabScript = itermNewTab.build();
  writeFileSync('examples/output/iterm-new-tab.applescript', itermNewTabScript);
  out('Generated script:');
  out(itermNewTabScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 7. iTerm2 — Split panes and send to each
  // ──────────────────────────────────────────────────────────────────
  // iTerm2's scripting dictionary lets you create split panes and
  // target each independently — useful for side-by-side monitoring.

  out('--- Example 7: iTerm2 — split pane automation ---');
  const itermSplit = createScript()
    .tell('iTerm')
    .activate()
    .tellTarget('current session of current window')
    .comment('Send a command to the existing pane')
    .raw('write text "echo \\"Left pane\\""')
    .comment('Split the pane vertically and capture the new session')
    .raw('set rightPane to (split vertically with default profile)')
    .end()
    .comment('Send a command to the new right pane')
    .tellTarget('rightPane')
    .raw('write text "echo \\"Right pane\\""')
    .end()
    .end();

  const itermSplitScript = itermSplit.build();
  writeFileSync('examples/output/iterm-split-panes.applescript', itermSplitScript);
  out('Generated script:');
  out(itermSplitScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 8. UI Scripting — keystroke fallback (any app)
  // ──────────────────────────────────────────────────────────────────
  // When an app has no scripting dictionary, UI scripting is the
  // only option. This simulates keyboard input via System Events.
  //
  // WARNING: Requires foreground focus and Accessibility permissions.
  // The user's typing will interleave with the script's keystrokes.

  out('--- Example 8: UI Scripting — keystroke fallback ---');
  const uiScripting = createScript()
    .tell('Terminal')
    .activate()
    .end()
    .comment('Wait for Terminal to come to the foreground')
    .delay(0.5)
    .tell('System Events')
    .comment('Verify Terminal is frontmost before typing')
    .raw('repeat until (name of first process whose frontmost is true) is "Terminal"')
    .delay(0.1)
    .raw('end repeat')
    .comment('Now safe to send keystrokes')
    .keystroke('echo "Typed via UI scripting"')
    .keystroke('\r')
    .end();

  const uiScriptingScript = uiScripting.build();
  writeFileSync('examples/output/terminal-ui-scripting.applescript', uiScriptingScript);
  out('Generated script:');
  out(uiScriptingScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // 9. Safe UI Scripting — with focus guard
  // ──────────────────────────────────────────────────────────────────
  // A defensive pattern: check if the app is running, activate it,
  // wait for focus, then type. Displays a notification on failure.

  out('--- Example 9: Safe UI scripting with focus guard ---');
  const safeUiScripting = createScript()
    .set('targetApp', 'Terminal')
    .if('application targetApp is running')
    .raw('tell application targetApp to activate')
    .tell('System Events')
    .comment('Wait until the target app is actually frontmost')
    .raw('repeat until (name of first process whose frontmost is true) is targetApp')
    .delay(0.1)
    .raw('end repeat')
    .comment('Safe to type — app is confirmed frontmost')
    .keystroke('echo "Safe input achieved"')
    .keystroke('\r')
    .end()
    .else()
    .raw('display notification "App not running" with title "Automation Error"')
    .endif();

  const safeUiScriptingScript = safeUiScripting.build();
  writeFileSync('examples/output/terminal-safe-ui-scripting.applescript', safeUiScriptingScript);
  out('Generated script:');
  out(safeUiScriptingScript);
  out('');

  // ──────────────────────────────────────────────────────────────────
  // Run one of the examples (Terminal native scripting)
  // ──────────────────────────────────────────────────────────────────
  out('=== Running Example 1 (Terminal.app — do script) ===\n');
  const result = await runScript(terminalSingle);
  if (result.success) {
    out('Terminal command sent successfully');
    if (result.output) {
      out(
        `Output: ${typeof result.output === 'string' ? result.output : JSON.stringify(result.output)}`,
      );
    }
  } else {
    out(`Error: ${String(result.error)}`);
    out('(Make sure Terminal.app is open and Automation permissions are granted)');
  }

  out('\nAll generated scripts saved to examples/output/');
  out('  terminal-do-script.applescript');
  out('  terminal-new-window.applescript');
  out('  terminal-target-window.applescript');
  out('  terminal-multi-commands.applescript');
  out('  iterm-write-text.applescript');
  out('  iterm-new-tab.applescript');
  out('  iterm-split-panes.applescript');
  out('  terminal-ui-scripting.applescript');
  out('  terminal-safe-ui-scripting.applescript');
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
});
