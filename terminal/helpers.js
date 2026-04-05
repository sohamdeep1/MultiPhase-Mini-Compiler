/**
 * terminal/helpers.js
 * Utility functions used by the command handlers.
 *
 * Functions:
 *   needCompiled()          -- guard: warn if nothing compiled yet
 *   setStatus(type, msg)    -- update editor footer status dot + text
 *   countNodes(node)        -- count total nodes in an AST
 *   buildScopeData(ast)     -- build scope list for visualiser
 *   printNode(node, ...)    -- recursively print AST as a tree
 */

/* -- Guard -- */
function needCompiled() {
  if (!compiled) {
    tline('[!] Nothing compiled yet. Run: compile', 't-warn');
  }
}

/* -- Editor footer status -- */
function setStatus(type, msg) {
  var dot = document.getElementById('ef-dot');
  var txt = document.getElementById('ef-msg');
  if (type === 'ok')    dot.style.background = '#4ec9b0';
  else if (type === 'error') dot.style.background = '#f44747';
  else if (type === 'warn')  dot.style.background = '#ffcc02';
  else                       dot.style.background = '#3d4450';
  txt.textContent = msg;
}

