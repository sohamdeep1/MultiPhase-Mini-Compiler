/**
 * terminal/output.js
 * Low-level terminal output primitives.
 *
 * Every piece of output on the right pane goes through
 * one of these helpers, keeping rendering consistent
 * and easy to restyle.
 *
 * Functions:
 *   esc(s)          -- HTML-escape a string
 *   out(html)       -- append raw HTML block to output
 *   blank()         -- insert a blank spacer line
 *   tline(text,cls) -- append a plain text line
 *   echoCmd(cmd)    -- echo the typed command with prompt
 *   ruler()         -- horizontal divider
 *   progress()      -- animated 2px progress bar
 */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function out(html) {
  var el  = document.createElement('div');
  el.className = 'fade-in';
  el.innerHTML = html;
  var container = document.getElementById('output');
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function blank() {
  out('<div class="t-blank"></div>');
}

