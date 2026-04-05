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

/* -- AST node counter -- */
function countNodes(node) {
  if (!node || typeof node !== 'object') return 0;
  var count = 1;
  Object.values(node).forEach(function(v) {
    if (Array.isArray(v)) v.forEach(function(ch) { if (ch && typeof ch === 'object') count += countNodes(ch); });
    else if (v && typeof v === 'object') count += countNodes(v);
  });
  return count;
}

/* -- Scope data builder -- */
var SCOPE_COLORS = ['#4ec9b0', '#4fc1ff', '#dcdcaa', '#c586c0', '#ce9178'];

function buildScopeData(ast) {
  var scopes = [];

  function walk(node, depth, parentLabel) {
    if (!node) return;
    var label = null, vars = [];

    if (node.type === 'FunctionDecl') {
      label = 'fn: ' + node.name + '()';
      vars  = (node.params || []).map(function(p) { return { name: p.pName, type: p.pType }; });
    }

    if (label) {
      /* Collect var decls directly inside this function body */
      var stmts = node.body ? (node.body.stmts || []) : (node.stmts || []);
      stmts.forEach(function(s) {
        if (s && s.type === 'VarDecl') vars.push({ name: s.name, type: s.typeName });
      });
      scopes.push({
        depth: depth,
        label: label,
        vars:  vars,
        color: SCOPE_COLORS[Math.min(depth, SCOPE_COLORS.length - 1)]
      });
    }

