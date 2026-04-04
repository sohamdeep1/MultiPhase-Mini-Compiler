/**
 * terminal/editor.js
 * Editor pane helpers -- line number sync, cursor tracking,
 * sample loading button handler, and editor event listeners.
 *
 * Functions:
 *   syncLines()          -- rebuild line-number gutter to match editor
 *   loadSample(name)     -- load a named sample into the editor
 *
 * Also attaches the keyup listener for cursor position tracking.
 */

/**
 * syncLines()
 * Rebuilds the line-number gutter so it matches the current
 * number of lines in the textarea. Syncs scroll position.
 * Also updates the char count in the editor footer.
 */

function syncLines() {
  var src   = document.getElementById('src');
  var gutter = document.getElementById('lineNums');
  var count = src.value.split('\n').length;
  var html  = '';
  for (var i = 1; i <= count; i++) html += '<div>' + i + '</div>';
  gutter.innerHTML = html;
  document.getElementById('ef-chars').textContent = src.value.length + ' chars';
}

/**
 * loadSample(name)
 * Called by the sample buttons (basic / loop / func / error).
 * Loads the named sample into the editor, echoes the action
 * in the terminal, and resets the compiled flag.
 */
function loadSample(name) {
  if (!SAMPLES[name]) return;
  document.getElementById('src').value = SAMPLES[name];
  syncLines();
  compiled = false;
  setStatus('dim', 'ready');
  document.getElementById('cmd-input').focus();

  /* Echo in terminal so the session log is self-documenting */
  echoCmd('load ' + name);
  blank();
  tline('Loaded sample: ' + name + '  (' + SAMPLES[name].split('\n').length + ' lines)', 't-ok');
  tline('Run "compile" to process it.', 't-dim');
  blank();

  var o = document.getElementById('output');
  o.scrollTop = o.scrollHeight;
}

/* Cursor position tracker -- updates "Ln X Col Y" in the footer */
document.getElementById('src').addEventListener('keyup', function() {
  var val   = this.value.substring(0, this.selectionStart);
  var lines = val.split('\n');
  document.getElementById('ef-pos').textContent =
    'Ln ' + lines.length + ' Col ' + (lines[lines.length - 1].length + 1);
});

/* Scroll sync -- keep line-number gutter aligned with textarea */
document.getElementById('src').addEventListener('scroll', function() {
  document.getElementById('lineNums').scrollTop = this.scrollTop;
});

