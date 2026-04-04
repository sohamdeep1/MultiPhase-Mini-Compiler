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

