/**
 * terminal/input.js
 * Keyboard input handling for the terminal prompt.
 *
 * Handles:
 *   Enter       -- parse and execute typed command
 *   Arrow Up    -- scroll back through command cmdHistory
 *   Arrow Down  -- scroll forward through command cmdHistory
 *   Tab         -- autocomplete command name
 *   Ctrl + L    -- clear terminal output
 */

function handleKey(e) {
  var input = document.getElementById('cmd-input');

  /* Enter -- execute command */
  if (e.key === 'Enter') {
    var raw = input.value.trim();
    input.value = '';
    if (!raw) return;

    /* Save to cmdHistory (most recent first) */
    cmdHistory.unshift(raw);
    cmdHistIdx = -1;

    echoCmd(raw);
    blank();

    var parts = raw.split(/\s+/);
    var cmd   = parts[0].toLowerCase();
    var args  = parts.slice(1);

    if (COMMANDS[cmd]) {
      try {
        COMMANDS[cmd](args);
      } catch (err) {
        tline('[!] Error executing command: ' + err.message, 't-err');
        console.error('[cmd:' + cmd + ']', err);
      }
    } else {
      tline('Unknown command: ' + esc(cmd) + '  -- type "help" for a list', 't-err');
    }

    blank();
    /* Scroll output to bottom */
    var o = document.getElementById('output');
    o.scrollTop = o.scrollHeight;
    return;
  }

  /* Arrow Up -- older cmdHistory entry */
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdHistIdx < cmdHistory.length - 1) {
      cmdHistIdx++;
      input.value = cmdHistory[cmdHistIdx];
    }
    return;
  }

  /* Arrow Down -- newer cmdHistory entry */
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (cmdHistIdx > 0) {
      cmdHistIdx--;
      input.value = cmdHistory[cmdHistIdx];
    } else {
      cmdHistIdx = -1;
      input.value = '';
    }
    return;
  }

  /* Ctrl + L -- clear screen */
  if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    COMMANDS.clear();
    return;
  }

  /* Tab -- autocomplete command name */
  if (e.key === 'Tab') {
    e.preventDefault();
    var partial = input.value.toLowerCase();
    if (!partial) return;
    var match = Object.keys(COMMANDS).find(function(k) {
      return k.startsWith(partial) && k !== partial;
    });
    if (match) input.value = match;
  }
}
